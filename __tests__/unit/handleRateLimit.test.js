const { handleRateLimit } = require("../../src/request");

describe("handleRateLimit function", () => {
  describe("basic sanity ", () => {
    it("should first", () => {
      expect(true).toBe(true);
    });
  });

  describe("given rate limit has reached 50%", () => {
    it("should ", () => {
      const res = {
        headers: {
          "x-ratelimit-limit": "5000",
          "x-ratelimit-remaining": "2500",
          "x-ratelimit-reset": "1717198831",
          "x-ratelimit-used": "2500",
          "x-ratelimit-resource": "core",
        },
      };
      const headers = res.headers;

      const result = handleRateLimit(headers);
      const expected = {
        resetDateTime: "Fri, May 31, 2024, 7:40:31 PM",
        limit: 5000,
        used: 2500,
        reset: 1717198831,
        remaining: 2500,
        resource: "core",
      };

      expect(result).toStrictEqual(expected);
    });
  });
});
