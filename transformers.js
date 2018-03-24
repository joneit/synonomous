'use strict';

// all instances of xX or _X
var REGEX_CAMEL_CASE_OR_UNDERSCORE = /([^_A-Z])([A-Z]+)/g;
var REGEX_ALL_PUNC_RUN = /[^a-z0-9]+/gi;

// all instances of _x
var REGEX_ALL_PUNC_RUN_BEFORE_LETTER = /[^a-z0-9]+([a-z0-9])?/ig;
function WITH_UPPER_CASE(match, char) { return char === undefined ? '' : char.toUpperCase(); }

var REGEX_INITIAL_DIGIT = /^(\d)/;
var WITH_DOLLAR_PREFIX = '$$$1';

var REGEX_INITIAL_CAPITAL = /^([A-Z])/;
function WITH_LOWER_CASE(match, char) { return char.toLowerCase(); }

var REGEXP_LOWER_CASE_LETTER = /[a-z]/;
var REGEXP_WORD_SEPARATORS = /[\s\-_]*([^\s\-_])([^\s\-_]+)/g;
var WITH_CAPTIAL_LETTER = function(a, b, c) { return b.toUpperCase() + c; };

var REGEXP_CAPITAL_LETTERS = /[A-Z]+/g;
var WITH_PREFIXED_SPACE = ' $&';

var REGEXP_OVER_CAPITALIZED_WORDS = /([A-Z]+)([A-Z][a-z])/g;
var WITH_SEPARATE_WORDS = '$1 $2';

/** @typedef {function} Transformer
 * @param {string} key
 * @returns {string}
 */

module.exports = {
    /** A transformer that returns its input converted to a string with ` + '' `.
     * @memberOf Synonomous#
     */
    verbatim: function(key) {
        return key + '';
    },

    /** A transformer that converts runs of punctuation (non-alphanumerics, actually) to "camelCase" by removing such runs and capitalizing the first letter of each word.
     * The first letter of the first word is forced to lower case.
     * Otherwise, leaves other letters' case as they were.
     *
     * When the result begins with a digit, it's prefixed with with `$` for two reasons:
     * 1. To avoid conflicts with array element indexes.
     * 2. To create an identifier that can be used to the right of the dot (`.`) dereferencing operator (identifiers cannot start with a digit but can contain a `$`).
     *
     * @type {Transformer}
     * @memberOf Synonomous#
     */
    toCamelCase: function(key) {
        return key
            .replace(REGEX_ALL_PUNC_RUN_BEFORE_LETTER, WITH_UPPER_CASE)
            .replace(REGEX_INITIAL_DIGIT, WITH_DOLLAR_PREFIX)
            .replace(REGEX_INITIAL_CAPITAL, WITH_LOWER_CASE);
    },

    /** A transformer that converts all runs of punctuation (non-alphanumerics, actually), as well as all camel case transitions, to underscore.
     * Results are converted to all caps.
     *
     * When the result begins with a digit, it's prefixed with with `$` for two reasons:
     * 1. To avoid conflicts with array element indexes.
     * 2. To create an identifier that can be used to the right of the dot (`.`) dereferencing operator (identifiers cannot start with a digit but can contain a `$`).
     *
     * @type {Transformer}
     * @memberOf Synonomous#
     */
    toAllCaps: function(key) {
        return key
            .replace(REGEX_ALL_PUNC_RUN, '_')
            .replace(REGEX_CAMEL_CASE_OR_UNDERSCORE, '$1_$2')
            .replace(REGEX_INITIAL_DIGIT, WITH_DOLLAR_PREFIX)
            .toUpperCase();
    },

    /**
     * A transformer that separates camel case or white-space-, hyphen-, or underscore-separated-words into truly separate words and capitalizing the first letter of each.
     *
     * This transformer is meant to create column headers from column names. It deliberating inserts spaces so the results are unsuitable as JavaScript identifiers.
     * @type {Transformer}
     * @memberOf Synonomous#
     */
    toTitle: function(key) {
        return (REGEXP_LOWER_CASE_LETTER.test(key) ? key : key.toLowerCase())
            .replace(REGEXP_WORD_SEPARATORS, WITH_CAPTIAL_LETTER)
            .replace(REGEXP_CAPITAL_LETTERS, WITH_PREFIXED_SPACE)
            .replace(REGEXP_OVER_CAPITALIZED_WORDS, WITH_SEPARATE_WORDS)
            .trim();
    }
};
