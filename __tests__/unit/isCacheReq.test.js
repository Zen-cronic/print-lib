const { isCacheReq } = require("../../src/testUtils");

describe("isCacheReq function", () => {
  describe("given the node version is >= v20.12.0", () => {
    it("should use the process.loadEnvFile function", () => {
      expect(typeof process.loadEnvFile).toBe("function");
    });
    it("should return true if the CACHE_REQUEST is set to true", async () => {
      process.env.CACHE_REQUEST = true;
      const result = await isCacheReq();

      expect(result).toBe(true);
    });
    it("should return false if the CACHE_REQUEST is not set or is false", async () => {
      delete process.env.CACHE_REQUEST;

      const result = await isCacheReq();
      expect(result).toBe(false);
    });
  });

  describe("given the node version is < v20.12.0", () => {
    it("should use the constructed env object", () => {
      process.loadEnvFile = "NOT A FUNCTION";
      expect(typeof process.loadEnvFile).not.toBe("function");
    });
    it("should return true if the CACHE_REQUEST is set to true", async () => {
      process.loadEnvFile = "NOT A FUNCTION";
      //read from file
      const result = await isCacheReq();

      expect(result).toBe(true);
    });
    it("should return false if the CACHE_REQUEST is not set or is false", async () => {
      delete process.env.CACHE_REQUEST;

      const result = await isCacheReq();
      expect(result).toBe(false);
    });
  });
});
