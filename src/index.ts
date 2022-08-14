import Client from "./modules/Client";
import EventEmitter from "./modules/EventEmitter";
import Options from "./modules/Options";
import Utils from "./modules/Utils";
const PubSub = new Client();
const Emitter = new EventEmitter();
/**
 * @class AnotherTwitchPubSub
 * @author Ronis Xogum <ronis@xogum.net> (https://github.com/xogumon)
 * @version 1.0.0
 * @description A simple Twitch PubSub client
 * @license MIT
 * @param {string} accessToken - The authentication token of the channel you want to subscribe to.
 * @param {boolean} autoConnect - Whether or not to automatically connect to Twitch PubSub.
 * @param {boolean} autoReconnect - Whether or not to automatically reconnect to Twitch PubSub if the connection is lost.
 * @param {number} reconnectAttempts - The number of reconnect attempts to make before giving up.
 * @param {number} reconnectInterval - The time in milliseconds between reconnect attempts.
 * @param {string[]} topics - The topics you want to subscribe to.
 * @example
 * new TwitchPubSub({
 *  accessToken: 'authToken',
 *  topics: ['topic1', 'topic2']
 * }).on('message', (topic, message) => {
 *  console.log(topic, message);
 * });
 */
class AnotherTwitchPubSub {
  private __latency: number = 0;
  private __timestamp: number = 0;
  constructor(options: any) {
    Options.set(options);
    if (Options.get().autoConnect) this.__connect();
    PubSub.on("connected", () => this.__onConnection());
    PubSub.on("disconnected", (event: any) => this.__onDisconnection(event));
    PubSub.on("error", (event: any) => this.__onEventError(event));
    PubSub.on("message", (event: any) => this.__onEventMessage(event));
    PubSub.on("ping", (event: any) => this.__onPingSent(event));
    PubSub.on("pong", (event: any) => this.__onPongReceived(event));
    PubSub.on("raw", (event: any) => this.__onRawMessage(event));
    PubSub.on("response", (event: any) => this.__onResponseMessage(event));
    return this;
  }

  /**
   * Connect to the pubsub websocket
   * @returns This instance (for chaining)
   * @example
   * pubsub.__connect().then(() => {
   *  console.log("Connected!");
   * });
   */
  private async __connect() {
    await new Promise((resolve, reject) => {
      if (PubSub.state() === "DISCONNECTED") {
        PubSub.connect()
          .then(() => {
            resolve(null);
          })
          .catch((e: any) => {
            reject(e);
          });
      } else {
        resolve(null);
      }
    });
    return this;
  }

  /**
   * Disconnect from the pubsub websocket
   * @returns This instance (for chaining)
   * @example
   * pubsub.__disconnect().then(() => {
   *  console.log("Disconnected!");
   * });
   */
  private async __disconnect() {
    await new Promise((resolve) => {
      if (PubSub.state() === "CONNECTED") {
        PubSub.disconnect();
      } else if (PubSub.state() === "DISCONNECTED") {
        resolve(null);
      }
      PubSub.on("disconnected", () => {
        resolve(null);
      });
    });
    return this;
  }

  /** Reconnect to the pubsub websocket
   * @returns This instance (for chaining)
   * @example
   * pubsub.reconnect().then(() => {
   *  console.log("Reconnected!");
   * });
   */
  private async __reconnect(attempts: number = 0) {
    await new Promise((resolve, reject) => {
      function connect() {
        setTimeout(() => {
          PubSub.connect()
            .then(() => {
              resolve(null);
            })
            .catch((e: any) => {
              setTimeout(() => {
                this.__reconnect(attempts + 1);
              }, Options.get().reconnectInterval);
              reject(e);
            });
        }, Options.get().reconnectInterval);
      }
      if (PubSub.state() === "CONNECTING") {
        reject(new Error("Already reconnecting"));
      }
      if (attempts >= Options.get().reconnectAttempts) {
        reject(new Error("Reconnect attempts exceeded"));
      }
      if (PubSub.state() === "DISCONNECTED") {
        connect();
      }
      if (PubSub.state() === "CONNECTED") {
        if (attempts === 0) {
          PubSub.disconnect();
          PubSub.on("disconnected", () => {
            connect();
          });
        }
      }
    });
    return this;
  }

  /**
   * Send a message to the pubsub websocket
   * @param data Data to send
   * @returns This instance (for chaining)
   * @example
   * pubsub.__send({
   *  type: "PING"
   * }).then(() => {
   *  console.log("Message sent!");
   * });
   */
  private async __send(data: object) {
    if (PubSub.state() === "CONNECTED") {
      return await PubSub.send(data);
    } else {
      throw new Error("Not connected");
    }
  }

