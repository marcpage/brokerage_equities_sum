// ==UserScript==
// @name         Categorize Stocks
// @namespace    https://ResolveToExcel.com/
// @version      1.1
// @description  Group and summarize stocks by category in your brokerage account
// @author       Marc Page
// @match        https://oltx.fidelity.com/ftgw/fbc/*
// @match        https://invest.ameritrade.com/grid/p/*
// @grant        none
// ==/UserScript==

/* Change log:
    1.0 Initial release
    1.1 support equity balances with a comma in it (like $1,000)
*/

/* Scrapes the symbols and the value of current value of equities in the positions tab on Fidelity's site.
*/
function load_symbol_table_fidelity() {
    var headers = document.getElementsByClassName("ag-header")[0].getElementsByClassName("ag-header-cell");
    var current_value_index = Array.from(headers).findIndex(x => x.innerText.indexOf("Current Value") >= 0);
    var rows = document.getElementsByClassName("ag-row");
    var symbols = Array.from(rows).filter(e => e.getElementsByClassName("ag-cell").length == 1);
    var data = Array.from(rows).filter(e => e.getElementsByClassName("ag-cell").length > 1);
    var table = {};

    for (var row_index = 0; row_index < Math.min(rows.length, symbols.length); ++row_index) {
        var symbol_cell = symbols[row_index];
        var symbol_button = symbol_cell.getElementsByTagName("button");
        var symbol = symbol_button.length > 0 ? symbol_button[0].innerText : undefined;
        var row = data[row_index];
        var cells = row && row.getElementsByClassName ? row.getElementsByClassName("ag-cell") : undefined;
        var value_text = cells && cells.length > current_value_index ? cells[current_value_index - 1] : undefined;
        var value = value_text ? parseFloat(value_text.innerText.replace("$","").replace(",","")) : undefined;


        if (symbol && value) {
            table[symbol] = value;
        }
    }
    return table;
}


/* Scrapes the symbols and the market value of equities in the positions tab on TD Ameritrade's site.
*/

function load_symbol_table_ameritrade() {
    var table = {};
    var positions = document.getElementsByClassName("tdaBPTable")[1];
    var headers = positions.getElementsByTagName("th");
    var current_value_index = Array.from(headers).findIndex(x => x.innerHTML.indexOf("Mkt value") >= 0);
    var rows = positions.getElementsByTagName("tr");

    for (var row_index = 0; row_index < rows.length; ++row_index) {
        var columns = rows[row_index].getElementsByTagName("td");
        var symbol = columns[0] ? columns[0].innerText.replace(",","").replace(/\s+/, "") : undefined;
        var value_column = columns[current_value_index];
        var value = value_column ? parseFloat(value_column.innerText.replace(",","")) : undefined;

        if (symbol && value) {
            table[symbol] = value;
        } else {
            console.log("columns: " + columns);
            console.log("symbol: " + symbol);
            console.log("value_column: " + value_column);
            console.log("value: " + value);
        }
    }

    return table;
}

/* Parse the user's requested groups of equities and insert the sum of the values.
Any line prefixed with a # will be removed.
Lines not prefixed with a # are assumed to be a space-separated list of equity symbols.
Each such line will be followed by a list of symbols not on the page and the total value of the other symbols.
*/
function add_up_values(symbol_values) {
    var working_space = document.getElementById("working_space");
    var lines = working_space.value.split(/[\n]/);
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

    working_space.value = output;
}


/* Action to perform on Fidelity's site when user leaves the text field.
*/
function add_up_values_fidelity() {
    add_up_values(load_symbol_table_fidelity());
}


/* Action to perform on TD Ameritrade's site when user leaves the text field.
*/
function add_up_values_ameritrade() {
    add_up_values(load_symbol_table_ameritrade());
}


/* If we haven't added our text box yet to the page, add it (or re-add it if it was removed).
*/
function ensure_working_space() {
    var working_space = document.getElementById("working_space");

    if (!working_space) {
        var legend = document.getElementById("posweb-legend-main");
        var action = add_up_values_fidelity;

        if (!legend) {
            legend = document.getElementsByClassName("disclaimerModule")[0];
            action = add_up_values_ameritrade
        }

        working_space = document.createElement("textarea");
        working_space.setAttribute("rows", 30);
        working_space.setAttribute("cols", 120);
        working_space.setAttribute("placeholder", "enter list of stocks (space separated), grouped on lines");
        working_space.id = "working_space";
        working_space.addEventListener("blur", action);
        legend.insertBefore(working_space, legend.firstChild);
    }
}


(function() {
    'use strict';

    // check every 5 seconds to make sure the text box is still there
    setInterval(ensure_working_space, 5000);

})();
