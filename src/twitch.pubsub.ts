import utils from "./utils/functions";
/**
 * Interface for options passed to the class constructor.
 * @property {string} [channelId] - The id of the channel to subscribe to.
 * @property {string} [authToken] - The authentication token to use.
 * @property {boolean} [autoConnect] - Whether to automatically connect to the server.
 * @property {boolean} [autoReconnect] - Whether to automatically reconnect to the server if the connection is lost.
 * @property {number} [reconnectAttempts] - The number of reconnect attempts to make before giving up.
 * @property {number} [reconnectInterval] - The time to wait between reconnect attempts.
 * @property {string[]} [topics] - The topics to subscribe to.
 */
interface AnotherTwitchPubSubOptions {
  channelId: string;
  authToken: string;
  autoConnect: boolean;
  autoReconnect: boolean;
  reconnectAttempts: number;
  reconnectInterval: number;
  topics: string[];
}

/**
 * @class AnotherTwitchPubSub
 * @classdesc AnotherTwitchPubSub is a class that allows you to subscribe to Twitch PubSub topics.
 * @param {string} channelId - The channel ID of the channel you want to subscribe to.
 * @param {string} authToken - The authentication token of the channel you want to subscribe to.
 * @param {boolean} autoConnect - Whether or not to automatically connect to Twitch PubSub.
 * @param {boolean} autoReconnect - Whether or not to automatically reconnect to Twitch PubSub if the connection is lost.
 * @param {number} reconnectAttempts - The number of reconnect attempts to make before giving up.
 * @param {number} reconnectInterval - The time in milliseconds between reconnect attempts.
 * @param {string[]} topics - The topics you want to subscribe to.
 * @example
 * const pubsub = new TwitchPubSub({
 *  channelId: 'channelId',
 *  authToken: 'authToken',
 *  autoConnect: true,
 *  autoReconnect: true,
 *  reconnectAttempts: 10,
 *  reconnectInterval: 1000,
 *  topics: ['topic1', 'topic2']
 * });
 * pubsub.on('message', (topic, message) => {
 *  console.log(topic, message);
 * });
 */
class AnotherTwitchPubSub {
  constructor(options: AnotherTwitchPubSubOptions) {
    this._options = Object.assign({}, this._options, options);
    this._options.topics = utils.arrayLowerCase(this._options.topics);
    if (
      this._options.channelId === undefined ||
      this._options.authToken === undefined ||
      this._options.topics === undefined ||
      this._options.topics.length === 0 ||
      this._options.topics.length > 50 ||
      this._options.topics.some((topic) => typeof topic !== "string")
    ) {
      throw new Error("Invalid options");
    }
    if (this._options.autoConnect) {
      this._connect();
    }
    return this.on(
      "connected",
      this._subscribe.bind(this, this._options.topics)
    );
  }
  _client: WebSocket | undefined;
  _events: { [eventName: string]: Array<Function> } = {};
  _options: AnotherTwitchPubSubOptions = {
    // default options
    channelId: "", // the channel id to subscribe to
    authToken: "", // the authentication token to use
    autoConnect: true, // whether to connect automatically
    autoReconnect: true, // whether to reconnect automatically
    reconnectAttempts: 10, // the number of reconnect attempts
    reconnectInterval: 1000, // the interval between reconnect attempts
    topics: [], // the topics to subscribe to
  };
  _reconnectAttempts: number = 0;
  _pingTimestamp: number = 0;
  _latency: number = 0;
  _heartbeatTimer: ReturnType<typeof setTimeout> | undefined;
  _heartbeatTimeout: number = 6e4;

  /**
   * Heartbeat function to keep the connection alive and to send a ping to the server
   */
  _heartbeat() {
    if (this.state() === "open") {
      this._client?.send(JSON.stringify({ type: "PING" }));
      this._pingTimestamp = Date.now();
      this._emit("ping", "Ping sent");
      clearTimeout(this._heartbeatTimer);
      this._heartbeatTimer = setTimeout(
        this._heartbeat.bind(this),
        this._heartbeatTimeout
      );
    } else {
      this._latency = 0;
      clearTimeout(this._heartbeatTimer);
    }
  }

