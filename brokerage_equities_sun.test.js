const code_under_test = require("./brokerage_equities_sum");

test("Test parsing empty input, no symbols", () => {
    expect(code_under_test.parse_and_add("", {}))
        .toBe("\n");
});

test("Test parsing empty input, one symbol", () => {
    expect(code_under_test.parse_and_add("", {AAPL: 55.00}))
        .toBe("\n# unseen: AAPL\n# Total value = $55.00\n\n");
});

test("Test parsing empty input, one symbol", () => {
    expect(code_under_test.parse_and_add("AAPL\n", {AAPL: 55.00}))
        .toBe("\n# unseen: AAPL\n# Total value = $55.00\n\n");
});
