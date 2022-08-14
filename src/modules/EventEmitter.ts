/**
 * EventEmitter
 */
export default class EventEmitter {
  private events: { [event: string]: Function[] } = {};
  /**
   * Emit an event
   * @param event Event to emit
   * @param data Data to emit
   * @returns Returns a promise with a number of emitted events
   * @example
   * emitter.emit('event', 'data');
   */
  public async emit(event: string | string[], ...data: any[]) {
    let count: number = 0;
    await new Promise(async (resolve) => {
      if (Array.isArray(event)) {
        await Promise.all(
          event.map(async (e: string) => {
            await this.emit(e, ...data).then(() => {
              count++;
            });
          })
        );
      } else if (event === "*") {
        for (const key in this.events) {
          if (this.events.hasOwnProperty(key)) {
            this.events[key].forEach((listener) => {
              count++;
              listener(...data);
            });
          }
        }
      } else if (typeof event === "string" && event.includes("*")) {
        const [eventName, ...rest] = event.split("*");
        for (const key in this.events) {
          if (this.events.hasOwnProperty(key) && key.startsWith(eventName)) {
            this.events[key].forEach((listener) => {
              count++;
              listener(...data);
            });
          }
        }
      } else if (
        typeof event === "string" &&
        event.toLowerCase() in this.events
      ) {
        this.events[event.toLowerCase()].forEach((listener) => {
          count++;
          listener(...data);
        });
      }
      resolve(count);
    });
    return `Emitted ${count} events to listeners`;
  }
  /**
   * Listen to an event
   * @param event Event to listen to
   * @param callback Callback to execute when the event is emitted
   * @example
   * emitter.on('event', (data) => {
   *   console.log(data);
   * });
   * emitter.emit('event', 'data'); // Outputs 'data'
   */
  public on(event: string | string[], callback: Function) {
    if (Array.isArray(event)) {
      event.map((e: string) => {
        this.on(e, callback);
      });
    } else if (typeof event === "string") {
      if (!this.events[event]) {
        this.events[event] = [];
      }
      this.events[event].push(callback);
    }
  }
  /**
   * Remove an event listener
   * @param event Event to remove listener from
   * @param callback Callback to remove
   * @example
   * const callback = (data) => {
   *   console.log(data);
   * };
   * emitter.on('event', callback);
   * emitter.emit('event', 'data'); // Outputs 'data'
   * emitter.removeListener('event', callback);
   * emitter.emit('event', 'data'); // Doesn't output 'data'
   */
  public removeListener(event: string, callback: Function) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(
        (cb: Function) => cb !== callback
      );
    }
  }
  /**
   * Remove all event listeners for an event
   * @param event Event to remove listeners from
   * @example
   * emitter.on('event', (data) => {
   *   console.log(data);
   * });
   * emitter.emit('event', 'data'); // Outputs 'data'
   * emitter.removeAllListeners('event');
   * emitter.emit('event', 'data'); // Doesn't output 'data'
   */
  public removeAllListeners(event: string) {
    if (this.events[event]) {
      this.events[event] = [];
    }
  }
  /**
   * Once an event is emitted, remove all event listeners for that event
   * @param event Event to remove listeners from
   * @example
   * emitter.once('event', (data) => {
   *   console.log(data);
   * });
   * emitter.emit('event', 'data'); // Outputs 'data'
   * emitter.emit('event', 'data'); // Doesn't output 'data'
   */
  public once(event: string, callback: Function) {
    this.on(event, (data: any) => {
      this.removeListener(event, callback);
      callback(data);
    });
  }
}