  /**
   * Connect to the pubsub websocket
   * @returns This instance (for chaining)
   * @private
   * @example
   * pubsub._connect().then(() => {
   *  console.log("Connected!");
   * });
   */
  async _connect() {
    await new Promise((resolve, reject) => {
      if (this.state() === "closed") {
        this._client = new WebSocket("wss://pubsub-edge.twitch.tv");
        this._client.onopen = this._clientOpen.bind(this);
        this._client.onclose = this._clientClose.bind(this);
        this._client.onerror = this._clientError.bind(this);
        this._client.onmessage = this._clientMessage.bind(this);
      } else {
        resolve(null);
      }
      this.on("connected", () => {
        resolve(null);
      })
        .on("error", (err: Event) => {
          if (err instanceof Error) reject(err);
        })
        .on("disconnected", (e: CloseEvent) => {
          if (!e.wasClean) reject(e);
        });
    });
    return this;
  }

  /**
   * Disconnect from the pubsub websocket
   * @returns This instance (for chaining)
   * @private
   * @example
   * pubsub._disconnect().then(() => {
   *  console.log("Disconnected!");
   * });
   */
  async _disconnect() {
    await new Promise((resolve) => {
      if (this.state() === "open") {
        this._client?.close(1000, "Closed by user");
      } else if (this.state() === "closed") {
        resolve(null);
      }
      this.on("disconnected", () => {
        resolve(null);
      });
    });
    this._client = undefined;
    return this;
  }

  /** Reconnect to the pubsub websocket
   * @returns This instance (for chaining)
   * @private
   * @example
   * pubsub.reconnect().then(() => {
   *  console.log("Reconnected!");
   * });
   */
  async _reconnect() {
    await new Promise((resolve, reject) => {
      this._disconnect().then(() => {
        this._reconnectAttempts++;
        if (this._reconnectAttempts <= this._options.reconnectAttempts) {
          setTimeout(this._connect.bind(this), this._options.reconnectInterval);
        } else {
          this._reconnectAttempts = 0;
          reject(new Error("Reconnect attempts exceeded"));
        }
      });
      this.on("connected", () => {
        this._reconnectAttempts = 0;
        resolve(null);
      }).on("error", (e: any[]) => {
        reject(e);
      });
    });
    return this;
  }

  /**
   * Send a message to the pubsub websocket
   * @param data Data to send
   * @private
   * @returns This instance (for chaining)
   * @example
   * pubsub._send({
   *  type: "PING"
   * }).then(() => {
   *  console.log("Message sent!");
   * });
   */
  async _send(data: object) {
    await new Promise((resolve, reject) => {
      if (this.state() === "open") {
        resolve(this._client?.send(JSON.stringify(data)));
      } else {
        reject(new Error("Not connected"));
      }
    });
    return this;
  }

