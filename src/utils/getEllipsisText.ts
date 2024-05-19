/**
 * This function takes a string and returns a shortened version with an ellipsis in the middle if the
 * string is longer than a specified length.
 * @param {string} str - The input string that needs to be truncated with ellipsis.
 * @param [n=5] - The number of characters to show at the beginning of the string before the ellipsis.
 * @param [m=4] - The parameter `m` in the `getEllipsisTxt` function is the number of characters to
 * show at the end of the string after the ellipsis. By default, it is set to 5.
 * @returns a string that is a truncated version of the input string with an ellipsis in the middle.
 * The length of the truncated string is determined by the value of the `n` parameter, and the number
 * of characters to include at the end of the string is determined by the value of the `m` parameter.
 * If the input string is shorter than the combined length of `n`
 */
const getEllipsisTxt = (str: string, n = 5, m = 4): string => {
  try {
    if (str) {
      // need to do this otherwise substr will throw error
      // eslint-disable-next-line no-param-reassign
      str = str.toString();
      if (str.length <= n + m + 3) return str;
      return `${str.substr(0, n)}...${str.substr(str.length - m, str.length)}`;
    }
    return '';
  } catch (err) {
    return str;
  }
};

export default getEllipsisTxt;
