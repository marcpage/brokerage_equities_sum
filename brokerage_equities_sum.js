// ==UserScript==
// @name         Categorize Stocks
// @namespace    https://ResolveToExcel.com/
// @version      1.1.7
// @description  Group and summarize stocks by category in your brokerage account
// @author       Marc Page
// @match        https://oltx.fidelity.com/ftgw/fbc/*
// @match        https://digital.fidelity.com/ftgw/digital/portfolio/*
// @match        https://client.schwab.com/app/accounts/positions/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/marcpage/brokerage_equities_sum/main/brokerage_equities_sum.js
// @downloadURL  https://raw.githubusercontent.com/marcpage/brokerage_equities_sum/main/brokerage_equities_sum.js
// @homepageURL  https://github.com/marcpage/brokerage_equities_sum
// ==/UserScript==

/* Change log:
    1.0 Initial release
    1.1 support equity balances with a comma in it (like $1,000)
    1.1.3 Updates for changes to websites
    1.1.4 Updates for Fidelity
    1.1.5 Staging for unit tests
    1.1.6 Improved Fidelity input placement (11/5/2023)
    1.1.7 Replaced TD Ameritrade with Schwab (11/5/2023)
*/

/* Scrapes the symbols and the value of current value of equities in the positions tab on Fidelity's site.
*/
function load_symbol_table_fidelity() {
    var headers = document.getElementsByClassName("ag-header")[0].getElementsByClassName("ag-header-cell");
    var current_value_index = Array.from(headers).findIndex((x) => x.innerText.indexOf("Current Value") >= 0);
    var rows = document.getElementsByClassName("ag-row");
    var data = Array.from(rows).filter(e => e.getElementsByClassName("ag-cell").length > 1);
    var table = {};
    var symbols = Array.from(rows).filter(e => e.getElementsByClassName("ag-cell").length == 1);

    for (var row_index = 0; row_index < rows.length; ++row_index) {
        var row = data[row_index];
        var cells = row && row.getElementsByClassName ? row.getElementsByClassName("ag-cell") : undefined;
        var value_text = cells && cells.length > current_value_index ? cells[current_value_index] : undefined;
        var value = value_text ? parseFloat(value_text.innerText.replace("$","").replace(",","")) : undefined;
        var symbol_cell = cells ? cells[0] : undefined;
        var symbol_div = symbol_cell ? symbol_cell.getElementsByClassName("posweb-cell-symbol-name_container") : undefined;
        var symbol = symbol_div && symbol_div.length > 0 ? symbol_div[0].innerText.replace("Has Activity Today", "").replace("Not Priced Today", "").trim() : undefined;

        if (!symbol) {
            var symbol_button = symbols[row_index] ? symbols[row_index].getElementsByTagName("button") : [];

            symbol = symbol_button.length > 0 ? symbol_button[0].innerText : undefined;
            value_text = cells && cells.length > current_value_index ? cells[current_value_index - 1] : undefined;
            value = value_text ? parseFloat(value_text.innerText.replace("$","").replace(",","")) : undefined;
        }

        if (symbol && value) {
            table[symbol] = value;
        }
    }
    console.log(table);
    return table;
}


/* Scrapes the symbols and the market value of equities in the positions tab on Schwab's site.
*/

function load_symbol_table_schwab() {
    var table = {};
    var positions = document.getElementById("responsiveTable");
    var rows = positions.getElementsByTagName("tr");
    var header_names = Array.from(rows[0].getElementsByTagName("th"))
                        .map(h => h.innerText.replace(/^\s+/, "").replace(/\s+$/, ""));
    var symbol_rows = Array.from(rows).filter(r => r.getElementsByTagName("td").length == 12);
    var market_value_index = Array.from(header_names).findIndex(x => x.indexOf("Market Value") >= 0) - 1;

    for (var r = 0; r < symbol_rows.length; ++r) {
        var symbol = symbol_rows[r].getElementsByTagName("th")[0].innerText.replace(',', '').replace(/^\s+/, "").replace(/\s+$/, "");
        var fields = symbol_rows[r].getElementsByTagName("td");
        var value_text = fields[market_value_index].getElementsByTagName("div")[0].childNodes[0].nodeValue;
        var value = parseFloat(value_text.replace('$', '').replace(/^\s+/, "").replace(/\s+$/, ""));

        table[symbol] = value;
    }

    return table;
}


