import { Socket } from 'socket.io';

import Player from '../models/Player';
import Room from '../models/Room';
import { createPayload, signJWT, validate, verifyJWT } from './functions';
import { Payload } from './interfaces';
import { validateName, validateRoomKey } from './schemes';

const rooms = new Map<string, Room>();

export default (socket: Socket) => {
    const onRequestJoinRoom = async (key: string, name: string) => {
        try {
            await validate(validateName, name);
            await validate(validateRoomKey, key);

            const room = rooms.get(key);
            if (!room) return socket.emit('swal-error', 'Room not found.');

            socket.emit('payload', signJWT(createPayload(name, room.id)));
        } catch (error) {
            socket.emit('swal-error', error);
        }
    };

    const onCreateRoom = async (name: string) => {
        try {
            await validate(validateName, name);

            const room = new Room();
            room.setLockStatus(true);

            const payload = signJWT(createPayload(name, room.id));
            room.setOwner(payload);

            rooms.set(room.id, room);

            socket.emit('payload', payload);
        } catch (error) {
            socket.emit('swal-error', error);
        }
    };

    const onJoinRoom = () => {
        const payload = verifyJWT<Payload>(socket.handshake.auth.token);
        if (!payload) return socket.emit('invalid-payload');

        const room = rooms.get(payload.room);
        if (!room) return socket.emit('room-not-found');

        room.addPlayer(
            new Player(
                socket,
                payload,
                room.isPlayerOwner(socket.handshake.auth.token)
            )
        );
    };

    socket.on('request-join-room', onRequestJoinRoom);
    socket.on('create-room', onCreateRoom);

    socket.on('join-room', onJoinRoom);
};
