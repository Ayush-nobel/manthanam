/**
 * One address, nothing else: no spaces, quotes, backslashes, commas, semicolons, angle brackets or
 * control characters, so a value can never smuggle extra recipients into an email's To or Cc.
 */
export const EMAIL_ADDRESS = /^[^\s@"\\,;<>()[\]:\x00-\x1f\x7f]+@[^\s@"\\,;<>()[\]:\x00-\x1f\x7f]+\.[^\s@"\\,;<>()[\]:\x00-\x1f\x7f]+$/;
