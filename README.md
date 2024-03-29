# Brokerage Equities Sum

TamperMonkey script to be able to quickly sum up the value of selected equities on your brokerage page.

## Supported Brokerage sites

Currently only Fidelity and Schwab brokerage pages are supported.

## Supported browsers

This script has been tested with 
- Safari 17.1
- macOS 14.1
- Tampermonkey 4.20.6188

## Usage

A text box will be inserted above your list of equities in the "Positions" tab on Fidelity or My Accounts -> Positions page on Schwab.
In this box enter groupings of equity symbols separated by spaces. 
When you are done, click outside the text area.
<img width="893" alt="Screen Shot 2022-08-20 at 3 07 27 PM" src="https://user-images.githubusercontent.com/695749/185764401-1032e6ed-7639-4f13-9ac1-59405604051b.png">

The box will be updated with the sum of the value of these equities on the table above.
<img width="865" alt="Screen Shot 2022-08-20 at 3 07 35 PM" src="https://user-images.githubusercontent.com/695749/185764403-0bf9957f-a922-4757-8c33-5359c9e3fc79.png">


## Install

1. Install [TamperMonkey](https://www.tampermonkey.net)
1. [Install the script](https://raw.githubusercontent.com/marcpage/brokerage_equities_sum/main/brokerage_equities_sum.js)

