const code_under_test = require("./brokerage_equities_sum");

test("Test parsing empty input", () => {
    expect(code_under_test.parse_and_add("", {})).toBe("\n");
});
