import socket from './utils/socket.js';

const getInputValue = id => $(`#${id}`).val().trim();

const joinButtonClick = () => {
	const name = getInputValue('playerName');
	const key = getInputValue('roomKey');

	socket.emit('request-join-room', key, name);
};

const createRoomButtonClick = () => {
	const playerName = getInputValue('playerName');

	socket.emit('create-room', playerName);
};

$('#joinButton').click(joinButtonClick);
$('#createRoomButton').click(createRoomButtonClick);

const onPayload = payload => {
	localStorage.setItem('token', payload);
	document.location.href = '/room.html';
};

socket.on('payload', onPayload);
