# synonomous
Decorate an array instance with synonyms of its elements

_"... because `synonymous` was already registered!"_

### Get some synonyms
To just get a list of synonyms for a given string using the default selection of "transformer" functions (`verbatim` and `toCamelCase`):
```js
var Decorator = require('synonomous');
var decorator = new Decorator;
decorator.getSynonyms('background-color');
```
Returns:
```js
[
    'background-color',
    'backgroundColor'
]
```
To temporarily override the default list of "transformer" functions for a single call to `getSynonyms`:
```js
decorator.getSynonyms('background-color', ['toAllCaps']);
```
Returns:
```js
[
   'BACKGROUND_COLOR'
]
```
#### Setting a custom instance default
To set the default list of "transformer" functions for all subsequent calls from this instance:
```js
var customTransformationsList = ['verbatim', 'toAllCaps'];
decorator.transformations = customTransformationsList;
```
#### Reset instance default to global default
To reset to default:
```js
delete decorator.transformations; // reveal Synonymous.prototype.transformations
```
#### Setting a custom shared default
To override the shared default for all subsequent calls from all instances:
```js
var saveSharedDefault = decorator.prototype.transformations; // save for later
decorator.prototype.transformations = customTransformationsList;
...
// restore shared default later on:
decorator.prototype.transformations = saveSharedDefault;
```

### Add a custom transformer
```js
var transformers = require('synonomous/transformers');
transformers.toQuotation = function(key) { return '"' + key + '"'; }
```
This access to the `transformers` namespace also permits overriding a built-in transformer, although doing so is _not recommended._

### Decorate an object with properties
To add properties to an object, all with the same value (_i.e.,_ synonyms), use the `decorateObject` (aka `decorate`) method:
```js
var myObject = {}, value = {};
var propNames = ['width', 'thickness'];
decorator.decorateObject(myObject, propNames, value); // aka `decorate`
```
Mutates and returns `myObject`:
```
{
    'width': value,
    'thickness': value
}
```
Note that this function does not call `getSynonyms`; it merely adds properties to `myObject` with the names provided in `propNames` and sets them to `value`.

### Decorate an object property
Rather than adding the properties to `myObject` object directly (_i.e.,_ to the "root" of the object) as in the above example, you can optionally specify a property _of_ `myObject` to decorate instead by defining a path to a "dictionary" property in `decorator.dictPath` (which is undefined by default). The specified dictionary property is expected to be an object. If it does not exist, it is created as an object (with null prototype).

Example:
```js
decorator.dictPath = 'properties';
decorator.decorateObject(myObject, propNames, value);
```
Returns:
```
{
    'properties': {
        'width': value,
        'thickness': value
    }
}
```
`dictPath` can also be a dot-path:
```js
decorator.dictPath = 'properties.dimensions'; // or: ['properties'.'dimensions']
decorator.decorateObject(myObject, propNames, value);
```
Returns:
```
{
    'properties': {
        'dimensions': {
            'width': value,
            'thickness': value
        }
    }
}
```
It is interesting to note that referencing `decorator.dictPath` always returns an array, but one with a `toString`
override such that when the array is coerced to a string it returns a "dot-path," a string containing dot-separated parts:
```js
console.dir(decorator.dictPath); // Array(2) -> ["properties", "dimensions"]
console.log(decorator.dictPath); // "properties.dimension"
```