function parse_and_add(text, symbol_values) {
    var lines = text.split(/[\n]/);
    var output = "";
    var unseen_symbols = Object.keys(symbol_values);

    for (var line_index = 0; line_index < lines.length; ++line_index) {
        var line = lines[line_index];

        if (line.match(/^\s*#/)) {
            continue;
        }


        output += line + "\n";

        if (line.match(/^\s*$/)) {
            continue;
        }

        var symbols = line.split(/\s+/);
        var total = 0.0;

        for (var symbol_index = 0; symbol_index < symbols.length; ++symbol_index) {
            let symbol = symbols[symbol_index];

            if (!symbol_values[symbol]) {
                output += "# Symbol " + symbol + " was not found\n";
            } else {
                total += symbol_values[symbol];
                unseen_symbols = unseen_symbols.filter(e => e != symbol);
            }
        }

        if (total > 0.0) {
            output += "# Total value = $" + total.toFixed(2) + "\n\n";
        }

    }

    if (unseen_symbols.length > 0) {
        var unseen_total = 0.0;

        output += "# unseen: " + unseen_symbols.join(", ") + "\n";

        for (var unseen_symbol_index = 0; unseen_symbol_index < unseen_symbols.length; ++unseen_symbol_index) {
            unseen_total += symbol_values[unseen_symbols[unseen_symbol_index]];
        }

        output += "# Total value = $" + unseen_total.toFixed(2) + "\n\n";
    }

    return output;
}


/* Parse the user's requested groups of equities and insert the sum of the values.
Any line prefixed with a # will be removed.
Lines not prefixed with a # are assumed to be a space-separated list of equity symbols.
Each such line will be followed by a list of symbols not on the page and the total value of the other symbols.
*/
function add_up_values(symbol_values) {
    var working_space = document.getElementById("working_space");

    working_space.value = parse_and_add(working_space.value, symbol_values);
}


/* Action to perform on Fidelity's site when user leaves the text field.
*/
function add_up_values_fidelity() {
    add_up_values(load_symbol_table_fidelity());
}


/* Action to perform on Schwab's site when user leaves the text field.
*/
function add_up_values_schwab() {
    add_up_values(load_symbol_table_schwab());
}


/* If we haven't added our text box yet to the page, add it (or re-add it if it was removed).
*/
function ensure_working_space() {
    var working_space = document.getElementById("working_space");
    console.log("*** ensure_working_space called");
    if (!working_space) {
        var legend = document.getElementsByClassName("portfolio-card-container__top");
        var action = add_up_values_fidelity;

        console.log("*** creating a working space");
        if (legend) {
            console.log("Found portfolio-card-container__top");
            legend = legend[0];
        }
        if (!legend) {
            legend = document.getElementsByClassName("with-customize");

            if (legend) {
                console.log("Found with-customize");
                legend = legend[0];
            }
        }
        if (!legend) {
            legend = document.getElementById("posweb-legend-main");
        }
        if (!legend) {
            console.log("*** Fidelity legend not found");
            legend = document.getElementsByClassName("sdps-grid-container")[0];
            action = add_up_values_schwab;
        }
        if (!legend) {
            console.log("** legend not found");
            return;
        }

        working_space = document.createElement("textarea");
        working_space.setAttribute("rows", 30);
        working_space.setAttribute("cols", 120);
        working_space.setAttribute("placeholder", "enter list of stocks (space separated), grouped on lines");
        working_space.id = "working_space";
        working_space.addEventListener("blur", action);
        legend.insertBefore(working_space, legend.firstChild);
        console.log("*** inserting working space before " + legend);
    }
}


(function() {
    'use strict';
    var isMonkey = true;
    try {isMonkey = 'undefined' === typeof GM_info.script.exclude;} catch {isMonkey = false;}

    // check every 5 seconds to make sure the text box is still there
    if (isMonkey) {
        setInterval(ensure_working_space, 5000);
    }

})();

module.exports = {
    parse_and_add: parse_and_add,
};
