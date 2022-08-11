interface AnotherTwitchPubSubOptions {
    channelId: string;
    authToken: string;
    autoConnect: boolean;
    autoReconnect: boolean;
    reconnectAttempts: number;
    reconnectInterval: number;
    topics: string[];
}
declare class AnotherTwitchPubSub {
    constructor(options: AnotherTwitchPubSubOptions);
    _client: WebSocket | undefined;
    _events: {
        [eventName: string]: Array<Function>;
    };
    _options: AnotherTwitchPubSubOptions;
    _reconnectAttempts: number;
    _pingTimestamp: number;
    _latency: number;
    _heartbeatTimer: ReturnType<typeof setTimeout> | undefined;
    _heartbeatTimeout: number;
    _heartbeat(): void;
    _connect(): Promise<this>;
    _disconnect(): Promise<this>;
    _reconnect(): Promise<this>;
    _send(data: object): Promise<this>;
    _subscribe(topics: string[]): Promise<this>;
    _unsubscribe(topics: string[]): Promise<this>;
    _clientOpen(): void;
    _clientClose(event: CloseEvent): void;
    _clientMessage(event: MessageEvent): void;
    _clientError(event: ErrorEvent): void;
    _onError(event: any): void;
    _onMessage(data: any): void;
    _onResponse(data: any): void;
    _onPong(): void;
    _onBitsEvent({ type, data }: {
        type: string;
        data: any;
    }): void;
    _onSubEvent(data: any): void;
    _onWhisperEvent(data: any): void;
    _onChannelPointsEvent({ type, data }: {
        type: string;
        data: any;
    }): void;
    _addTopics(topics: string[]): string[];
    _removeTopics(topics: string[]): string[];
    _isValidTopic(topic: string): boolean;
    _emit(eventName: string, ...args: any[]): this;
    on(eventName: string, callback: Function): this;
    off(eventName: string, callback: Function): false | this;
    connect(): Promise<this>;
    reconnect(): Promise<this>;
    disconnect(): Promise<this>;
    lastLatency(): number;
    subscribe(topics: string[]): Promise<this>;
    unsubscribe(topics: string[]): Promise<this>;
    registeredTopics(): string[];
    registeredTopicsCount(): number;
    isRegisteredTopic(topic: string): boolean;
    state(): "connecting" | "open" | "closing" | "closed";
}
declare global {
    interface Window {
        AnotherTwitchPubSub: typeof AnotherTwitchPubSub;
    }
}
export {};