  /**
   * Subscribe to a topic or topics (if an array is provided)
   * @param topics Topics to subscribe to
   * @private
   * @returns This instance (for chaining)
   * @example
   * pubsub._subscribe("test").then(() => {
   *  console.log("Subscribed!");
   * });
   */
  async _subscribe(topics: string[]) {
    await new Promise((resolve, reject) => {
      if (this.state() !== "open") {
        reject(new Error("Not connected"));
      } else {
        if (!Array.isArray(topics)) {
          topics = [topics];
        }
        topics = utils.arrayLowerCase(topics);
        topics = utils.removeDuplicates(topics);
        topics = topics.filter((topic) => this._isValidTopic(topic));
        if (topics.length > 0) {
          this._send({
            type: "LISTEN",
            nonce: utils.nonce(),
            data: {
              topics: topics.map(
                (topic) => `${topic}.${this._options.channelId}`
              ),
              auth_token: this._options.authToken,
            },
          })
            .then(() => {
              this._addTopics(topics);
              resolve(null);
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
   * @private
   * @returns This instance (for chaining)
   * @example
   * pubsub._unsubscribe("test").then(() => {
   *  console.log("Unsubscribed!");
   * });
   */
  async _unsubscribe(topics: string[]) {
    await new Promise((resolve, reject) => {
      if (this.state() !== "open") {
        reject(new Error("Not connected"));
      } else {
        if (!Array.isArray(topics)) {
          topics = [topics];
        }
        topics = utils.arrayLowerCase(topics);
        topics = utils.removeDuplicates(topics);
        topics = topics.filter((topic) => this._isValidTopic(topic));
        topics = (topics || this._options.topics).map(
          (topic) => `${topic}.${this._options.channelId}`
        );
        if (topics.length > 0) {
          this._send({
            type: "UNLISTEN",
            nonce: utils.nonce(),
            data: {
              topics,
              auth_token: this._options.authToken,
            },
          })
            .then(() => {
              this._removeTopics(topics);
              resolve(null);
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
   * @private
   */
  _clientOpen() {
    this._emit("connected");
  }

  /**
   * Close event handler (Client)
   * @param event Event
   * @private
   */
  _clientClose(event: CloseEvent) {
    if (!event.wasClean && this._options.autoReconnect) {
      this._reconnect();
    }
    let message = "";
    switch (event.code) {
      case 1000:
        message = "Normal closure";
        break;
      case 1001:
        message = "Going away";
        break;
      case 1002:
        message = "Protocol error";
        break;
      case 1003:
        message = "Unsupported data";
        break;
      case 1006:
        message = "Abnormal closure";
        break;
      case 1007:
        message = "Invalid data";
        break;
      case 1008:
        message = "Policy violation";
        break;
      case 1009:
        message = "Message too big";
        break;
      case 1010:
        message = "Mandatory extension";
        break;
      case 1011:
        message = "Internal server error";
        break;
      default:
        message = "Unknown error";
        break;
    }
    clearTimeout(this._heartbeatTimer);
    this._emit("disconnected", {
      message,
      reason: event.reason,
      code: event.code,
    });
  }

  /**
   * Message event handler (Client)
   * @param event The event that was received
   * @private
   */
  _clientMessage(event: MessageEvent) {
    const eventData = JSON.parse(event.data);
    const { type, data } = eventData;
    switch (type) {
      case "PONG":
        this._onPong();
        break;
      case "MESSAGE":
        this._onMessage(eventData);
        break;
      case "RESPONSE":
        this._onResponse(eventData);
        break;
      case "LISTEN":
      case "UNLISTEN":
        this._emit(type, data);
      case "RECONNECT":
      case "DISCONNECT":
        this._emit(type);
        break;
      default:
        this._onError(new Error(`Unknown message type: ${type}`));
    }
  }

  /**
   * Error event handler (Client)
   * @param event The event that was received
   * @private
   */
  _clientError(event: ErrorEvent) {
    this._onError(event.error);
  }

  /**
   * Error event handler
   * @param event The error event
   * @private
   */
  _onError(event: any) {
    if (event instanceof Error) {
      this._emit("error", event.message);
    } else {
      this._emit("error", event);
    }
  }

  /**
   * Message event handler
   * @param data The event that was received
   * @private
   */
  _onMessage(data: any) {
    // Emit raw message as message event
    this._emit("message", data);
    // Topic and messages (message is a data object from raw message)
    const { topic, message } = data.data;
    // Emit message event for topic
    this._emit(topic, JSON.parse(message));
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
        this._onChannelPointsEvent({
          type: messageType,
          data: messageData,
        });
        break;
      case "channel-bits-events":
      case "channel-bits-badge-unlocks":
        // Channel bits events and badge unlocks
        this._onBitsEvent({
          type: eventName,
          data: messageData,
        });
        break;
      case "channel-subscribe-events":
        // Channel subscription events
        this._onSubEvent(messageData);
        break;
      case "whispers":
        // Whisper events
        this._onWhisperEvent({
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
   * @private
   */
  _onResponse(data: any) {
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
      this._onError(errorMessage);
    } else {
      if (data) this._emit("response", data);
      this._heartbeat(); // start the heartbeat
    }
  }

  /**
   * Pong event handler
   * @private
   */
  _onPong() {
    clearTimeout(this._heartbeatTimer);
    this._heartbeatTimer = setTimeout(
      this._heartbeat.bind(this),
      this._heartbeatTimeout
    );
    this._latency = Date.now() - this._pingTimestamp;
    this._emit("pong", this._latency);
    if (this._latency > 1e4) {
      if (this._options.autoReconnect) {
        this._reconnect();
      } else {
        // if latency is greater than 10 seconds
        this._emit("warning", {
          message: "Latency is very high",
          latency: this._latency,
        });
      }
    } else if (this._latency > 1e3) {
      // if latency is greater than 1 second
      this._emit("warning", {
        message: "Latency is high",
        latency: this._latency,
      });
    } else if (this._latency > 1e2) {
      // if latency is greater than 100 milliseconds
      this._emit("warning", {
        message: "Latency is medium",
        latency: this._latency,
      });
    }
  }

  /**
   * Bits event handler
   * @param data The data object
   * @private
   */
  _onBitsEvent({ type, data }: { type: string; data: any }) {
    switch (type) {
      case "channel-bits-events":
        this._emit("bits", data);
        break;
      case "channel-bits-badge-unlocks":
        this._emit("bitsbadge", data);
        break;
      default:
        this._onError(new Error(`Unknown message type: ${type}`));
    }
  }

  /**
   * Subscription event handler
   * (sub, resub, subgift, anonsubgift)
   * @param data The data object
   * @private
   */
  _onSubEvent(data: any) {
    this._emit(data.context, {
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
   * @private
   */
  _onWhisperEvent(data: any) {
    this._emit(data.type, data.data);
  }

  /**
   * Channel points event handler
   * @param data The data object
   * @private
   */
  _onChannelPointsEvent({ type, data }: { type: string; data: any }) {
    switch (type) {
      case "reward-redeemed":
        this._emit("reward", data.redemption);
        this._emit(type, data.redemption);
        break;
      default:
        this._emit(type, data);
        break;
    }
  }

  /** Add topics to the topics array
   * @param topics Topics to add
   * @private
   * @example
   * pubsub._addTopics(["topic1", "topic2"]);
   * pubsub._addTopics(["topic3", "topic4"]);
   * console.log(pubsub.registeredTopics()); // ["topic1", "topic2", "topic3", "topic4"]
   */
  _addTopics(topics: string[]) {
    if (!Array.isArray(topics)) {
      topics = [topics];
    }
    topics.forEach((topic) => {
      if (!this._options.topics.includes(topic))
        this._options.topics.push(topic);
    });
    return this._options.topics;
  }

  /** Remove topics from the list of topics to listen to
   * @param topics Topics to remove
   * @private
   * @example
   * pubsub._addTopics(["topic1", "topic2", "topic3", "topic4"]);
   * pubsub._removeTopics(["topic2", "topic3"]);
   * console.log(pubsub.registeredTopics()); // ["topic1", "topic4"]
   */
  _removeTopics(topics: string[]) {
    if (!Array.isArray(topics)) {
      topics = [topics];
    }
    this._options.topics = this._options.topics.filter(
      (topic) => !topics.includes(topic)
    );
    return this._options.topics;
  }

  /**
   * Check if an topic is valid
   * @param topic Topic to check
   * @private
   * @returns True if topic is valid, false otherwise
   * @example
   * console.log(pubsub._isValidTopic('channel-bits-events-v2')); // true
   * console.log(pubsub._isValidTopic('channel-bits-events-v3')); // false
   */
  _isValidTopic(topic: string) {
    try {
      const availableTopics = [
        "channel-bits-events-v1",
        "channel-bits-events-v2",
        "channel-bits-badge-unlocks",
        "channel-points-channel-v1",
        "channel-subscribe-events-v1",
        "chat-moderator-actions",
        "automod-queue",
        "user-moderation-notifications",
        "whispers",
      ];
      if (typeof topic !== "string") {
        throw new Error("Invalid topic");
      }
      if (topic.length > 100) {
        throw new Error("Topic is too long");
      }
      return availableTopics.some((availableTopic) =>
        topic.toLowerCase().includes(availableTopic)
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Emit an event
   * @param eventName Event to emit
   * @param args Data to emit
   * @private
   * @returns This instance
   */
  _emit(eventName: string, ...args: any[]) {
    eventName = utils.slug(eventName);
    if (this._events.hasOwnProperty(eventName)) {
      this._events[eventName].forEach((callback: Function) => {
        callback(...args);
      });
    }
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
  on(eventName: string, callback: Function) {
    eventName = utils.slug(eventName);
    if (eventName === "") {
      throw new Error("Invalid event name");
    }
    if (typeof callback !== "function") {
      throw new Error("Invalid callback");
    }
    if (!this._events.hasOwnProperty(eventName)) {
      this._events[eventName] = [];
    }
    this._events[eventName].push(callback);
    return this;
  }

  /**
   * Remove a listener from an event
   * @param eventName Event to remove listener from
   * @param callback Callback to remove
   * @returns This instance or false if the callback was not found
   * @example
   * pubsub.off("message", (data) => {
   *  console.log(data);
   * });
   */
  off(eventName: string, callback: Function) {
    eventName = utils.slug(eventName);
    if (eventName === "") {
      throw new Error("Invalid event name");
    }
    if (typeof callback !== "function") {
      throw new Error("Invalid callback");
    }
    if (this._events.hasOwnProperty(eventName)) {
      const index = this._events[eventName].indexOf(callback);
      if (index > -1) {
        this._events[eventName].splice(index, 1);
        return this;
      }
    }
    return false;
  }

  /**
   * Connect to the pubsub websocket (if not already connected) if autoConnect option is disabled
   * @returns This instance (for chaining) or throws an error if autoConnect is enabled
   * @example
   * pubsub.connect().then(() => {
   *  console.log("Connected!");
   * });
   */
  connect() {
    if (this._options.autoConnect) {
      throw new Error("autoConnect is enabled");
    }
    if (this.state() !== "open") {
      return this._connect();
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
  reconnect() {
    if (this._options.autoReconnect) {
      throw new Error("autoReconnect is enabled");
    } else {
      return this._reconnect();
    }
  }

  /** Disconnect from the pubsub websocket
   * @returns This instance (for chaining)
   * @example
   * pubsub.disconnect().then(() => {
   *  console.log("Disconnected!");
   * });
   */
  disconnect() {
    return this._disconnect();
  }

  /** Get the last latency measurement
   * @returns Latency in milliseconds
   * @example
   * console.log(pubsub.lastLatency());
   * // => 1234
   */
  lastLatency() {
    return this._latency;
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
  subscribe(topics: string[]) {
    return this._subscribe(topics);
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
  unsubscribe(topics: string[]) {
    return this._unsubscribe(topics);
  }

  /**
   * Get all topics registered
   * @returns Array of topics
   */
  registeredTopics() {
    return this._options.topics || [];
  }

  /**
   * Get the number of topics registered
   */
  registeredTopicsCount() {
    return this.registeredTopics().length;
  }

  /**
   * Check if a topic is registered
   * @param topic Topic to check
   * @returns
   */
  isRegisteredTopic(topic: string) {
    return this.registeredTopics().includes(topic);
  }

  /**
   * Connection status of the pubsub websocket
   * @returns Connection state (open, closed, connecting, or disconnected)
   * @example
   * if (pubsub.state() === "open") {
   *  console.log("Connected!");
   * }
   */
  state() {
    const { readyState } = this._client || {};
    switch (readyState) {
      case WebSocket.CONNECTING:
        return "connecting";
      case WebSocket.OPEN:
        return "open";
      case WebSocket.CLOSING:
        return "closing";
      case WebSocket.CLOSED:
      default:
        return "closed";
    }
  }
}

declare global {
  interface Window {
    AnotherTwitchPubSub: typeof AnotherTwitchPubSub;
  }
}

window.AnotherTwitchPubSub = AnotherTwitchPubSub;
