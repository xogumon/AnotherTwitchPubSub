/**
 * Options
 */
export interface thisOptions {
  /**
   * Options
   */
  accessToken: string;
  topics: string[];
  autoConnect: boolean;
  autoReconnect: boolean;
  reconnectInterval: number;
  reconnectAttempts: number;
}
class AnotherTwitchPubSubOptions {
  /**
   * Store the options.
   */
  private options: thisOptions = {
    accessToken: "",
    topics: [],
    autoConnect: true,
    autoReconnect: true,
    reconnectInterval: 10000,
    reconnectAttempts: 10,
  };

  /**
   * Set the options.
   */
  public set(options: thisOptions) {
    this.options = Object.assign({}, this.options, options);
    return this;
  }

  /**
   * Get the options.
   */
  public get() {
    return this.options;
  }

  /**
   * Set the access token.
   * @param accessToken The access token to use.
   * @returns This instance.
   */
  public setToken(accessToken: string) {
    this.options.accessToken = accessToken;
    return this;
  }

  /**
   * Set the topics to subscribe to.
   * @param topics The topics to subscribe to.
   * @returns This instance.
   */
  public setTopics(topics: string[]) {
    this.options.topics = topics;
    return this;
  }

  /**
   * Find a topic in the topics.
   * @param topic The topic to find.
   */
  public findTopic(topic: string) {
    return this.options.topics.indexOf(topic) > -1;
  }

  /**
   * Add a topic to the topics.
   * @param topic The topic to add.
   */
  public addTopic(topic: string) {
    if (!this.options.topics.includes(topic)) {
      this.options.topics.push(topic);
    }
    return this;
  }

  /**
   * Remove a topic from the topics.
   * @param topic The topic to remove.
   */
  public removeTopic(topic: string) {
    const index = this.options.topics.indexOf(topic);
    if (index > -1) {
      this.options.topics.splice(index, 1);
    }
    return this;
  }

  /**
   * Add topics to the topics.
   * @param topics The topics to add.
   */
  public addTopics(topics: string[]) {
    if (!Array.isArray(topics)) {
      this.addTopic(topics);
    } else {
      for (const topic of topics) {
        this.addTopic(topic);
      }
    }
    return this;
  }

  /**
   * Remove topics from the topics.
   * @param topics The topics to remove.
   */
  public removeTopics(topics: string[]) {
    if (!Array.isArray(topics)) {
      this.removeTopic(topics);
    } else {
      for (const topic of topics) {
        this.removeTopic(topic);
      }
    }
    return this;
  }
}
export default new AnotherTwitchPubSubOptions();