  /**
   * Subscribe to a topic or topics (if an array is provided)
   * @param topics Topics to subscribe to
   * @returns This instance (for chaining)
   * @example
   * pubsub.__subscribe("test").then(() => {
   *  console.log("Subscribed!");
   * });
   */
  private async __subscribe(topics: string[]) {
    await new Promise(async (resolve, reject) => {
      if (PubSub.state() !== "CONNECTED") {
        reject(new Error("Not connected"));
      } else {
        if (!Array.isArray(topics)) {
          topics = [topics];
        }
        topics = await Utils.parseTopics(topics);
        if (topics.length > 0) {
          const data = {
            type: "LISTEN",
            nonce: Utils.nonce(),
            data: {
              topics,
              auth_token: Options.get().accessToken,
            },
          };
          this.__send(data)
            .then((response) => {
              if (
                response.type === "RESPONSE" &&
                Utils.isEmpty(response.error)
              ) {
                this.__emit("subscribed", topics);
                resolve(Options.addTopics(topics));
              } else {
                reject(new Error("Subscription failed"));
              }
            })
            .catch((e) => {
              reject(e);
            });
        } else {
          resolve(null);
        }
      }
    });
    return this;
  }

  /**
   * Unsubscribe from a topic or topics (if an array is provided)
   * @param topics Topics to unsubscribe from (if omitted, all topics are unsubscribed)
   * @returns This instance (for chaining)
   * @example
   * pubsub.__unsubscribe("test").then(() => {
   *  console.log("Unsubscribed!");
   * });
   */
  private async __unsubscribe(topics: string[]) {
    await new Promise(async (resolve, reject) => {
      if (PubSub.state() !== "CONNECTED") {
        reject(new Error("Not connected"));
      } else {
        if (!Array.isArray(topics)) {
          topics = [topics];
        }
        topics = await Utils.parseTopics(topics ?? Options.get().topics);
        if (topics.length > 0) {
          const data = {
            type: "UNLISTEN",
            nonce: Utils.nonce(),
            data: {
              topics,
              auth_token: Options.get().accessToken,
            },
          };
          this.__send(data)
            .then((response) => {
              if (
                response.type === "RESPONSE" &&
                Utils.isEmpty(response.error)
              ) {
                this.__emit("unsubscribed", topics);
                resolve(Options.removeTopics(topics));
              } else {
                reject(new Error("Unsubscription failed"));
              }
            })
            .catch((e) => {
              reject(e);
            });
        } else {
          resolve(null);
        }
      }
    });
    return this;
  }

  /**
   * Open event handler (Client)
   */
  private __onConnection() {
    if (Options.get().topics) this.__subscribe(Options.get().topics);
    this.__emit("connected");
  }

  /**
   * Close event handler (Client)
   * @param event Event
   */
  private __onDisconnection(event: CloseEvent) {
    if (!event.wasClean && Options.get().autoReconnect) {
      this.__reconnect();
    }
    this.__emit("disconnected", event);
  }

  /**
   * Message event handler (Client)
   * @param event The event that was received
   */
  private __onRawMessage(event: MessageEvent) {
    const eventData = JSON.parse(event.data);
    const { type, data } = eventData;
    switch (type) {
      case "LISTEN":
      case "UNLISTEN":
        this.__emit(type, data);
      case "RECONNECT":
      case "DISCONNECT":
        this.__emit(type);
        break;
      default:
        break;
    }
  }

  /**
   * Error event handler (Client)
   * @param event The event that was received
   */
  private __onEventError(event: ErrorEvent) {
    this.__emitErrorEvent(event.error);
  }

  /**
   * Error event handler
   * @param event The error event
   */
  private __emitErrorEvent(event: any) {
    if (event instanceof Error) {
      this.__emit("error", event.message);
    } else {
      this.__emit("error", event);
    }
  }

  /**
   * Message event handler
   * @param data The event that was received
   */
  private __onEventMessage(data: any) {
    // Emit raw message as message event
    this.__emit("message", data);
    // Topic and messages (message is a data object from raw message)
    const { topic, message } = data.data;
    // Emit message event for topic
    this.__emit(topic, JSON.parse(message));
    // messageType is the type of topic and messageData is the data of the message
    const { type: messageType, data: messageData } = JSON.parse(message);
    const topicEvents = [
      "channel-points-channel",
      "channel-bits-events",
      "channel-bits-badge-unlocks",
      "channel-subscribe-events",
      "whispers",
    ];
    // Find the event name for the topic
    const eventName = topicEvents.find((event) => topic.includes(event));
    // Handle events for each topic
    switch (eventName) {
      case "channel-points-channel":
        // Channel points events
        this.__onChannelPointsEvent({
          type: messageType,
          data: messageData,
        });
        break;
      case "channel-bits-events":
      case "channel-bits-badge-unlocks":
        // Channel bits events and badge unlocks
        this.__onBitsEvent({
          type: eventName,
          data: messageData,
        });
        break;
      case "channel-subscribe-events":
        // Channel subscription events
        this.__onSubEvent(messageData);
        break;
      case "whispers":
        // Whisper events
        this.__onWhisperEvent({
          type: messageData.type,
          data: data.data_object,
        });
        break;
      default:
        break;
    }
  }

