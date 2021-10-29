import { ValidationError } from 'fastest-validator';
import jwt from 'jsonwebtoken';
import { UniqueID } from 'nodejs-snowflake';

import { Payload } from './interfaces';

const uid = new UniqueID();
const JWT_SECRET = process.env.JWT_SECRET ?? getSnowflake();

export function getSnowflake(): string {
    return uid.getUniqueID() as string;
}

export function signJWT(data: any): string {
    return jwt.sign(data, JWT_SECRET);
}

export function verifyJWT<T>(token: string): T | null {
    try {
        return jwt.verify(token, JWT_SECRET) as T;
    } catch (_) {
        return null;
    }
}

export function createPayload(name: string, roomKey: string): Payload {
    return {
        name,
        room: roomKey,
        snowflake: getSnowflake()
    };
}

export function validate(
    validateFunction: (
        data: any
    ) => true | ValidationError[] | Promise<true | ValidationError[]>,
    data: any
) {
    return new Promise((resolve, reject) => {
        const result = validateFunction(data);

        if (Array.isArray(result)) return reject(result[0].message);
        else return resolve(true);
    });
}
