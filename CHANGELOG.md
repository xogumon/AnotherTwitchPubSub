# Changelog

_(before reporting an issue, please update to the latest version)_

## v1.0.0-beta.1 - 2022-08-14

### Features

- Restructured codebase.
- Added a token generator page: https://token.xog.one/
- Rewrite some methods (like `.subscribe()` and `.unsubscribe()` to support topics with two arguments)
- You no longer need to pass a channelId in the constructor (the validate token will do it for you)
- You can now pass a username in the subscribe topic (instead of the channelId/userId).
  - Example:
    ```js
    pubsub.subscribe(
      "chat_moderator_actions.<USER NAME or ID>.<CHANNEL NAME or ID>"
    );
    ```
  - It's okay if you pass the channel Id/user Id in the topic instead of the channel name/user name.
- Added a `SUBSCRIBED` and `UNSUBSCRIBED` event. This event is triggered when you subscribe or unsubscribe to a topic successfully. Returns a list of subscribed/unsubscribed topics.

### Other

- The CDN link have a new format (https://cdn.jsdelivr.net/gh/xogumon/AnotherTwitchPubSub@next/dist/bundle.min.js)

### Bug Fixes

- Fixed internal conflicts with `Client` events.

## v0.2.0 - 2022-08-11

- Fixed minor bugs.
- Fixed the nonce generator method.
- Renamed the repository to `AnotherTwitchPubSub`.
- Removed all old versions from the repository.
- Added a test page: (https://xogumon.github.io/AnotherTwitchPubSub/test)

  ***

  ### Please update to the latest version

  If you are using a CDN, please update the CDN to the latest version: `https://cdn.jsdelivr.net/gh/xogumon/AnotherTwitchPubSub/dist/twitch.pubsub.min.js` (It's a new URL, change it now)

  ***

  _The next updates will happen fortnightly when there are new features or bug fixes._

  ***

## v0.2.0-beta.2 - 2022-08-09

- Fixed a bug where the all events was not being emitted.
- Updated the documentation on [README](README.md).

  ***

  _(I'll remove old versions from the github repository in the next update)_

  ***

  Next update will be more stable. Please report any bugs or suggestions to [@xogumon](https://twitter.com/xogumon). Thanks!

  ***

## v0.2.0-beta.1 - 2022-08-08

- Total rewrite of the entire project (now in typescript, minified, and compiled with webpack)
- Added `subscriptions` events (`sub`, `resub`, `subgift`, `anonsubgift`)
- Added `whispers` events (`whisper-received`)
- Added `bits` events (`bits`, `bitsbadge`)
- Added `lastLatency` method to check the latency of the last message sent.
- Renamed `open` event to `connected`
- Renamed `close` event to `closed`
- Warning event now emits a object with `message` and `latency` properties (no more `ms` (sorry Microsoft))
- Now you can chained listeners with the `on` method

  ```javascript
  pubsub
    .on("sub", (data) => console.log(data))
    .on("resub", (data) => console.log(data));
  ```

- Now you can remove listeners with the `off` method

  ```javascript
  pubsub.off("sub", (data) => console.log(data));
  ```

## v0.1.3 - 2022-08-08

- [FIX] _The `autoConnect` and `autoReconnect` options are now assigned to the correct option._ Sorry for the inconvenience :D

## v0.1.2 - 2022-08-07

- Renamed `subscribeTopics` to `registeredTopics`.
- Renamed `subscribedTopicsCount` to `registeredTopicsCount`.
- Renamed `isSubscribed` to `isRegisteredTopic`.
- Renamed `reconnect` option to `autoReconnect` (default `true`)
- Added `latency` value **(in ms)** to the `"pong"` event.
- Added promise support to the `connect` method.
- Added promise support to the `reconnect` method.
- Added promise support to the `disconnect` method.
- Added promise support to the `subscribe` method.
- Added promise support to the `unsubscribe` method.
- Added `"reconnectAttempts"` option ; default is `10`.
- Added `"reconnectInterval"` option ; default is `1000` (1s).
- Added `"warning"` event with an object containing the following properties:
  - `message`: the warning message
  - `ms`: value of the latency (in ms)
- Fixed a bug where the `"autoConnect"` option if set to false was ignored.
- Fixed a bug where topics are duplicated when subscribing to multiple topics.
- Fixed a bug where unsubscribing from a topic that was not subscribed to would throw an error. It is now verified that the topic is subscribed to before unsubscribing.
- Removed the `"connect"` event. Use `"open"` instead.
- Now if latency is greater than 10s, a `"warning"` event is emitted. If `"autoReconnect"` is set to `true`, the connection will be automatically disconnected and reconnected.

## v0.1.1 - 2022-08-06

- Added `state` method.
- Added `connect` method.
- Added `reconnect` method.
- Added `disconnect` method.
- Added `subscribedTopics` method.
- Added `subscribedTopicsCount` method.
- Added `isSubscribed` method.
- Added `autoConnect` option ; default is `true`.
- Added `reconnect` option ; default is `true`.
- Added `reward-redeemed` event.

## v0.1.0 - 2022-08-05

- First release.
