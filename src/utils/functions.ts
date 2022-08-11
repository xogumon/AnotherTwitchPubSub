export default {
  /**
   * Lowercase a array items
   * @param arr Array to lowercase
   * @returns Array with all items lowercased
   * @example
   * const arr = ['THIS', 'IS', 'A', 'TEST'];
   * const lowercased = utils.arrayLowerCase(arr);
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
   * const repeat = utils.repeat(() => 1, 5);
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
   * Slugify a string
   * @param str String to slugify
   * @param sep Separator to use
   * @returns Slugified string
   * @example
   * const slug = utils.slug("This is a string", "-");
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
   * Remove duplicate values from an array
   * @param arr Array to remove duplicates from
   * @returns Array with no duplicates
   * @example
   * const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
   * const unique = utils.removeDuplicates(arr);
   * console.log(unique); // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
   */
  removeDuplicates(arr: any[]) {
    return arr.filter((item, index) => arr.indexOf(item) === index);
  },
};
