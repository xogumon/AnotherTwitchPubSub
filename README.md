# AnotherTwitchPubSub

[![GitHub release (latest by date including pre-releases)](https://img.shields.io/github/v/release/xogumon/AnotherTwitchPubSub?color=blueviolet&include_prereleases)](https://github.com/xogumon/AnotherTwitchPubSub/releases/latest) [![GitHub](https://img.shields.io/github/license/xogumon/AnotherTwitchPubSub)](LICENSE)

---

**Just another Twitch PubSub helper library for browsers.**

It's a simple library that allows you to easily subscribe to Twitch PubSub channels and receive messages from them in real time. It is based on the [Twitch PubSub API](https://dev.twitch.tv/docs/pubsub) and uses the WebSocket protocol to connect to the Twitch PubSub server. You can create beautiful real-time applications with it, like a redemption system for your _Twitch Channel Points_. To infinity and beyond!

## CDN Links

- [x] **jsDelivr:** [https://cdn.jsdelivr.net/gh/xogumon/AnotherTwitchPubSub@next/dist/bundle.min.js](https://cdn.jsdelivr.net/gh/xogumon/AnotherTwitchPubSub@next/dist/bundle.min.js)

If you want to use the library in your project, you can use the CDN link above or download the library directly from [the latest version](https://github.com/xogumon/AnotherTwitchPubSub/releases/latest/download/bundle.min.js).

Use only the minified version of the library, as it is smaller and faster to load. And don't use older versions, as they might be broken. The latest version is only version you can trust.

## Installation

```html
<script src="https://cdn.jsdelivr.net/gh/xogumon/AnotherTwitchPubSub@next/dist/bundle.min.js"></script>
<script>
  new AnotherTwitchPubSub({
    accessToken: "cfabdegwdoklmawdzdo98xt2fo512y", // Your access token
    topics: ["channel-bits-events-v2", "channel-points-channel-v1"], // Topics to subscribe to
  });
</script>
```

You no longer need to pass a channelId in the constructor (the validate token will do it for you) when you create a new instance of the library.

### Available topics

- List of available topics can be found [here](https://dev.twitch.tv/docs/pubsub/#available-topics).

### Usage

```js
const pubsub = new AnotherTwitchPubSub({
  accessToken: "<YOUR ACCESS TOKEN>", // You can get this from the Twitch API (required) (see below) - Renamed from "authToken" in v1.0.0-beta.1
  topics: ["<ARRAY OF TOPICS>"], // You can found all the topics in the Twitch PubSub API documentation (https://dev.twitch.tv/docs/pubsub) (required)
  autoConnect: true, // automatically connect to Twitch PubSub (default: true) - added in v0.1.1
  autoReconnect: true, // automatically reconnect to Twitch PubSub if connection is lost (default: true) - added in v0.1.1 - renamed from "reconnect" in v0.1.2
  reconnectAttempts: 10, // number of reconnect attempts (default: 10) - added in v0.1.2
  reconnectInterval: 10000, // time between reconnect attempts (default: 10000) - added in v0.1.2
})
  .on("connected", () => {
    // Do something when connected
    console.log("Connected to pubsub");
  })
  .on("disconnected", (data) => {
    // Do something when disconnected
    console.log("Disconnected from pubsub");
  })
  .on("error", (error) => {
    // Handle error
    console.log(error);
  })
  .on("ping", () => {
    // Make sure you're connected to pubsub
    console.log("PING?");
  })
  .on("pong", (latency) => {
    // Response to ping from pubsub
    console.log("PONG!", `${latency}ms`);
    // If the latency is greater than 10s, you should reconnect to pubsub; If the autoReconnect is enabled, it will automatically reconnect.
  })
  .on("message", (data) => {
    // raw message data
    console.log(data);
  })
  .on("reward", (data) => {
    // reward-redeemed data
    console.log(data);
    /* Response
  {
      "id": "9a52b112-1fc5-4feb-bf2c-63c5f871c2c4",
      "user": {
          "id": "147018336",
          "login": "xogum",
          "display_name": "Xogum"
      },
      "channel_id": "147018336",
      "redeemed_at": "2022-08-06T23:46:37.343527034Z",
      "reward": {
          "id": "5948e43f-8506-4eb9-a4d4-4a63a4022a88",
          "channel_id": "147018336",
          "title": "MICO",
          "prompt": "",
          "cost": 250,
          "is_user_input_required": false,
          "is_sub_only": false,
          "image": {
              "url_1x": "https://static-cdn.jtvnw.net/custom-reward-images/147018336/5948e43f-8506-4eb9-a4d4-4a63a4022a88/8445a5f6-c95d-4bf2-ad3d-d48eddc501fb/custom-1.png",
              "url_2x": "https://static-cdn.jtvnw.net/custom-reward-images/147018336/5948e43f-8506-4eb9-a4d4-4a63a4022a88/8445a5f6-c95d-4bf2-ad3d-d48eddc501fb/custom-2.png",
              "url_4x": "https://static-cdn.jtvnw.net/custom-reward-images/147018336/5948e43f-8506-4eb9-a4d4-4a63a4022a88/8445a5f6-c95d-4bf2-ad3d-d48eddc501fb/custom-4.png"
          },
          "default_image": {
              "url_1x": "https://static-cdn.jtvnw.net/custom-reward-images/default-1.png",
              "url_2x": "https://static-cdn.jtvnw.net/custom-reward-images/default-2.png",
              "url_4x": "https://static-cdn.jtvnw.net/custom-reward-images/default-4.png"
          },
          "background_color": "#9B00F5",
          "is_enabled": true,
          "is_paused": false,
          "is_in_stock": false,
          "max_per_stream": {
              "is_enabled": false,
              "max_per_stream": 0
          },
          "should_redemptions_skip_request_queue": true,
          "template_id": null,
          "updated_for_indicator_at": "2022-07-18T15:10:45.438309683Z",
          "max_per_user_per_stream": {
              "is_enabled": false,
              "max_per_user_per_stream": 0
          },
          "global_cooldown": {
              "is_enabled": true,
              "global_cooldown_seconds": 60
          },
          "redemptions_redeemed_current_stream": null,
          "cooldown_expires_at": "2022-08-06T23:47:37Z"
      },
      "status": "FULFILLED"
  }
  */
  });

/* Added in 0.1.1 */
pubsub.state(); // returns the current state of the connection (open, closed, connecting, disconnected)

pubsub.connect(); // manually connect to pubsub (only if autoConnect is false) - returns a Promise that resolves when the connection is established or rejects if the connection fails

pubsub.reconnect(); // Reconnect to pubsub if connection is lost - returns a Promise

pubsub.subscribe(["<String||Array>"]); // Subscribe to topics (String or Array) - returns a Promise

pubsub.unsubscribe(["<String||Array>"]); // Unsubscribe from topics (String or Array) - returns a Promise

pubsub.disconnect(); // Disconnect from pubsub - returns a Promise

pubsub.registeredTopics(); // Returns an array with the topics you are registered to

pubsub.registeredTopicsCount(); // Get the number of registered topics (Number)

pubsub.isRegisteredTopic("<String>"); // Check if topic is registered (Boolean)
```

### Available events (alphabetical order)

- `AUTOMOD-QUEUE` _(all events from `AUTOMOD-QUEUE` pubsub topic)_
- `CONNECTED` _(added in v0.2.0-beta.1)_
- `CHANNEL-BITS-BADGE-UNLOCKS` _(or just `BITSBADGE`)_
- `CHANNEL-BITS-EVENTS-V1` (or V2) _(or just `BITS`)_
- `CHANNEL-POINTS-CHANNEL-V1` _(all events from `CHANNEL-POINTS-CHANNEL-V1`)_
- `CHANNEL-SUBSCRIBE-EVENTS-V1` _(all events from `CHANNEL-SUBSCRIBE-EVENTS-V1`)_
- `CHAT-MODERATOR-ACTIONS` _(all events from `CHAT-MODERATOR-ACTIONS`)_
- ~~CLOSE~~ _(renamed to `DISCONNECTED` in v0.2.0-beta.2)_
- `DISCONNECT`
- `DISCONNECTED` _(added in v0.2.0-beta.1)_
- `ERROR`
- `LISTEN`
- `MESSAGE` _(raw message data)_
- ~~OPEN~~ _(renamed to `CONNECTED` in v0.2.0-beta.1)_
- `PING` _(when the client pings the server)_
- `PONG` _(response to ping from pubsub)_
- `RECONNECT`
- `RESPONSE` _(raw response message to requests)_
- `REWARD-REDEEMED` _(added in v0.1.1)_ _(or just `REWARD` - added in v0.1.2)_
- `SUBSCRIBED` _(added in v1.0.0-beta.1)_ - When you successfully subscribe to a topic
- `UNLISTEN`
- `UNSUBSCRIBED` _(added in v1.0.0-beta.1)_ - When you successfully unsubscribe from a topic
- `USER-MODERATION-NOTIFICATIONS` _(all events from `USER-MODERATION-NOTIFICATIONS` topic)_
- `WARNING` _(added in v0.1.2)_ _(warning when the latency is too high)_
- `WHISPER-RECEIVED` _(added in v0.2.0-beta.1)_
- `WHISPERS` _(all events from the `WHISPERS` event)_

_All event names are case-insensitive_

## Token generation

You can generate a token here: https://token.xog.one/ _(created for v0.2.0-beta.1)_

## Twitch PubSub documentation

You can also find more information about the PubSub system [here](https://dev.twitch.tv/docs/pubsub/).

## License

[MIT](LICENSE)

## Changelog

To see a full changelog, check out the [changelog](CHANGELOG.md) page on the GitHub repo.

## Let's contribute!

- [Create a pull request](https://github.com/xogumon/AnotherTwitchPubSub/pulls)
- [Report an issue](https://github.com/xogumon/AnotherTwitchPubSub/issues)
- [Join the discord server](https://discord.gg/as7YwYx2wm)
- [Follow on twitter](https://twitter.com/xogumon)
- [Follow on github](https://github.com/xogumon)

---

Happy streaming!