`decorator.dictPath` can be customized in the same manner as described above in [_Setting a custom instance default_](#setting-a-custom-instance-default) for `decorator.transformations`.
### Decorate an array with synonyms
Here we arrive at the real utility of this `synonomous` module. To add synonyms as properties to an array of objects, use the `decorateArray` (aka `decorateList`) method:
```js
var list = ['borderLeft', 'background-color'];
decorator.transformations = ['verbatim', 'toAllCaps', 'toCamelCase'];
decorator.decorateArray(list); // aka `decorateList`
```
This call decorates and returns `list` which would then look like this:
```js
{
    0: 'borderLeft', // 1st array element
    1: 'background-color', // 2nd array element
    'borderLeft': list[0], // verbatim (camelCase duplicates this result)
    'BORDER_LEFT': list[0], // all caps
    'background-color': list[1], // verbatim
    'BACKGROUND_COLOR': list[1], // all caps
    'backgroundColor': list[1] // camelCase
 }
```
**Specifically, the array now has new properties whose keys are transformations of each element _and whose values are references to them._ This lets the array double as a dictionary to its own elements.**

Note that this is not an enumeration; the property values are not integer indexes but rather references to the elements themselves. Also note that when elements contain primitive values, the new synonyms properties' values will be copies of them rather than references to them.

#### Decorating with synonyms of a single element
When you just want to decorate your list with synonyms of a single element of the list, you can specify the index of such an element with the overload `decorateArray(index: number, list: (string|object)[])`:
```js
var list = ['borderLeft', 'background-color'];
delete decorator.transformations; // revert to default (verbatim and camelCase)
decorator.decorateArray(1, list); // just decorate with synonyms for 2nd element
```
`list` now looks like this:
```js
{
    0: 'borderLeft', // 1st array element
    1: 'background-color', // 2nd array element
    'background-color': list[1], // verbatim
    'backgroundColor': list[1] // camelCase
 }
```

#### Decorating with a property of an element
When elements are objects rather than string primitives, you can specify which property of such objects to make synonyms of with the overload `decorator.decorateArray(list: (string|object)[], propPath: (string|array) = decorator.propPath)`:
```js
var list = [
    { style: 'borderLeft', value: '8px' },
    { style: 'background-color', value: 'pink' }
];
decorator.decorateArray(list, 'style'); // decorate with synonyms of each element's `style` property
```
`list` now looks like this:
```js
{
    0: { style: 'borderLeft', value: '8px' }, // 1st array element
    1: { style: 'background-color', value: 'pink' }, // 2nd array element
    'borderLeft': list[0], // verbatim (camelCase duplicates this result)
    'background-color': list[1], // verbatim
    'backgroundColor': list[1] // camelCase
 }
```
Notes:
1. When omitted, the `propPath` parameter defaults to the value of the `decorator.propPath` property, whose initial value is `'name'`. When the list element is an object, this path is used to drill down into the list element. Otherwise (if path is undefined, even after applying the default _or_ the list element is not an object), the list element iteself (coerced to a string) is used as the source for the synonyms.
2. Both the `propPath` parameter and the `decorator.propPath` property can be a dot-path (or an array), similar to `decorator.dictPath`.
3. `decorator.propPath` can be customized in the same manner as described above in [_Setting a custom instance default_](#setting-a-custom-instance-default) for `decorator.dictPath` and `decorator.transformations`.

#### Decorating with synonyms of a property of a single element
You can of course combine these two features with the overload `decorator.decorateArray(index: number, list: object[], propPath: (string|array) = decorator.propPath)`:
```js
decorator.decorateArray(1, list, 'style');
```
Results same as above but only synonyms of the 2nd element (index `1`) are added to `list` (no `borderLeft` property in this case).

#### Decorating elements with strings
As an alterative to decorating the list with synonyms of the elements, you can also decorate the elements themselves with the synonym strings. To do this, set `this.transformations` to an object rather than an array of strings. The keys are the transformer names and the values are used as dot-paths into each element to put the string result of the transformer call.
```js
this.transformers = {
    toCamelCase: 'id',
    toTitle: 'info.title'
};
var list = [
    { style: 'borderLeft', value: '8px' },
    { style: 'background-color', value: 'pink' }
];
decorator.decorateArray(list, 'style');
```
list` now looks like this:
```js
{
    0: {
        style: 'borderLeft',
        value: '8px',
        id: 'borderLeft',
        info: {
            title: 'Border Left'
        }
    },

    1: {
        style: 'background-color',
        value: 'pink' ,
        id: 'backgroundColor',
        info: {
            title: 'Background Color'
        }
    }
```

### Using synonyms in code

Note that the `toCamelCase` and `toAllCaps` transformers prepend a `$` to any results that start with a digit. This creates an identifier that can be used to the right of JavaScript's dot (`.`) dereferencing operator. (JavaScript identifiers may not start with a digit but may contain a `$`.) When decorating an array, this also avoids possible conflicts with an array's element indexes.

The `verbatim` transformer does not prepend `$`. Any results that are integers that would overwrite existing array indexes are not added as properties by `decorateArray`.

### Instantiation options
The constructor takes a single optional parameter, an `options` object, which is a shorthand method of setting the `transformations`, `dictPath`, and `propPath` properties.

For example, to set up a `header` field for each element, based on its `name` field`:
```js
var decorator = new Decorator({
    transformations: ['toTitle'],
    propPath: 'name',
    dictPath: '*.header'
}
### Revision History

* **2.1.2** - `decorate` no longer adds integer synonyms because they are indistinguishable from and may clash with array indexes. (This is aimed at the `verbatim` transformer; the `toCamelCase` and `toAllCaps` transformers never return integer synonyms because they always prepend a `$` character to synonyms beginning with a digit.)
* **2.1.1** — Added `force` property to force overwriting existing property values with new values. Otherwise new values are discarded.
* **2.1.0** — `transformations` property can now be an object as well an array of strings. The keys of the object name the transformers. The values are not used by `decorateObject` but are used by `decorateArray` to add new string properties to each element.
* **2.0.1**
   * Fixed `decorate` to return the given object itself (instead of the drill-down context within the given object).
   * Added two method a.k.a.'s to clarify the intent of each:
       * `decorateObject` for `decorate`
       * `decorateArray` for `decorateList`
* **2.0.0**
   * Added `decorate` method and `dictPath` property.
   * Changed `propName` property to `propPath`. _(Breaking change if property used.)_
   * Changed optional constructor params to a single `options` object. _(Breaking change if params were used.)_
   * Moved transformers to their own file. _(Breaking change if you want to override and exsiting transformer or add a custom transformer.)_
* **1.0.2** — Fixed overloads of `decorateList` when first param `index` is omitted.
* **1.0.1** — Added `toTitle` transformer.
* **1.0.0** — Initial release.