require("jest-to-log");
const { describe, it, expect } = require("@jest/globals");
const { toNumber, formatDate } = require("../../src/utils");
const { handleRateLimit } = require("../../src/RequestHandler");
const { isCI } = require("../../src/testUtils");

describe("handleRateLimit function", () => {
  const origHeaders = {
    "x-ratelimit-limit": "5000",
    "x-ratelimit-remaining": "0",
    "x-ratelimit-reset": "1717198831",
    "x-ratelimit-used": "0",
    "x-ratelimit-resource": "core",
  };

  //ltr: UTC_EST && LOCAL_EST
  const UTC_EDT = "Fri, May 31, 2024, 11:40:31 PM";
  const LOCAL_EDT = "Fri, May 31, 2024, 7:40:31 PM";

  const usedDateTime = isCI() ? UTC_EDT : LOCAL_EDT;

  describe("given the rate limit has reached 50%", () => {
    it("should transform the return object accordingly", () => {
      const headers = {
        ...origHeaders,
        "x-ratelimit-used": "2500",
        "x-ratelimit-remaining": "2500",
      };
      const result = handleRateLimit(headers);
      const expected = {
        resetDateTime: usedDateTime,
        limit: 5000,
        used: 2500,
        reset: 1717198831,
        remaining: 2500,
        resource: "core",
      };

      expect(handleRateLimit.bind(null, headers)).toLogErrorOrWarn(
        "You've made 50% of endpoint requests" + "\n"
      );

      expect(result).toStrictEqual(expected);
    });
  });
  describe("given the rate limit has exceeded its limit", () => {
    it("should throw an appropriate Error message", () => {
      const headers = {
        ...origHeaders,
        "x-ratelimit-used": "5000",
        "x-ratelimit-remaining": "0",
      };

      const dateStr = usedDateTime;
      const errMsg = `Ratelimit almost reached or exceeded: 100%; Used: 5000; Limit: 5000;\nTry again after: ${dateStr}`;

      expect(() => {
        handleRateLimit(headers);
      }).toThrow(errMsg);
    });

    it("should throw if the retry-after header is present", () => {
      const headers = {
        ...origHeaders,
        "x-ratelimit-used": "5000",
        "x-ratelimit-remaining": "0",
        "retry-after": "3600",
      };

      const sec = toNumber(headers["retry-after"]);
      const ms = sec * 1000;
      const retryAfterDateTime = formatDate(new Date(Date.now() + ms));

      const errMsg = `Please retry your request after ${retryAfterDateTime} (${sec} seconds from now)`;

      expect(() => {
        handleRateLimit(headers);
      }).toThrow(errMsg);
    });
  });
});