  /**
   * Response event handler
   * @param data The response data
   */
  private __onResponseMessage(data: any) {
    let errorMessage: string;
    if (data?.error) {
      switch (data.error) {
        case "ERR_BADAUTH":
          errorMessage = "Invalid authentication token";
          break;
        case "ERR_BADTOPIC":
          errorMessage = "Invalid topic";
          break;
        case "ERR_BADMESSAGE":
          errorMessage = "Invalid message";
          break;
        case "ERR_SERVER":
          errorMessage = "Server error";
          break;
        default:
          errorMessage = "Unknown error" + data.error;
          break;
      }
      this.__emitErrorEvent(errorMessage);
    } else {
      if (data) this.__emit("response", data);
    }
  }

  private __onPingSent(timestamp: number) {
    this.__timestamp = timestamp;
    this.__emit("ping");
  }

  /**
   * Pong event handler
   */
  private __onPongReceived(timestamp: number) {
    this.__latency = timestamp - this.__timestamp;
    this.__emit("pong", this.__latency);
    if (this.__latency > 1e4) {
      if (Options.get().autoReconnect) {
        this.__reconnect();
      } else {
        // if latency is greater than 10 seconds
        this.__emit("warning", {
          message: "Latency is very high",
          latency: this.__latency,
        });
      }
    } else if (this.__latency > 1e3) {
      // if latency is greater than 1 second
      this.__emit("warning", {
        message: "Latency is high",
        latency: this.__latency,
      });
    } else if (this.__latency > 1e2) {
      // if latency is greater than 100 milliseconds
      this.__emit("warning", {
        message: "Latency is medium",
        latency: this.__latency,
      });
    }
  }

  /**
   * Bits event handler
   * @param data The data object
   */
  private __onBitsEvent({ type, data }: { type: string; data: any }) {
    switch (type) {
      case "channel-bits-events":
        this.__emit("bits", data);
        break;
      case "channel-bits-badge-unlocks":
        this.__emit("bitsbadge", data);
        break;
      default:
        this.__emitErrorEvent(new Error(`Unknown message type: ${type}`));
    }
  }

  /**
   * Subscription event handler
   * (sub, resub, subgift, anonsubgift)
   * @param data The data object
   */
  private __onSubEvent(data: any) {
    this.__emit(data.context, {
      userId: data.user_id || null, // user id of the user who subscribed
      userName: data.user_name || null, // user name of the user who subscribed
      displayName: data.display_name || null, // display name of the user who subscribed
      channelId: data.channel_id, // channel id of the channel the subscription was made in
      channelName: data.channel_name, // channel name of the channel the subscription was made in
      time: data.time, // time the subscription was made
      subPlan: data.sub_plan, // subscription plan the user subscribed to
      subPlanName: data.sub_plan_name, // subscription plan name the user subscribed to
      isGift: data.is_gift || false, // whether the subscription was a gift subscription
      months: data.months || null, // number of months the subscription was for
      cumulativeMonths: data.cumulative_months || null, // number of cumulative months the user has subscribed for
      streakMonths: data.streak_months || null, // number of months the user has been subscribed for in a row
      subMessage: data.sub_message || null, // subscription message the user sent
      recipientId: data.recipient_id || null, // user id of the user the subscription was gifted to
      recipientUserName: data.recipient_user_name || null, // user name of the user the subscription was gifted to
      recipientDisplayName: data.recipient_display_name || null, // display name of the user the subscription was gifted to
      multiMonthDuration: data.multi_month_duration || null, // number of months the subscription was for
    });
  }

  /**
   * Whisper event handler
   * @param data The data object
   */
  private __onWhisperEvent(data: any) {
    this.__emit(data.type, data.data);
  }

  /**
   * Channel points event handler
   * @param data The data object
   */
  private __onChannelPointsEvent({ type, data }: { type: string; data: any }) {
    switch (type) {
      case "reward-redeemed":
        this.__emit("reward", data.redemption);
        this.__emit(type, data.redemption);
        break;
      default:
        this.__emit(type, data);
        break;
    }
  }

