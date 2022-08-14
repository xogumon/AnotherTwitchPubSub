declare const _default: {
    isEmpty(obj: any): boolean;
    arrayLowerCase(arr: any[]): any[];
    repeat(fn: Function, times: number): any[];
    nonce(): any;
    toCamelCase(str: string): string;
    slug(str: string, sep?: string): string;
    slugToCamelCase(str: string): any;
    removeDuplicates(arr: any[]): any[];
    validateToken(): Promise<any>;
    getUserId(user: any): Promise<any>;
    isNumber(str: string): boolean;
    isValidTopic(topic: string): boolean;
    getTopicsFormat(topicName: string): any;
    filterTopics(topics: string[]): string[];
    parseTopic(topic: string): Promise<any>;
    parseTopics(topics: string[]): Promise<any[]>;
};
export default _default;
