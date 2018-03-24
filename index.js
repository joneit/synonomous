'use strict';

var transformers = require('./transformers');

var optionNames = ['transformations', 'propPath', 'dictPath'];

/**
 * @classdesc This object holds a list of transformations used by {@link Synonomous.prototype.getSynonyms} and {@link Synonomous.prototype.decorateList}.
 *
 * Additional transformer functions may be mixed into the prototype (or added to an instance).
 *
 * @param {object} [options]
 * @param {string[]} [transformations] - If omitted, {@link Synonomous.prototype.transformations} serves as a default.
 * @param {string} [propPath] - If omitted, {@link Synonomous.prototype.propPath} serves as a default.
 * @param {string} [dictPath] - If omitted, {@link Synonomous.prototype.dictPath} serves as a default.
 * @constructor
 */
function Synonomous(options) {
    if (options) {
        optionNames.forEach(function(key) {
            if (options[key]) {
                this[key] = options[key];
            }
        }, this);
    }
}

Synonomous.prototype = {
    constructor: Synonomous,

    /**
     * @summary Default list of active registered transformations by name.
     * @desc Used by {@link Synonomous.prototype.getSynonyms} and {@link Synonomous.prototype.decorateList}.
     *
     * An override may be defined on the instance, easily done by supplying as a constructor option.
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
     * @summary Drill down path for name to make synonyms of.
     * @desc Used by {@link Synonomous.prototype.decorateList}.
     *
     * This is the default property dot-path within each list element to find the value to make synonyms of.
     * If undefined (and no temporary override is given in the call to `decorateList`),
     * the element value itself (coerced to a string) is used to make the synonyms.
     *
     * The setter accepts any falsy value to undefine; or a string of dot-separated parts; or an array of parts.
     *
     * The getter always returns an array with a `toString` override that returns dot-separated string when coerced to a string.
     *
     * An override may be defined on the instance, easily done by supplying as a constructor option.
     *
     * The global default for all instances can be reset using the setter with the prototype as the execution context,
     * _e.g._ `Synonomous.prototype.propPath = newValue;`.
     *
     * @type {undefined|string[]}
     * @memberOf Synonomous#
     */
    set propPath(crumbs) {
        this._propPath = newBreadcrumbs(crumbs);
    },
    get propPath() {
        return this._propPath;
    },
    _propPath: ['name'], // default for all instances

    /**
     * @summary Default path to property to decorate; or undefined to decorate the object itself.
     * @desc Used by {@link Synonomous.prototype.decorate} and {@link Synonomous.prototype.decorateList}.
     *
     * The setter accepts any falsy value to undefine; or a string of dot-separated parts; or an array of parts.
     *
     * The getter always returns an array with a `toString` override that returns dot-separated string when coerced to a string.
     *
     * If undefined, decorations are placed in `list[this.dictPath[0]][this.dictPath[1]][etc]`; else decorations are placed directly on `list` itself.
     *
     * An override may be defined on the instance, easily done by supplying to as a constructor option.
     *
     * The global default for all instances can be reset using the setter with the prototype as the execution context,
     * _e.g._ `Synonomous.prototype.dictPath = newValue;`.
     *
     * @type {undefined|string|string[]}
     * @memberOf Synonomous#
     */
    set dictPath(crumbs) {
        this._dictPath = newBreadcrumbs(crumbs);
    },
    get dictPath() {
        return this._dictPath;
    },
    _dictPath: [], // default for all instances, settable by Synonomous.prototype.dictPath setter

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
                if (typeof transformers[key] !== 'function') {
                    throw new ReferenceError('Unknown transformer "' + key + '"');
                }
                var synonym = transformers[key](name);
                if (synonym !== '' && !(synonym in synonyms)) {
                    synonyms.push(synonym);
                }
            });
        }
        return synonyms;
    },

    /**
     * Decorate an object `obj` with properties named in `propNames` all referencing `item`.
     * @param {object} obj - The object to decorate. If `this.dictPath` is defined, then decorate `obj[this.dictPath]` instead (created as needed).
     *
     * @param {string[]} propNames
     * @param item
     * @returns {object} `obj`, now with additional properties (possibly)
     */
    decorate: function(obj, propNames, item) {
        var drilldownContext = drilldown(obj, this.dictPath);
        propNames.forEach(function(propName) {
            if (!(propName in drilldownContext)) {
                drilldownContext[propName] = item;
            }
        });
        return obj;
    },

    /**
     * @summary Add dictionary synonyms to an array.
     *
     * @desc Adds synonyms for a single element (`index`) or the entire array, based on a given property of each element (`propPath`) or the element itself.
     *
     * That is, each element is either converted to a string or is an object with a property named `propPath` converted to a string.
     *
     * All transformers named in `transformations` are run on that string and all the resulting unique non-blank "synonyms" are added as properties to the array with the value of the property being a reference to the element (if it was an object) or a copy of the element (if it was a string), subject to the following rules:
     * 1. Duplicate synonyms are not added.
     * 2. Blank synonyms are not added.
     *
     * @param {number} [index] - Index of element of `list` to add synonyms for. If omitted:
     * 1. Adds synonyms for all elements of `list`.
     * 2. `list` and `index` are promoted to the 1st and 2nd parameter positions, respectively.
     * @param {(string|Object.<string, string>)[]} list - Array whose element(s) to make synonyms of _and_ the object to decorate. If `this.dictPath` is defined, then decorate `list[this.dictPath]` instead (created as needed).
     * @param {string} [propPath=this.propPath] - Name of the property in each element of `list` to make synonyms of. If defined _and_ list element is an object, adds synonyms of `list[propPath]` as string; else adds synonyms of the list element itself as string.
     * @returns {Array} `list`
     * @memberOf Synonomous#
     */
    decorateList: function(index, list, propPath) {
        var elements;
        if (typeof index === 'number') {
            elements = [list[index]];
        } else {
            // promote args
            list = elements = arguments[0];
            propPath = arguments[1];
        }
        propPath = propPath ? newBreadcrumbs(propPath) : this.propPath;
        elements.forEach(function(item) {
            var value = propPath !== undefined && typeof item === 'object' ? drilldown(item, propPath) : item;
            var synonyms = this.getSynonyms(value);
            this.decorate(list, synonyms, item);
        }, this);
        return list;
    }
};


// a.k.a.'s:
Synonomous.prototype.decorateObject = Synonomous.prototype.decorate;
Synonomous.prototype.decorateArray = Synonomous.prototype.decorateList;


function drilldown(collection, breadcrumbs) {
    return breadcrumbs.reduce(function(result, crumb) {
        return result[crumb] || (result[crumb] = Object.create(null));
    }, collection);
}

function newBreadcrumbs(crumbs) {
    if (!crumbs) {
        crumbs = [];
    } else if (Array.isArray(crumbs)) {
        crumbs = crumbs.slice();
    } else {
        crumbs = (crumbs + '').split('.');
    }

    crumbs.toString = crumbsToString;

    return crumbs;
}

/**
 * @this {Array}
 * @returns {string}
 */
function crumbsToString() {
    return this.join('.');
}

module.exports = Synonomous;