  /**
   * Emit an event
   * @param eventName Event to emit
   * @param args Data to emit
   * @returns This instance
   */
  private __emit(eventName: string, ...args: any[]) {
    eventName = Utils.slug(eventName);
    Emitter.emit(eventName, ...args);
    return this;
  }

  /**
   * Add a listener to an event
   * @param eventName Event to listen to
   * @param callback Callback to call when the event is emitted
   * @returns This instance
   * @example
   * pubsub.on("message", (data) => {
   *  console.log(data);
   * });
   */
  public on(eventName: string, callback: Function) {
    eventName = Utils.slug(eventName);
    if (eventName === "") {
      throw new Error("Invalid event name");
    }
    if (typeof callback !== "function") {
      throw new Error("Invalid callback");
    }
    Emitter.on(eventName, callback);
    return this;
  }

  /**
   * Remove a listener from an event
   * @param eventName Event to remove listener from
   * @param callback Callback to remove
   * @returns This instance
   * @example
   * pubsub.off("message", (data) => {
   *  console.log(data);
   * });
   */
  public off(eventName: string, callback: Function) {
    eventName = Utils.slug(eventName);
    if (eventName === "") {
      throw new Error("Invalid event name");
    }
    if (typeof callback !== "function") {
      throw new Error("Invalid callback");
    }
    Emitter.removeListener(eventName, callback);
    return this;
  }

  /**
   * Connect to the pubsub websocket (if not already connected) if autoConnect option is disabled
   * @returns This instance (for chaining) or throws an error if autoConnect is enabled
   * @example
   * pubsub.connect().then(() => {
   *  console.log("Connected!");
   * });
   */
  public connect() {
    if (Options.get().autoConnect) {
      throw new Error("autoConnect is enabled");
    }
    if (PubSub.state() !== "CONNECTED") {
      return this.__connect();
    } else {
      return Promise.resolve(this);
    }
  }

  /**
   * Reconnect to pubsub websocket if autoReconnect option is disabled
   * @returns This instance (for chaining) or throws an error if autoReconnect is enabled
   * @example
   * pubsub.reconnect().then(() => {
   *  console.log("Reconnected!");
   * });
   */
  public reconnect() {
    if (Options.get().autoReconnect) {
      throw new Error("autoReconnect is enabled");
    } else {
      return this.__reconnect();
    }
  }

  /** Disconnect from the pubsub websocket
   * @returns This instance (for chaining)
   * @example
   * pubsub.disconnect().then(() => {
   *  console.log("Disconnected!");
   * });
   */
  public disconnect() {
    return this.__disconnect();
  }

  /** Get the last latency measurement
   * @returns Latency in milliseconds
   * @example
   * console.log(pubsub.lastLatency());
   * // => 1234
   */
  public lastLatency() {
    return this.__latency;
  }

  /**
   * Subscribe to a topic or topics (if an array is provided)
   * @param topics Topics to subscribe to
   * @returns This instance (for chaining)
   * @example
   * pubsub.subscribe("test").then(() => {
   *  console.log("Subscribed!");
   * });
   */
  public subscribe(topics: string[]) {
    return this.__subscribe(topics);
  }

  /**
   * Unsubscribe from a topic or topics (if an array is provided)
   * @param topics Topics to unsubscribe from (if omitted, all topics are unsubscribed)
   * @returns This instance (for chaining)
   * @example
   * pubsub.unsubscribe("test").then(() => {
   *  console.log("Unsubscribed!");
   * });
   */
  public unsubscribe(topics: string[]) {
    return this.__unsubscribe(topics);
  }

  /**
   * Get all topics registered
   * @returns Array of topics
   */
  public registeredTopics() {
    return Options.get().topics || [];
  }

  /**
   * Get the number of topics registered
   */
  public registeredTopicsCount() {
    return Options.get().topics.length;
  }

  /**
   * Check if a topic is registered
   * @param topic Topic to check
   * @returns
   */
  public isRegisteredTopic(topic: string) {
    return Options.get().topics.includes(topic);
  }

  /**
   * Connection status of the pubsub websocket
   * @returns Connection state ("CONNECTED", "CONNECTING", "DISCONNECTING", "DISCONNECTED")
   * @example
   * if (pubsub.state() === "CONNECTED") {
   *  console.log("Connected!");
   * }
   */
  public state() {
    return PubSub.state();
  }
}

window.AnotherTwitchPubSub = AnotherTwitchPubSub;

declare global {
  interface Window {
    AnotherTwitchPubSub: typeof AnotherTwitchPubSub;
  }
}
