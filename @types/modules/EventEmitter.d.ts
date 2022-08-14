export default class EventEmitter {
    private events;
    emit(event: string | string[], ...data: any[]): Promise<string>;
    on(event: string | string[], callback: Function): void;
    removeListener(event: string, callback: Function): void;
    removeAllListeners(event: string): void;
    once(event: string, callback: Function): void;
}
