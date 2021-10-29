import { BroadcastOperator } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

import { io } from '../';
import { getSnowflake, validate } from '../utils/functions';
import { Message } from '../utils/interfaces';
import { validateChatMessage, validateGameSettings } from '../utils/schemes';
import { Game, GameError, getGameErrorMessage } from './Game';
import Player from './Player';

type PlayerPredicate = (val: Player) => boolean;

export default class Room {
    readonly id: string = getSnowflake();

    private _locked: boolean = false;
    private players: Player[] = [];
    private chatMessages: Message[] = [];
    private gameMessages: Message[] = [];
    private game: Game = new Game();
    private ownerPayload: string;
    private roomSocket: BroadcastOperator<DefaultEventsMap> = io.to(this.id);

    get locked() {
        return this._locked;
    }

    setLockStatus(locked: boolean) {
        this._locked = locked;
    }

    setOwner(payload: string) {
        this.ownerPayload = payload;
    }

    isPlayerOwner(payload: string) {
        return this.ownerPayload === payload;
    }

    findPlayer(predicate: PlayerPredicate) {
        return this.players.find(predicate);
    }

    getRoomData() {
        return {
            id: this.id,
            locked: this.locked,
            players: this.players
                .map(p => ({
                    name: p.payload.name,
                    socketId: p.socketId,
                    owner: p.owner,
                    points: p.points
                }))
                .sort((a, b) => b.points - a.points)
                .sort((a, b) => Number(b.owner) - Number(a.owner)),
            chatMessages:
                this.chatMessages.length > 100
                    ? this.chatMessages.slice(-100)
                    : this.chatMessages,
            gameMessages:
                this.gameMessages.length > 100
                    ? this.gameMessages.slice(-100)
                    : this.gameMessages,
            game: {
                lastWord: this.game.lastWord,
                wordsCount: this.game.wordsCount,
                ppw: this.game.ppw,
                ppf: this.game.ppf,
                reuse: this.game.reuse,
                requiredWords: this.game.minToFinish
            }
        };
    }

    addPlayer(player: Player) {
        if (this.findPlayer(p => p.socketId === player.socketId)) return;

        if (this.locked && !player.owner)
            return player.socket.emit('room-locked');

        this.players.push(player);
        player.socket.join(this.id);

        this.addSocketListeners(player);

        const data = this.getRoomData();
        Object.assign(data, {
            self: {
                owner: player.owner,
                name: player.payload.name,
                socketId: player.socketId,
                points: player.points
            }
        });
        player.socket.emit('data', data);

        this.roomSocket.emit('user-joined', data.players);

        this.sendChatMessage({
            system: true,
            content: `${player.payload.name} joined to game.`
        });
    }

    removePlayer(predicate: PlayerPredicate, showLeft: boolean = true) {
        const player = this.findPlayer(predicate);
        if (!player) return;

        this.players.splice(
            this.players.findIndex(p => p.socketId === player.socketId),
            1
        );
        this.removeSocketListeners(player);
        player.socket.leave(this.id);

        this.roomSocket.emit('user-left', this.getRoomData().players);

        if (showLeft)
            this.sendChatMessage({
                system: true,
                content: `${player.payload.name} left from game.`
            });
    }

    addSocketListeners(player: Player) {
        const checkPermission = () => {
            if (player.socket.handshake.auth.token !== this.ownerPayload)
                return;
        };

        const onDisconnect = () =>
            this.removePlayer(p => p.socketId === player.socketId);

        const onChangeLockStatus = () => {
            checkPermission();
            this.setLockStatus(!this.locked);
            this.roomSocket.emit('lock-status-changed', this.locked);
            this.sendChatMessage({
                system: true,
                content: `Game room ${this.locked ? 'locked' : 'unlocked'}.`
            });
        };

        const onLeave = () => {
            onDisconnect();
            player.socket.emit('left');
        };

        const onKickUser = (socketId: string) => {
            checkPermission();

            const player = this.findPlayer(p => p.socketId === socketId);
            if (!player) return;

            this.removePlayer(p => p.socketId === socketId, false);
            player.socket.emit('left');

            this.sendChatMessage({
                system: true,
                content: `${player.payload.name} kicked from game.`
            });
        };

        const onSendChatMessage = async (content: string) => {
            try {
                await validate(validateChatMessage, content);

                this.sendChatMessage({
                    sender: player.payload.name,
                    system: false,
                    content
                });
            } catch (error) {
                player.socket.emit('swal-error', error);
            }
        };

        const onSendGameMessage = async (content: string) => {
            try {
                const result = await this.game.append(content, player.socketId);
                var message: Message;

                if (result.finished) {
                    this.sendGameMessage({
                        sender: player.payload.name,
                        content: result.incomingWord
                    });

                    message = {
                        system: true,
                        content: `${player.payload.name} finished the game.`
                    };

                    player.increasePoints(this.game.ppw + this.game.ppf);
                } else {
                    player.increasePoints(this.game.ppw);

                    message = {
                        sender: player.payload.name,
                        content: result.incomingWord
                    };
                }

                this.sendGameMessage(message);
            } catch (ex) {
                player.socket.emit('game-message', {
                    system: true,
                    content: getGameErrorMessage(ex as GameError)
                });
            }
        };

        const onChangeGameSettings = async (
            ppw: number,
            ppf: number,
            reuse: boolean,
            requiredWords: number
        ) => {
            checkPermission();

            try {
                await validate(validateGameSettings, {
                    ppw,
                    ppf,
                    reuse,
                    requiredWords
                });

                this.game.ppw = ppw;
                this.game.ppf = ppf;
                this.game.reuse = reuse;
                this.game.minToFinish = requiredWords;

                this.roomSocket.emit(
                    'update-game-settings',
                    ppw,
                    ppf,
                    reuse,
                    requiredWords
                );

                this.sendGameMessage({
                    system: true,
                    content: 'Game settings updated.'
                });
            } catch (error) {
                player.socket.emit('swal-error', error);
            }
        };

        player.socket.on('disconnect', onDisconnect);
        player.socket.on('change-lock-status', onChangeLockStatus);
        player.socket.on('leave', onLeave);
        player.socket.on('kick-user', onKickUser);
        player.socket.on('send-chat-message', onSendChatMessage);
        player.socket.on('send-game-message', onSendGameMessage);
        player.socket.on('change-game-settings', onChangeGameSettings);
    }

    removeSocketListeners(player: Player) {
        const remove = (eventName: string) =>
            player.socket.removeAllListeners(eventName);

        [
            'disconnect',
            'change-lock-status',
            'leave',
            'kick-user',
            'send-chat-message',
            'send-game-message',
            'change-game-settings'
        ].forEach(x => remove(x));
    }

    sendChatMessage(message: Message) {
        this.chatMessages.push(message);
        this.roomSocket.emit('chat-message', message);
    }

    sendGameMessage(message: Message) {
        this.gameMessages.push(message);
        this.roomSocket.emit(
            'game-message',
            message,
            this.game.lastWord,
            this.game.wordsCount,
            this.getRoomData().players
        );
    }
}
