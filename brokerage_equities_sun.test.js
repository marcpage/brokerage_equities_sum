const code_under_test = require("./brokerage_equities_sum");

test("Test parsing empty input, no symbols", () => {
    expect(code_under_test.parse_and_add("", {}))
        .toBe("");
});

test("Test parsing empty input, one symbol", () => {
    expect(code_under_test.parse_and_add("", {AAPL: 55.00}))
        .toBe("# unseen: AAPL\n# Total value = $55.00\n\n");
});

test("Test parsing one input, one symbol", () => {
    expect(code_under_test.parse_and_add("AAPL\n", {AAPL: 55.00}))
        .toBe("AAPL\n# Total value = $55.00\n\n");
});

test("Test parsing two inputs, one symbol", () => {
    expect(code_under_test.parse_and_add("AAPL MSFT\n", {AAPL: 55.00}))
        .toBe("AAPL MSFT\n# Symbol MSFT was not found\n# Total value = $55.00\n\n");
});

test("Test parsing two inputs, two symbols", () => {
    expect(code_under_test.parse_and_add("AAPL MSFT\n", {AAPL: 55.00, MSFT: 110.01}))
        .toBe("AAPL MSFT\n# Total value = $165.01\n\n");
});

test("Test parsing 2x2 inputs, 4 symbols", () => {
    expect(code_under_test.parse_and_add("AAPL MSFT\nVTI VYM\n", 
        {AAPL: 55.00, MSFT: 110.01, VTI: 12.34, VYM: 43.21}))
        .toBe("AAPL MSFT\n# Total value = $165.01\n\nVTI VYM\n# Total value = $55.55\n\n");
});

test("Ensure extra blank lines are not added", () => {
    expect(code_under_test.parse_and_add(code_under_test.parse_and_add("AAPL MSFT\nVTI VYM\n", 
        {AAPL: 55.00, MSFT: 110.01, VTI: 12.34, VYM: 43.21}), 
        {AAPL: 55.00, MSFT: 110.01, VTI: 12.34, VYM: 43.21}))
        .toBe("AAPL MSFT\n# Total value = $165.01\n\nVTI VYM\n# Total value = $55.55\n\n");
});
