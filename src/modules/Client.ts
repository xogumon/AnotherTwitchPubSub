/**
 * Client
 */
import EventEmitter from "./EventEmitter";
import WebSocket from "./WebSocket";
export default class Client extends EventEmitter {
  private client: WebSocket;
  private heartbeatInterval: any;
  private heartbeatIntervalMs: number = 6e4; // 60 seconds
  /**
   * Connect to the websocket
   * @returns A promise with the websocket connection
   */
  public async connect() {
    await new Promise((resolve, reject) => {
      this.client = new WebSocket("wss://pubsub-edge.twitch.tv");
      this.client.onopen = (data: Event) => {
        this.emit("connected", data);
        this.heartbeatInterval = setInterval(
          () => this.heartbeat(),
          this.heartbeatIntervalMs
        );
        resolve(data);
      };
      this.client.onclose = (event: CloseEvent) => {
        const data = {
          code: event.code,
          reason: event.reason,
          message: null,
          wasClean: event.wasClean,
        };
        switch (event.code) {
          case 1000:
            data.message = "Normal closure";
            break;
          case 1001:
            data.message = "Going away";
            break;
          case 1002:
            data.message = "Protocol error";
            break;
          case 1003:
            data.message = "Unsupported data";
            break;
          case 1006:
            data.message = "Abnormal closure";
            break;
          case 1007:
            data.message = "Invalid data";
            break;
          case 1008:
            data.message = "Policy violation";
            break;
          case 1009:
            data.message = "data.Message too big";
            break;
          case 1010:
            data.message = "Mandatory extension";
            break;
          case 1011:
            data.message = "Internal server error";
            break;
          default:
            data.message = "Unknown error";
            break;
        }
        this.emit("disconnected", data);
        clearInterval(this.heartbeatInterval);
        reject(new Error(data.message));
      };
      this.client.onerror = (error: Event) => {
        this.emit("error", error);
        reject(error);
      };
      this.client.onmessage = (data: MessageEvent) => {
        this.emit("raw", data);
        const message = JSON.parse(data.data);
        switch (message.type) {
          case "PONG":
            this.emit("pong", Date.now());
            break;
          case "MESSAGE":
            this.emit("message", message);
            break;
          case "RESPONSE":
            if (message.error) {
              this.emit(`error:${message.nonce}`, message);
            } else {
              this.emit(`response:${message.nonce}`, message);
            }
            this.emit("response", message);
            break;
          case "DISCONNECT":
            this.emit("disconnect", message);
            break;
          case "RECONNECT":
            this.emit("reconnect", message);
            break;
          default:
            this.emit("unknown", message);
            break;
        }
      };
    });
    return this.client;
  }
  /**
   * Disconnect from the websocket
   */
  public disconnect() {
    this.client.close();
  }
  /**
   * Send a message to the websocket
   * @param data Data to send to the websocket
   */
  public async send(data: any) {
    this.client.send(JSON.stringify(data));
    if (data.nonce) {
      return await this.waitForResponse(data.nonce);
    }
  }
  /**
   * Wait for a response to a message
   */
  private async waitForResponse(nonce: string) {
    return new Promise((resolve, reject) => {
      this.once(`response:${nonce}`, (response: any) => {
        resolve(response);
      });
      this.once(`error:${nonce}`, (error: any) => {
        reject(error);
      });
      this.once(`timeout:${nonce}`, () => {
        reject(new Error("Timeout"));
      });

      setTimeout(() => {
        this.emit(`timeout:${nonce}`);
      }, 1000);
    })
      .then((response: any) => {
        this.removeAllListeners(`response:${nonce}`);
        this.removeAllListeners(`error:${nonce}`);
        this.removeAllListeners(`timeout:${nonce}`);
        return response;
      })
      .catch((error: any) => {
        this.removeAllListeners(`response:${nonce}`);
        this.removeAllListeners(`error:${nonce}`);
        this.removeAllListeners(`timeout:${nonce}`);
        throw error;
      });
  }
  /**
   * Heartbeat
   */
  private heartbeat() {
    this.emit("ping", Date.now());
    this.send({
      type: "PING",
    });
  }
  /**
   * State of the websocket
   */
  public state() {
    switch (this.client?.readyState) {
      case WebSocket.CONNECTING:
        return "CONNECTING";
      case WebSocket.OPEN:
        return "CONNECTED";
      case WebSocket.CLOSING:
        return "DISCONNECTING";
      case WebSocket.CLOSED:
      default:
        return "DISCONNECTED";
    }
  }
}
