/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};

;// CONCATENATED MODULE: ./src/utils/functions.ts
/* harmony default export */ const functions = ({
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
    removeDuplicates(arr) {
        return arr.filter((item, index) => arr.indexOf(item) === index);
    },
});

;// CONCATENATED MODULE: ./src/twitch.pubsub.ts
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

class AnotherTwitchPubSub {
    constructor(options) {
        this._events = {};
        this._options = {
            channelId: "",
            authToken: "",
            autoConnect: true,
            autoReconnect: true,
            reconnectAttempts: 10,
            reconnectInterval: 1000,
            topics: [],
        };
        this._reconnectAttempts = 0;
        this._pingTimestamp = 0;
        this._latency = 0;
        this._heartbeatTimeout = 6e4;
        this._options = Object.assign({}, this._options, options);
        this._options.topics = functions.arrayLowerCase(this._options.topics);
        if (this._options.channelId === undefined ||
            this._options.authToken === undefined ||
            this._options.topics === undefined ||
            this._options.topics.length === 0 ||
            this._options.topics.length > 50 ||
            this._options.topics.some((topic) => typeof topic !== "string")) {
            throw new Error("Invalid options");
        }
        if (this._options.autoConnect) {
            this._connect();
        }
        return this.on("connected", this._subscribe.bind(this, this._options.topics));
    }
    _heartbeat() {
        var _a;
        if (this.state() === "open") {
            (_a = this._client) === null || _a === void 0 ? void 0 : _a.send(JSON.stringify({ type: "PING" }));
            this._pingTimestamp = Date.now();
            this._emit("ping", "Ping sent");
            clearTimeout(this._heartbeatTimer);
            this._heartbeatTimer = setTimeout(this._heartbeat.bind(this), this._heartbeatTimeout);
        }
        else {
            this._latency = 0;
            clearTimeout(this._heartbeatTimer);
        }
    }
    _connect() {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise((resolve, reject) => {
                if (this.state() === "closed") {
                    this._client = new WebSocket("wss://pubsub-edge.twitch.tv");
                    this._client.onopen = this._clientOpen.bind(this);
                    this._client.onclose = this._clientClose.bind(this);
                    this._client.onerror = this._clientError.bind(this);
                    this._client.onmessage = this._clientMessage.bind(this);
                }
                else {
                    resolve(null);
                }
                this.on("connected", () => {
                    resolve(null);
                })
                    .on("error", (err) => {
                    if (err instanceof Error)
                        reject(err);
                })
                    .on("disconnected", (e) => {
                    if (!e.wasClean)
                        reject(e);
                });
            });
            return this;
        });
    }
    _disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise((resolve) => {
                var _a;
                if (this.state() === "open") {
                    (_a = this._client) === null || _a === void 0 ? void 0 : _a.close(1000, "Closed by user");
                }
                else if (this.state() === "closed") {
                    resolve(null);
                }
                this.on("disconnected", () => {
                    resolve(null);
                });
            });
            this._client = undefined;
            return this;
        });
    }
    _reconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise((resolve, reject) => {
                this._disconnect().then(() => {
                    this._reconnectAttempts++;
                    if (this._reconnectAttempts <= this._options.reconnectAttempts) {
                        setTimeout(this._connect.bind(this), this._options.reconnectInterval);
                    }
                    else {
                        this._reconnectAttempts = 0;
                        reject(new Error("Reconnect attempts exceeded"));
                    }
                });
                this.on("connected", () => {
                    this._reconnectAttempts = 0;
                    resolve(null);
                }).on("error", (e) => {
                    reject(e);
                });
            });
            return this;
        });
    }
    _send(data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise((resolve, reject) => {
                var _a;
                if (this.state() === "open") {
                    resolve((_a = this._client) === null || _a === void 0 ? void 0 : _a.send(JSON.stringify(data)));
                }
                else {
                    reject(new Error("Not connected"));
                }
            });
            return this;
        });
    }
    _subscribe(topics) {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise((resolve, reject) => {
                if (this.state() !== "open") {
                    reject(new Error("Not connected"));
                }
                else {
                    if (!Array.isArray(topics)) {
                        topics = [topics];
                    }
                    topics = functions.arrayLowerCase(topics);
                    topics = functions.removeDuplicates(topics);
                    topics = topics.filter((topic) => this._isValidTopic(topic));
                    if (topics.length > 0) {
                        this._send({
                            type: "LISTEN",
                            nonce: functions.nonce(),
                            data: {
                                topics: topics.map((topic) => `${topic}.${this._options.channelId}`),
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
                    }
                    else {
                        resolve(null);
                    }
                }
            });
            return this;
        });
    }
    _unsubscribe(topics) {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise((resolve, reject) => {
                if (this.state() !== "open") {
                    reject(new Error("Not connected"));
                }
                else {
                    if (!Array.isArray(topics)) {
                        topics = [topics];
                    }
                    topics = functions.arrayLowerCase(topics);
                    topics = functions.removeDuplicates(topics);
                    topics = topics.filter((topic) => this._isValidTopic(topic));
                    topics = (topics || this._options.topics).map((topic) => `${topic}.${this._options.channelId}`);
                    if (topics.length > 0) {
                        this._send({
                            type: "UNLISTEN",
                            nonce: functions.nonce(),
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
                    }
                    else {
                        resolve(null);
                    }
                }
            });
            return this;
        });
    }
    _clientOpen() {
        this._emit("connected");
    }
    _clientClose(event) {
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
    _clientMessage(event) {
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
    _clientError(event) {
        this._onError(event.error);
    }
    _onError(event) {
        if (event instanceof Error) {
            this._emit("error", event.message);
        }
        else {
            this._emit("error", event);
        }
    }
    _onMessage(data) {
        this._emit("message", data);
        const { topic, message } = data.data;
        this._emit(topic, JSON.parse(message));
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
                this._onChannelPointsEvent({
                    type: messageType,
                    data: messageData,
                });
                break;
            case "channel-bits-events":
            case "channel-bits-badge-unlocks":
                this._onBitsEvent({
                    type: eventName,
                    data: messageData,
                });
                break;
            case "channel-subscribe-events":
                this._onSubEvent(messageData);
                break;
            case "whispers":
                this._onWhisperEvent({
                    type: messageData.type,
                    data: data.data_object,
                });
                break;
            default:
                break;
        }
    }
    _onResponse(data) {
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
            this._onError(errorMessage);
        }
        else {
            if (data)
                this._emit("response", data);
            this._heartbeat();
        }
    }
    _onPong() {
        clearTimeout(this._heartbeatTimer);
        this._heartbeatTimer = setTimeout(this._heartbeat.bind(this), this._heartbeatTimeout);
        this._latency = Date.now() - this._pingTimestamp;
        this._emit("pong", this._latency);
        if (this._latency > 1e4) {
            if (this._options.autoReconnect) {
                this._reconnect();
            }
            else {
                this._emit("warning", {
                    message: "Latency is very high",
                    latency: this._latency,
                });
            }
        }
        else if (this._latency > 1e3) {
            this._emit("warning", {
                message: "Latency is high",
                latency: this._latency,
            });
        }
        else if (this._latency > 1e2) {
            this._emit("warning", {
                message: "Latency is medium",
                latency: this._latency,
            });
        }
    }
    _onBitsEvent({ type, data }) {
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
    _onSubEvent(data) {
        this._emit(data.context, {
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
    _onWhisperEvent(data) {
        this._emit(data.type, data.data);
    }
    _onChannelPointsEvent({ type, data }) {
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
    _addTopics(topics) {
        if (!Array.isArray(topics)) {
            topics = [topics];
        }
        topics.forEach((topic) => {
            if (!this._options.topics.includes(topic))
                this._options.topics.push(topic);
        });
        return this._options.topics;
    }
    _removeTopics(topics) {
        if (!Array.isArray(topics)) {
            topics = [topics];
        }
        this._options.topics = this._options.topics.filter((topic) => !topics.includes(topic));
        return this._options.topics;
    }
    _isValidTopic(topic) {
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
            return availableTopics.some((availableTopic) => topic.toLowerCase().includes(availableTopic));
        }
        catch (error) {
            return false;
        }
    }
    _emit(eventName, ...args) {
        eventName = functions.slug(eventName);
        if (this._events.hasOwnProperty(eventName)) {
            this._events[eventName].forEach((callback) => {
                callback(...args);
            });
        }
        return this;
    }
    on(eventName, callback) {
        eventName = functions.slug(eventName);
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
    off(eventName, callback) {
        eventName = functions.slug(eventName);
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
    connect() {
        if (this._options.autoConnect) {
            throw new Error("autoConnect is enabled");
        }
        if (this.state() !== "open") {
            return this._connect();
        }
        else {
            return Promise.resolve(this);
        }
    }
    reconnect() {
        if (this._options.autoReconnect) {
            throw new Error("autoReconnect is enabled");
        }
        else {
            return this._reconnect();
        }
    }
    disconnect() {
        return this._disconnect();
    }
    lastLatency() {
        return this._latency;
    }
    subscribe(topics) {
        return this._subscribe(topics);
    }
    unsubscribe(topics) {
        return this._unsubscribe(topics);
    }
    registeredTopics() {
        return this._options.topics || [];
    }
    registeredTopicsCount() {
        return this.registeredTopics().length;
    }
    isRegisteredTopic(topic) {
        return this.registeredTopics().includes(topic);
    }
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
window.AnotherTwitchPubSub = AnotherTwitchPubSub;

/******/ })()
;
//# sourceMappingURL=twitch.pubsub.js.map