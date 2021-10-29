import socket from './utils/socket.js';
import {
	PlayerComponent,
	LockStatusComponent,
	SystemMessageComponent,
	MessageComponent,
	SwalSettingsComponent
} from './utils/components.js';

if (socket.auth.token !== '') {
	socket.emit('join-room');

	const onInvalidPayload = () => {
		localStorage.clear();
		document.location.href = '/';
	};

	const onData = data => {
		const onLockStatusChanged = locked => {
			$('#lockStatus').replaceWith(
				LockStatusComponent(locked, data.self.owner)
			);
			if (data.self.owner)
				$('#lockStatus').click(() => socket.emit('change-lock-status'));
		};

		const updatePlayers = players => {
			$('#players').html('');
			players.forEach(player =>
				$('#players')
					.append(
						PlayerComponent(
							player.name,
							player.owner,
							player.socketId,
							data.self.socketId === player.socketId,
							data.self.owner,
							player.points
						)
					)
					.scrollTop($('#players')[0].scrollHeight)
			);

			$('i.kickUser').click(function () {
				socket.emit('kick-user', $(this).attr('sid'));
			});
		};

		const onChatMessage = message =>
			$('#chatMessageList')
				.append(
					message.system
						? SystemMessageComponent(message.content)
						: MessageComponent(message.sender, message.content)
				)
				.scrollTop($('#chatMessageList')[0].scrollHeight);

		const onGameMessage = (message, lastWord, wordsCount, players) => {
			if (wordsCount !== undefined) $('#wordsCount').text(wordsCount);
			if (lastWord) $('#lastWord').text(lastWord == '' ? '-' : lastWord);
			if (players) updatePlayers(players);
			$('#gameMessageList')
				.append(
					message.system
						? SystemMessageComponent(message.content)
						: MessageComponent(message.sender, message.content)
				)
				.scrollTop($('#gameMessageList')[0].scrollHeight);
		};

		const onUpdateGameSettings = (ppw, ppf, reuse, required) => {
			data.game = {
				...data.game,
				ppw,
				ppf,
				reuse,
				requiredWords: required
			};
			$('#ppw').text(ppw);
			$('#ppf').text(ppf);
			$('#reuseWords').text(reuse ? 'Yes' : 'No');
			$('#requiredWords').text(required);
		};

		const Init = () => {
			// Header
			$('#lblRoomKey').text(data.id);

			$('#copyRoomKey').click(() =>
				navigator.clipboard.writeText(data.id)
			);

			$('#exitRoom').click(() => socket.emit('leave'));

			$('#lockStatus').replaceWith(
				LockStatusComponent(data.locked, data.self.owner)
			);
			if (data.self.owner) {
				$('#lockStatus').click(() => socket.emit('change-lock-status'));

				const showSettings = async () => {
					const result = await Swal.fire(
						SwalSettingsComponent(
							data.game.ppw,
							data.game.ppf,
							data.game.reuse,
							data.game.requiredWords
						)
					);

					if (!result.isConfirmed) return;
					const value = result.value;
					socket.emit(
						'change-game-settings',
						value.ppw,
						value.ppf,
						value.reuse,
						value.requiredWords
					);
				};

				$('#settings').click(showSettings);
			} else {
				$('#settings').remove();
			}

			//Chat
			const sendMessage = (id, to) => {
				const val = $(`#${id}`).val().trim();
				if (val == '') return;
				socket.emit(to, val);
				$(`#${id}`).val('');
			};

			$('#chatMessageSend').click(() =>
				sendMessage('chatMessageInput', 'send-chat-message')
			);
			$('#chatMessageInput').on('keyup', e => {
				if (e.key === 'Enter' || e.keyCode === 13)
					sendMessage('chatMessageInput', 'send-chat-message');
			});

			data.chatMessages.forEach(message => onChatMessage(message));

			//Game
			$('#wordsCount').text(data.game.wordsCount);
			$('#lastWord').text(
				data.game.lastWord == '' ? '-' : data.game.lastWord
			);

			onUpdateGameSettings(
				data.game.ppw,
				data.game.ppf,
				data.game.reuse,
				data.game.requiredWords
			);

			$('#gameMessageSend').click(() =>
				sendMessage('gameMessageInput', 'send-game-message')
			);
			$('#gameMessageInput').on('keyup', e => {
				if (e.key === 'Enter' || e.keyCode === 13)
					sendMessage('gameMessageInput', 'send-game-message');
			});

			data.gameMessages.forEach(message => onGameMessage(message));
		};

		Init();

		$('#loadingContainer').css('display', 'none');
		$('#mainContainer').css('display', '');

		socket.on('lock-status-changed', onLockStatusChanged);
		socket.on('user-joined', updatePlayers);
		socket.on('user-left', updatePlayers);
		socket.on('left', onInvalidPayload);
		socket.on('chat-message', onChatMessage);
		socket.on('game-message', onGameMessage);
		socket.on('update-game-settings', onUpdateGameSettings);
	};

	socket.on('invalid-payload', onInvalidPayload);
	socket.on('room-not-found', onInvalidPayload);
	socket.on('room-locked', onInvalidPayload);
	socket.on('data', onData);
} else {
	document.location.href = '/';
}
