import { Socket } from 'socket.io';

import { Payload } from '../utils/interfaces';

export default class Player {
    private _points: number = 0;

    get socketId() {
        return this.socket.id;
    }

    get points() {
        return this._points;
    }

    constructor(
        readonly socket: Socket,
        readonly payload: Payload,
        readonly owner: boolean
    ) {}

    increasePoints(points: number) {
        this._points += points;
    }
}
