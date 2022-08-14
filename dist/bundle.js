/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};

;// CONCATENATED MODULE: ./src/modules/EventEmitter.ts
class EventEmitter {
    constructor() {
        this.events = {};
    }
    async emit(event, ...data) {
        let count = 0;
        await new Promise(async (resolve) => {
            if (Array.isArray(event)) {
                await Promise.all(event.map(async (e) => {
                    await this.emit(e, ...data).then(() => {
                        count++;
                    });
                }));
            }
            else if (event === "*") {
                for (const key in this.events) {
                    if (this.events.hasOwnProperty(key)) {
                        this.events[key].forEach((listener) => {
                            count++;
                            listener(...data);
                        });
                    }
                }
            }
            else if (typeof event === "string" && event.includes("*")) {
                const [eventName, ...rest] = event.split("*");
                for (const key in this.events) {
                    if (this.events.hasOwnProperty(key) && key.startsWith(eventName)) {
                        this.events[key].forEach((listener) => {
                            count++;
                            listener(...data);
                        });
                    }
                }
            }
            else if (typeof event === "string" &&
                event.toLowerCase() in this.events) {
                this.events[event.toLowerCase()].forEach((listener) => {
                    count++;
                    listener(...data);
                });
            }
            resolve(count);
        });
        return `Emitted ${count} events to listeners`;
    }
    on(event, callback) {
        if (Array.isArray(event)) {
            event.map((e) => {
                this.on(e, callback);
            });
        }
        else if (typeof event === "string") {
            if (!this.events[event]) {
                this.events[event] = [];
            }
            this.events[event].push(callback);
        }
    }
    removeListener(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter((cb) => cb !== callback);
        }
    }
    removeAllListeners(event) {
        if (this.events[event]) {
            this.events[event] = [];
        }
    }
    once(event, callback) {
        this.on(event, (data) => {
            this.removeListener(event, callback);
            callback(data);
        });
    }
}

;// CONCATENATED MODULE: ./src/modules/WebSocket.ts
let ws = WebSocket || __webpack_require__.g.WebSocket || window.WebSocket || self.WebSocket;
if (!ws) {
    throw new Error("WebSocket is not supported by this browser.");
}
/* harmony default export */ const modules_WebSocket = (ws);

;// CONCATENATED MODULE: ./src/modules/Client.ts


