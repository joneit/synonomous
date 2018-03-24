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

/**
 * @classdesc This object holds a list of transformations used by {@link Synonomous.prototype.getSynonyms} and {@link Synonomous.prototype.decorateList}.
 *
 * Additional transformer functions may be mixed into the prototype (or added to an instance).
 *
 *  @param {string[]} [transformations] - If omitted, {@link Synonomous.prototype.transformations} serves as a default.
 * @constructor
 */
function Synonomous(transformations, propName) {
    if (transformations) {
        this.transformations = transformations;
    }
    if (propName) {
        this.propName = propName;
    }
}

Synonomous.prototype = {
    constructor: Synonomous,

    /**
     * @summary Default list of active registered transformations by name.
     * @desc Used by {@link Synonomous.prototype.getSynonyms} and {@link Synonomous.prototype.decorateList}.
     * An override may be defined on the instance, easily done by supplying to constructor's 1st parameter.
     *
     * This is a global default; mutate only if you want to change the default for all your instances.
     * @see {@link Synonomous.prototype.verbatim}
     * @see {@link Synonomous.prototype.toCamelCase}
     * @default
     * @type {string[]}
     * @memberOf Synonomous#
     */
    transformations: [
        'verbatim',
        'toCamelCase'
    ],

    /**
     * @summary Default property name when list elements are objects.
     * @desc Used by {@link Synonomous.prototype.decorateList}.
     * An override may be defined on the instance, easily done by supplying to constructor's 2nd parameter.
     *
     * This is a global default; mutate only if you want to change the default for all your instances.
     * @default
     * @type {string[]}
     * @memberOf Synonomous#
     */
    propName: 'name',

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
    },

    /**
     * If `name` is a string and non-blank, returns an array containing unique non-blank converted names.
     * @param {string} name - String to make synonyms of.
     * @parma {string[]} transformations - When provided, temporarily overrides `this.transformations`.
     * @memberOf Synonomous#
     */
    getSynonyms: function(name, transformations) {
        var synonyms = [];
        if (typeof name === 'string' && name) {
            (transformations || this.transformations).forEach(function(key) {
                if (typeof this[key] !== 'function') {
                    throw new ReferenceError('Unknown transformer "' + key + '"');
                }
                var synonym = this[key](name);
                if (synonym !== '' && !(synonym in synonyms)) {
                    synonyms.push(synonym);
                }
            }, this);
        }
        return synonyms;
    },

    /**
     * @summary Add dictionary synonyms to an array.
     *
     * @desc Adds synonyms for a single element (`index`) or the entire array, based on a given property of each element (`propName`) or the element itself.
     *
     * That is, each element is either converted to a string or is an object with a property named `propName` converted to a string.
     *
     * All transformers named in `transformations` are run on that string and all the resulting unique non-blank "synonyms" are added as properties to the array with the value of the property being a reference to the element (if it was an object) or a copy of the element (if it was a string), subject to the following rules:
     * 1. Duplicate synonyms are not added.
     * 2. Blank synonyms are not added.
     *
     * @param {number} [index] - Index of element of `list` to add synonyms for. If omitted:
     * 1. Adds synonyms for all elements of `list`.
     * 2. `list` and `index` are promoted to the 1st and 2nd parameter positions, respectively.
     * @param {(string|Object.<string, string>)[]} list - Array to decorate _and_ whose element(s) to make synonyms of.
     * @param {string} [propName] - Name of the property in each element of `list` to make synonyms of. If omitted adds synonyms of the list element itself if a string or of the list element's `name` property if an object.
     * @returns {Array} `list`
     * @memberOf Synonomous#
     */
    decorateList: function(index, list, propName) {
        var elements;
        if (typeof index === 'number') {
            elements = [list[index]];
        } else {
            // promote args
            list = elements = arguments[0];
            propName = arguments[1];
        }
        propName = propName || this.propName;
        elements.forEach(function(item) {
            var name = typeof item !== 'object' ? item : item[propName];
            this.getSynonyms(name).forEach(function(synonym) {
                synonym = synonym.replace(REGEX_INITIAL_DIGIT, WITH_DOLLAR_PREFIX);
                if (!(synonym in list)) {
                    list[synonym] = item;
                }
            });
        }, this);
        return list;
    }
};

module.exports = Synonomous;
