import Options from "./Options";
export default {
  /**
   * isEmpty
   * @param obj Object to check
   * @returns True if the object is empty, false otherwise
   */
  isEmpty(obj: any) {
    if (
      obj === "" ||
      obj === 0 ||
      obj === false ||
      obj === null ||
      obj === undefined
    ) {
      return true;
    }
    if (Array.isArray(obj)) {
      return obj.length === 0;
    } else if (typeof obj === "object") {
      return Object.keys(obj).length === 0;
    }
    return false;
  },
  /**
   * Lowercase a array items
   * @param arr Array to lowercase
   * @returns Array with all items lowercased
   * @example
   * const arr = ['THIS', 'IS', 'A', 'TEST'];
   * const lowercased = arrayLowerCase(arr);
   * console.log(lowercased); // ['this', 'is', 'a', 'test']
   */
  arrayLowerCase(arr: any[]) {
    return arr.map((item) => item.toLowerCase());
  },
  /**
   * Repeat a method a number of times
   * @param fn Method to repeat
   * @param times Number of times to repeat
   * @returns Array with the repeated method
   * @example
   * const repeat = repeat(() => 1, 5);
   * console.log(repeat); // [1, 1, 1, 1, 1]
   */
  repeat(fn: Function, times: number) {
    let result = [];
    for (let i = 0; i < times; i++) {
      result.push(fn());
    }
    return result;
  },
  /**
   * Generate a random nonce
   * @returns Random nonce
   */
  nonce() {
    const random = () => Math.random().toString(36).substring(2, 15);
    return this.repeat(random, 2).join("");
  },
  /**
   * Convert a string to a camelCase string
   */
  toCamelCase(str: string) {
    return str.replace(/\s(.)/g, ($1) => $1.toUpperCase());
  },
  /**
   * Slugify a string
   * @param str String to slugify
   * @param sep Separator to use
   * @returns Slugified string
   * @example
   * const slug = slug("This is a string", "-");
   * console.log(slug); // this-is-a-string
   */
  slug(str: string, sep: string = "-") {
    if (typeof str !== "string") return "";
    if (typeof sep !== "string") sep = "-";
    str = str.toLowerCase().replace(/[^a-z0-9]/g, sep); // replace all non-alphanumeric characters with the separator
    if (sep.length > 0) {
      str = str
        .replace(new RegExp(`${sep}{2,}`, "g"), sep) // replace multiple separators with a single one
        .replace(new RegExp(`^${sep}|${sep}$`, "g"), ""); // remove leading and trailing separators
    }
    return str; // return the slug
  },
  /**
   * Slugify to camelCase string
   * @param str String to slugify
   * @returns Slugified string in camelCase without separators
   * @example
   * const slug = slugToCamelCase("This is a string");
   * console.log(slug); // thisIsAString
   */
  slugToCamelCase(str: string) {
    return this.slug(str)
      .replace(/-([a-z])/g, ($1: string) => $1.toUpperCase())
      .replace(/-/g, "");
  },
  /**
   * Remove duplicate values from an array
   * @param arr Array to remove duplicates from
   * @returns Array with no duplicates
   * @example
   * const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
   * const unique = removeDuplicates(arr);
   * console.log(unique); // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
   */
  removeDuplicates(arr: any[]) {
    return arr.filter((item, index) => arr.indexOf(item) === index);
  },
  /**
   * Validate a token with Twitch's API
   * @returns Validation result from Twitch's API
   */
  async validateToken() {
    const res = await fetch("https://id.twitch.tv/oauth2/validate", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `OAuth ${Options.get().accessToken}`,
      },
    });
    return await res.json();
  },
  /**
   * Get user data from Twitch's API
   * @param user User to get the ID of
   * @returns Array containing the user's ID
   * @example
   * const user = "twitch";
   * const token = "oauth:token";
   * const id = await getUserId(user, token);
   * console.log(id); // [1234]
   */
  async getUserId(user: any) {
    let find: string;
    if (typeof user === "string") {
      find = `login=${user}`;
    } else if (typeof user === "object") {
      find = user.map((name: string) => `login=${name}`).join("&");
    } else {
      throw new Error("User must be a string or an array of strings");
    }
    try {
      const api = await this.validateToken();
      if (api.client_id) {
        if (api.login === user.toLowerCase()) {
          return [api.user_id];
        } else {
          const res = await fetch(`https://api.twitch.tv/helix/users?${find}`, {
            headers: {
              "Client-ID": api.client_id,
              Authorization: `Bearer ${Options.get().accessToken}`,
            },
          });
          const data = await res.json();
          if (data.data.length > 0) {
            return data.data.map((user: any) => user.id);
          } else {
            throw new Error("User not found");
          }
        }
      } else {
        throw new Error("Invalid token");
      }
    } catch (err) {
      return console.log(err);
    }
  },
  /**
   * Returns if string is a number or not
   */
  isNumber(str: string) {
    return !isNaN(Number(str));
  },

  /**
   * Check if an topic is valid
   * @param topic Topic to check
   * @returns True if topic is valid, false otherwise
   * @example
   * console.log(isValidTopic('channel-bits-events-v2')); // true
   * console.log(isValidTopic('channel-bits-events-v3')); // false
   */
  isValidTopic(topic: string) {
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
    } catch (error) {
      return false;
    }
  },
  /**
   * Returns a correct format of a topic
   * @param topicName Topic to format
   * @returns Formatted topic
   */
  getTopicsFormat(topicName: string) {
    topicName = this.slugToCamelCase(topicName);
    const validTopics = {
      channelBitsEventsV1: "channel-bits-events-v2.$arg1$",
      channelBitsEventsV2: "channel-bits-events-v2.$arg1$",
      channelBitsBadgeUnlocks: "channel-bits-badge-unlocks.$arg1$",
      channelPointsChannelV1: "channel-points-channel-v1.$arg1$",
      channelSubscribeEventsV1: "channel-subscribe-events-v2.$arg1$",
      chatModeratorActions: "chat_moderator_actions.$arg1$.$arg2$",
      automodQueue: "automod-queue.$arg1$.$arg2$",
      userModerationNotifications:
        "user-moderation-notifications.$arg1$.$arg2$",
      whispers: "whispers.$arg1$",
    };
    return validTopics[topicName];
  },
  /**
   * Filter an array of topics
   * @param topics Array of topics to filter
   * @returns Array of valid topics
   */
  filterTopics(topics: string[]) {
    topics = this.arrayLowerCase(topics);
    topics = this.removeDuplicates(topics);
    return topics.filter((topic: string) => this.isValidTopic(topic));
  },
  /**
   * Parse a topic to get the arguments
   * @param topic Topic to parse
   * @returns Array of arguments
   */
  async parseTopic(topic: string) {
    let [topicName, arg1, arg2] = topic.split(".");
    const topicFormat = this.getTopicsFormat(topicName);
    if (topicFormat) {
      if (arg1 || arg2) {
        if (!this.isNumber(arg1) && !this.isNumber(arg2)) {
          [arg1, arg2] = await this.getUserId([arg1, arg2]);
        } else if (!this.isNumber(arg1)) {
          [arg1] = await this.getUserId(arg1);
        } else if (!this.isNumber(arg2)) {
          [arg2] = await this.getUserId(arg2);
        }
      } else {
        const validade = await this.validateToken();
        if (validade.login) {
          arg1 = validade.user_id;
          arg2 = validade.user_id;
        } else {
          throw new Error("Invalid token");
        }
      }
      if (this.isNumber(arg1) && this.isNumber(arg2)) {
        return topicFormat.replace("$arg1$", arg1).replace("$arg2$", arg2);
      } else {
        return topicFormat.replace("$arg1$", arg1);
      }
    }
    return null;
  },
  /**
   * Parse array of topics to get the arguments
   * @param topics Array of topics to parse
   * @returns Array of arguments
   */
  async parseTopics(topics: string[]) {
    this.filterTopics(topics);
    return await Promise.all(
      topics.map((topic: string) => this.parseTopic(topic))
    );
  },
};
