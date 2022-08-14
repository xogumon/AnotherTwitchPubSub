declare class AnotherTwitchPubSub {
    private __latency;
    private __timestamp;
    constructor(options: any);
    private __connect;
    private __disconnect;
    private __reconnect;
    private __send;
    private __subscribe;
    private __unsubscribe;
    private __onConnection;
    private __onDisconnection;
    private __onRawMessage;
    private __onEventError;
    private __emitErrorEvent;
    private __onEventMessage;
    private __onResponseMessage;
    private __onPingSent;
    private __onPongReceived;
    private __onBitsEvent;
    private __onSubEvent;
    private __onWhisperEvent;
    private __onChannelPointsEvent;
    private __emit;
    on(eventName: string, callback: Function): this;
    off(eventName: string, callback: Function): this;
    connect(): Promise<this>;
    reconnect(): Promise<this>;
    disconnect(): Promise<this>;
    lastLatency(): number;
    subscribe(topics: string[]): Promise<this>;
    unsubscribe(topics: string[]): Promise<this>;
    registeredTopics(): string[];
    registeredTopicsCount(): number;
    isRegisteredTopic(topic: string): boolean;
    state(): "CONNECTING" | "CONNECTED" | "DISCONNECTING" | "DISCONNECTED";
}
declare global {
    interface Window {
        AnotherTwitchPubSub: typeof AnotherTwitchPubSub;
    }
}
export {};
