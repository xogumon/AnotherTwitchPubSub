export interface thisOptions {
    accessToken: string;
    topics: string[];
    autoConnect: boolean;
    autoReconnect: boolean;
    reconnectInterval: number;
    reconnectAttempts: number;
}
declare class AnotherTwitchPubSubOptions {
    private options;
    set(options: thisOptions): this;
    get(): thisOptions;
    setToken(accessToken: string): this;
    setTopics(topics: string[]): this;
    findTopic(topic: string): boolean;
    addTopic(topic: string): this;
    removeTopic(topic: string): this;
    addTopics(topics: string[]): this;
    removeTopics(topics: string[]): this;
}
declare const _default: AnotherTwitchPubSubOptions;
export default _default;