class Client extends EventEmitter {
    constructor() {
        super(...arguments);
        this.heartbeatIntervalMs = 6e4;
    }
    async connect() {
        await new Promise((resolve, reject) => {
            this.client = new modules_WebSocket("wss://pubsub-edge.twitch.tv");
            this.client.onopen = (data) => {
                this.emit("connected", data);
                this.heartbeatInterval = setInterval(() => this.heartbeat(), this.heartbeatIntervalMs);
                resolve(data);
            };
            this.client.onclose = (event) => {
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
            this.client.onerror = (error) => {
                this.emit("error", error);
                reject(error);
            };
            this.client.onmessage = (data) => {
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
                        }
                        else {
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
    disconnect() {
        this.client.close();
    }
    async send(data) {
        this.client.send(JSON.stringify(data));
        if (data.nonce) {
            return await this.waitForResponse(data.nonce);
        }
    }
    async waitForResponse(nonce) {
        return new Promise((resolve, reject) => {
            this.once(`response:${nonce}`, (response) => {
                resolve(response);
            });
            this.once(`error:${nonce}`, (error) => {
                reject(error);
            });
            this.once(`timeout:${nonce}`, () => {
                reject(new Error("Timeout"));
            });
            setTimeout(() => {
                this.emit(`timeout:${nonce}`);
            }, 1000);
        })
            .then((response) => {
            this.removeAllListeners(`response:${nonce}`);
            this.removeAllListeners(`error:${nonce}`);
            this.removeAllListeners(`timeout:${nonce}`);
            return response;
        })
            .catch((error) => {
            this.removeAllListeners(`response:${nonce}`);
            this.removeAllListeners(`error:${nonce}`);
            this.removeAllListeners(`timeout:${nonce}`);
            throw error;
        });
    }
    heartbeat() {
        this.emit("ping", Date.now());
        this.send({
            type: "PING",
        });
    }
    state() {
        var _a;
        switch ((_a = this.client) === null || _a === void 0 ? void 0 : _a.readyState) {
            case modules_WebSocket.CONNECTING:
                return "CONNECTING";
            case modules_WebSocket.OPEN:
                return "CONNECTED";
            case modules_WebSocket.CLOSING:
                return "DISCONNECTING";
            case modules_WebSocket.CLOSED:
            default:
                return "DISCONNECTED";
        }
    }
}

;// CONCATENATED MODULE: ./src/modules/Options.ts
class AnotherTwitchPubSubOptions {
    constructor() {
        this.options = {
            accessToken: "",
            topics: [],
            autoConnect: true,
            autoReconnect: true,
            reconnectInterval: 10000,
            reconnectAttempts: 10,
        };
    }
    set(options) {
        this.options = Object.assign({}, this.options, options);
        return this;
    }
    get() {
        return this.options;
    }
    setToken(accessToken) {
        this.options.accessToken = accessToken;
        return this;
    }
    setTopics(topics) {
        this.options.topics = topics;
        return this;
    }
    findTopic(topic) {
        return this.options.topics.indexOf(topic) > -1;
    }
    addTopic(topic) {
        if (!this.options.topics.includes(topic)) {
            this.options.topics.push(topic);
        }
        return this;
    }
    removeTopic(topic) {
        const index = this.options.topics.indexOf(topic);
        if (index > -1) {
            this.options.topics.splice(index, 1);
        }
        return this;
    }
    addTopics(topics) {
        if (!Array.isArray(topics)) {
            this.addTopic(topics);
        }
        else {
            for (const topic of topics) {
                this.addTopic(topic);
            }
        }
        return this;
    }
    removeTopics(topics) {
        if (!Array.isArray(topics)) {
            this.removeTopic(topics);
        }
        else {
            for (const topic of topics) {
                this.removeTopic(topic);
            }
        }
        return this;
    }
}
/* harmony default export */ const Options = (new AnotherTwitchPubSubOptions());

;// CONCATENATED MODULE: ./src/modules/Utils.ts

/* harmony default export */ const Utils = ({
    isEmpty(obj) {
        if (obj === "" ||
            obj === 0 ||
            obj === false ||
            obj === null ||
            obj === undefined) {
            return true;
        }
        if (Array.isArray(obj)) {
            return obj.length === 0;
        }
        else if (typeof obj === "object") {
            return Object.keys(obj).length === 0;
        }
        return false;
    },
    arrayLowerCase(arr) {
        return arr.map((item) => item.toLowerCase());
    },
    repeat(fn, times) {
        let result = [];
        for (let i = 0; i < times; i++) {
            result.push(fn());
        }
        return result;
    },
    nonce() {
        const random = () => Math.random().toString(36).substring(2, 15);
        return this.repeat(random, 2).join("");
    },
    toCamelCase(str) {
        return str.replace(/\s(.)/g, ($1) => $1.toUpperCase());
    },
    slug(str, sep = "-") {
        if (typeof str !== "string")
            return "";
        if (typeof sep !== "string")
            sep = "-";
        str = str.toLowerCase().replace(/[^a-z0-9]/g, sep);
        if (sep.length > 0) {
            str = str
                .replace(new RegExp(`${sep}{2,}`, "g"), sep)
                .replace(new RegExp(`^${sep}|${sep}$`, "g"), "");
        }
        return str;
    },
    slugToCamelCase(str) {
        return this.slug(str)
            .replace(/-([a-z])/g, ($1) => $1.toUpperCase())
            .replace(/-/g, "");
    },
    removeDuplicates(arr) {
        return arr.filter((item, index) => arr.indexOf(item) === index);
    },
    async validateToken() {
        const res = await fetch("https://id.twitch.tv/oauth2/validate", {
            headers: {
                "Content-Type": "application/json",
                Authorization: `OAuth ${Options.get().accessToken}`,
            },
        });
        return await res.json();
    },
    async getUserId(user) {
        let find;
        if (typeof user === "string") {
            find = `login=${user}`;
        }
        else if (typeof user === "object") {
            find = user.map((name) => `login=${name}`).join("&");
        }
        else {
            throw new Error("User must be a string or an array of strings");
        }
        try {
            const api = await this.validateToken();
            if (api.client_id) {
                if (api.login === user.toLowerCase()) {
                    return [api.user_id];
                }
                else {
                    const res = await fetch(`https://api.twitch.tv/helix/users?${find}`, {
                        headers: {
                            "Client-ID": api.client_id,
                            Authorization: `Bearer ${Options.get().accessToken}`,
                        },
                    });
                    const data = await res.json();
                    if (data.data.length > 0) {
                        return data.data.map((user) => user.id);
                    }
                    else {
                        throw new Error("User not found");
                    }
                }
            }
            else {
                throw new Error("Invalid token");
            }
        }
        catch (err) {
            return console.log(err);
        }
    },
    isNumber(str) {
        return !isNaN(Number(str));
    },
    isValidTopic(topic) {
        try {
            if (typeof topic !== "string") {
                throw new Error("Invalid topic");
            }
            if (topic.length > 100) {
                throw new Error("Topic is too long");
            }
            if (topic.length < 5) {
                throw new Error("Topic is too short");
            }
            if (topic.includes(" ")) {
                throw new Error("Topic cannot contain spaces");
            }
            if (!this.getTopicsFormat(topic)) {
                throw new Error("Topic is invalid");
            }
            return true;
        }
        catch (error) {
            return false;
        }
    },
    getTopicsFormat(topicName) {
        topicName = this.slugToCamelCase(topicName);
        const validTopics = {
            channelBitsEventsV1: "channel-bits-events-v2.$arg1$",
            channelBitsEventsV2: "channel-bits-events-v2.$arg1$",
            channelBitsBadgeUnlocks: "channel-bits-badge-unlocks.$arg1$",
            channelPointsChannelV1: "channel-points-channel-v1.$arg1$",
            channelSubscribeEventsV1: "channel-subscribe-events-v2.$arg1$",
            chatModeratorActions: "chat_moderator_actions.$arg1$.$arg2$",
            automodQueue: "automod-queue.$arg1$.$arg2$",
            userModerationNotifications: "user-moderation-notifications.$arg1$.$arg2$",
            whispers: "whispers.$arg1$",
        };
        return validTopics[topicName];
    },
    filterTopics(topics) {
        topics = this.arrayLowerCase(topics);
        topics = this.removeDuplicates(topics);
        return topics.filter((topic) => this.isValidTopic(topic));
    },
    async parseTopic(topic) {
        let [topicName, arg1, arg2] = topic.split(".");
        const topicFormat = this.getTopicsFormat(topicName);
        if (topicFormat) {
            if (arg1 || arg2) {
                if (!this.isNumber(arg1) && !this.isNumber(arg2)) {
                    [arg1, arg2] = await this.getUserId([arg1, arg2]);
                }
                else if (!this.isNumber(arg1)) {
                    [arg1] = await this.getUserId(arg1);
                }
                else if (!this.isNumber(arg2)) {
                    [arg2] = await this.getUserId(arg2);
                }
            }
            else {
                const validade = await this.validateToken();
                if (validade.login) {
                    arg1 = validade.user_id;
                    arg2 = validade.user_id;
                }
                else {
                    throw new Error("Invalid token");
                }
            }
            if (this.isNumber(arg1) && this.isNumber(arg2)) {
                return topicFormat.replace("$arg1$", arg1).replace("$arg2$", arg2);
            }
            else {
                return topicFormat.replace("$arg1$", arg1);
            }
        }
        return null;
    },
    async parseTopics(topics) {
        this.filterTopics(topics);
        return await Promise.all(topics.map((topic) => this.parseTopic(topic)));
    },
});

;// CONCATENATED MODULE: ./src/index.ts




const PubSub = new Client();
const Emitter = new EventEmitter();
class AnotherTwitchPubSub {
    constructor(options) {
        this.__latency = 0;
        this.__timestamp = 0;
        Options.set(options);
        if (Options.get().autoConnect)
            this.__connect();
        PubSub.on("connected", () => this.__onConnection());
        PubSub.on("disconnected", (event) => this.__onDisconnection(event));
        PubSub.on("error", (event) => this.__onEventError(event));
        PubSub.on("message", (event) => this.__onEventMessage(event));
        PubSub.on("ping", (event) => this.__onPingSent(event));
        PubSub.on("pong", (event) => this.__onPongReceived(event));
        PubSub.on("raw", (event) => this.__onRawMessage(event));
        PubSub.on("response", (event) => this.__onResponseMessage(event));
        return this;
    }
    async __connect() {
        await new Promise((resolve, reject) => {
            if (PubSub.state() === "DISCONNECTED") {
                PubSub.connect()
                    .then(() => {
                    resolve(null);
                })
                    .catch((e) => {
                    reject(e);
                });
            }
            else {
                resolve(null);
            }
        });
        return this;
    }
    async __disconnect() {
        await new Promise((resolve) => {
            if (PubSub.state() === "CONNECTED") {
                PubSub.disconnect();
            }
            else if (PubSub.state() === "DISCONNECTED") {
                resolve(null);
            }
            PubSub.on("disconnected", () => {
                resolve(null);
            });
        });
        return this;
    }
    async __reconnect(attempts = 0) {
        await new Promise((resolve, reject) => {
            function connect() {
                setTimeout(() => {
                    PubSub.connect()
                        .then(() => {
                        resolve(null);
                    })
                        .catch((e) => {
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
    async __send(data) {
        if (PubSub.state() === "CONNECTED") {
            return await PubSub.send(data);
        }
        else {
            throw new Error("Not connected");
        }
    }
    async __subscribe(topics) {
        await new Promise(async (resolve, reject) => {
            if (PubSub.state() !== "CONNECTED") {
                reject(new Error("Not connected"));
            }
            else {
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
                        if (response.type === "RESPONSE" &&
                            Utils.isEmpty(response.error)) {
                            this.__emit("subscribed", topics);
                            resolve(Options.addTopics(topics));
                        }
                        else {
                            reject(new Error("Subscription failed"));
                        }
                    })
                        .catch((e) => {
                        reject(e);
                    });
                }
                else {
                    resolve(null);
                }
            }
        });
        return this;
    }
    async __unsubscribe(topics) {
        await new Promise(async (resolve, reject) => {
            if (PubSub.state() !== "CONNECTED") {
                reject(new Error("Not connected"));
            }
            else {
                if (!Array.isArray(topics)) {
                    topics = [topics];
                }
                topics = await Utils.parseTopics(topics !== null && topics !== void 0 ? topics : Options.get().topics);
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
                        if (response.type === "RESPONSE" &&
                            Utils.isEmpty(response.error)) {
                            this.__emit("unsubscribed", topics);
                            resolve(Options.removeTopics(topics));
                        }
                        else {
                            reject(new Error("Unsubscription failed"));
                        }
                    })
                        .catch((e) => {
                        reject(e);
                    });
                }
                else {
                    resolve(null);
                }
            }
        });
        return this;
    }
    __onConnection() {
        if (Options.get().topics)
            this.__subscribe(Options.get().topics);
        this.__emit("connected");
    }
    __onDisconnection(event) {
        if (!event.wasClean && Options.get().autoReconnect) {
            this.__reconnect();
        }
        this.__emit("disconnected", event);
    }
    __onRawMessage(event) {
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
    __onEventError(event) {
        this.__emitErrorEvent(event.error);
    }
    __emitErrorEvent(event) {
        if (event instanceof Error) {
            this.__emit("error", event.message);
        }
        else {
            this.__emit("error", event);
        }
    }
    __onEventMessage(data) {
        this.__emit("message", data);
        const { topic, message } = data.data;
        this.__emit(topic, JSON.parse(message));
        const { type: messageType, data: messageData } = JSON.parse(message);
        const topicEvents = [
            "channel-points-channel",
            "channel-bits-events",
            "channel-bits-badge-unlocks",
            "channel-subscribe-events",
            "whispers",
        ];
        const eventName = topicEvents.find((event) => topic.includes(event));
        switch (eventName) {
            case "channel-points-channel":
                this.__onChannelPointsEvent({
                    type: messageType,
                    data: messageData,
                });
                break;
            case "channel-bits-events":
            case "channel-bits-badge-unlocks":
                this.__onBitsEvent({
                    type: eventName,
                    data: messageData,
                });
                break;
            case "channel-subscribe-events":
                this.__onSubEvent(messageData);
                break;
            case "whispers":
                this.__onWhisperEvent({
                    type: messageData.type,
                    data: data.data_object,
                });
                break;
            default:
                break;
        }
    }
    __onResponseMessage(data) {
        let errorMessage;
        if (data === null || data === void 0 ? void 0 : data.error) {
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
        }
        else {
            if (data)
                this.__emit("response", data);
        }
    }
    __onPingSent(timestamp) {
        this.__timestamp = timestamp;
        this.__emit("ping");
    }
    __onPongReceived(timestamp) {
        this.__latency = timestamp - this.__timestamp;
        this.__emit("pong", this.__latency);
        if (this.__latency > 1e4) {
            if (Options.get().autoReconnect) {
                this.__reconnect();
            }
            else {
                this.__emit("warning", {
                    message: "Latency is very high",
                    latency: this.__latency,
                });
            }
        }
        else if (this.__latency > 1e3) {
            this.__emit("warning", {
                message: "Latency is high",
                latency: this.__latency,
            });
        }
        else if (this.__latency > 1e2) {
            this.__emit("warning", {
                message: "Latency is medium",
                latency: this.__latency,
            });
        }
    }
    __onBitsEvent({ type, data }) {
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
    __onSubEvent(data) {
        this.__emit(data.context, {
            userId: data.user_id || null,
            userName: data.user_name || null,
            displayName: data.display_name || null,
            channelId: data.channel_id,
            channelName: data.channel_name,
            time: data.time,
            subPlan: data.sub_plan,
            subPlanName: data.sub_plan_name,
            isGift: data.is_gift || false,
            months: data.months || null,
            cumulativeMonths: data.cumulative_months || null,
            streakMonths: data.streak_months || null,
            subMessage: data.sub_message || null,
            recipientId: data.recipient_id || null,
            recipientUserName: data.recipient_user_name || null,
            recipientDisplayName: data.recipient_display_name || null,
            multiMonthDuration: data.multi_month_duration || null,
        });
    }
    __onWhisperEvent(data) {
        this.__emit(data.type, data.data);
    }
    __onChannelPointsEvent({ type, data }) {
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
    __emit(eventName, ...args) {
        eventName = Utils.slug(eventName);
        Emitter.emit(eventName, ...args);
        return this;
    }
    on(eventName, callback) {
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
    off(eventName, callback) {
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
    connect() {
        if (Options.get().autoConnect) {
            throw new Error("autoConnect is enabled");
        }
        if (PubSub.state() !== "CONNECTED") {
            return this.__connect();
        }
        else {
            return Promise.resolve(this);
        }
    }
    reconnect() {
        if (Options.get().autoReconnect) {
            throw new Error("autoReconnect is enabled");
        }
        else {
            return this.__reconnect();
        }
    }
    disconnect() {
        return this.__disconnect();
    }
    lastLatency() {
        return this.__latency;
    }
    subscribe(topics) {
        return this.__subscribe(topics);
    }
    unsubscribe(topics) {
        return this.__unsubscribe(topics);
    }
    registeredTopics() {
        return Options.get().topics || [];
    }
    registeredTopicsCount() {
        return Options.get().topics.length;
    }
    isRegisteredTopic(topic) {
        return Options.get().topics.includes(topic);
    }
    state() {
        return PubSub.state();
    }
}
window.AnotherTwitchPubSub = AnotherTwitchPubSub;

/******/ })()
;
//# sourceMappingURL=bundle.js.map