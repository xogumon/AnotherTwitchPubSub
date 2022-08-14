import EventEmitter from "./EventEmitter";
export default class Client extends EventEmitter {
    private client;
    private heartbeatInterval;
    private heartbeatIntervalMs;
    connect(): Promise<WebSocket>;
    disconnect(): void;
    send(data: any): Promise<any>;
    private waitForResponse;
    private heartbeat;
    state(): "CONNECTING" | "CONNECTED" | "DISCONNECTING" | "DISCONNECTED";
}
