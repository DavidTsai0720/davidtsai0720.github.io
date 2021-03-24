'use strict';
const { set_data } = require("./source/handler");
const methods = require("./methods/handler").print_result;
const select = require("./select/handler").main;
const desc = require("./desc/handler").main;
const { remove_active } = require("./helper");

const funcs = new Map([
    ["main-methods", select],
    ["exclude", select],
    ["select-action", select],
    ["remove-all", select],
    ["recovery-all", select],
    ["exclude-data", select],
    ["integrity-check", select],
    ["outlier", select],
    ["error-rate", select],
    ["error-time", select],
    ["correct", select],
    ["overall", select],
    ["details", select],
    ["more-details", select],
    ["error-rate", methods],
    ["error-time", methods],
    ["overall", methods],
    ["correct", methods],
    ["outlier", methods],
    ["integrity-check", methods],
    ["current-exclude", methods],
]);


window.onload = function() {
    document.querySelector("div[name=select-file]")
            .addEventListener("click", set_data);
    document.querySelector("div[name=instruction]")
            .addEventListener("click", desc)
    document.addEventListener("click", function(e) {
        try{
            let name = e.target.attributes.name.nodeValue;
            if (name) {
                remove_active(e);
                const func = funcs.get(name);
                func(name, e)
            }
        }
        catch(err) {}
    });
}