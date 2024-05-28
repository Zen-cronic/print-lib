const { transformUrlStr } = require("../../index");


describe("transformUrlStr function", () => {
  describe("given a valid url from github.com", () => {
    it("should parse", () => {
      const origUrl =
        "https://github.com/Zen-cronic/scope-logger/tree/main/lib/inner/end";

      const apiUrl = transformUrlStr(origUrl);

      const expectedUrl =
        "https://api.github.com/repos/Zen-cronic/scope-logger/contents/lib/inner/end";
      expect(apiUrl).toBe(expectedUrl);
    });
  });

  describe("given a url from any other domain", () => {
    it("should throw", () => {
      const origUrl =
        "https://not.github.com/Zen-cronic/scope-logger/tree/main/lib/inner/end";

      expect(() => transformUrlStr(origUrl)).toThrow();
    });
  });

  describe("given an invalid param type is passed (only string and URL)", () => {
    it("should throw", () => {
      const invalidParams = [
        42,
        true,
        null,
        undefined,
        {},
        [],
        new Date(),
        function () {},
      ];

      invalidParams.forEach((p) => {
        expect(() => transformUrlStr(p)).toThrow();
      });
    });
  });
});
