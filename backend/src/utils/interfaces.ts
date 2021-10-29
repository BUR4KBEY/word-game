export interface Payload {
    room: string;
    name: string;
    snowflake: string;
}

export interface Message {
    system?: boolean;
    sender?: string;
    content: string;
}
