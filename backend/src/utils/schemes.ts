import Validator from 'fastest-validator';

import { GameSettings } from '../models/Game';

const validator = new Validator();

const name = validator.compile({
    name: { type: 'string', min: 3, max: 16 }
});

const roomKey = validator.compile({
    key: { type: 'string', min: 18, max: 20 }
});

const chatMessage = validator.compile({
    message: { type: 'string', min: 1, max: 128 }
});

const gameSettings = validator.compile({
    ppw: { type: 'number', positive: true, min: 1, max: 100 },
    ppf: { type: 'number', positive: true, min: 10, max: 1000 },
    reuse: 'boolean',
    requiredWords: { type: 'number', positive: true, min: 5, max: 1000 }
});

export function validateName(_name: string) {
    return name({ name: _name });
}

export function validateRoomKey(_roomKey: string) {
    return roomKey({ key: _roomKey });
}

export function validateChatMessage(message: string) {
    return chatMessage({ message });
}

export function validateGameSettings(data: GameSettings) {
    return gameSettings(data);
}
