# synonomous
Transform strings into synonyms for list decoration

"... because `synonymous` was already registered!"

### Get some synonyms
To just get a list of synonyms for a given string using the default selection of "transformer" functions (`verbatim` and `toCamelCase`):
```js
var Synonomous = require('synonomous');
var synonomous = new Synonomous;
synonomous.getSynonyms('background-color');
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
var Synonomous = require('synonomous');
var synonomous = new Synonomous;
synonomous.getSynonyms('background-color', ['toAllCaps']);
```
Returns:
```js
[
   'BACKGROUND_COLOR'
]
```
#### Custom instance default
To set the default list of "transformer" functions for all subsequent calls from this instance:
```js
var customTransformationsList = ['verbatim', 'toAllCaps'];
synonomous.transformations = customTransformationsList;
```
#### Reset instance default
To reset to default:
```js
delete synonomous.transformations; // reveal Synonomous.prototype.transformations
```
#### Custom shared default
To override default for all subsequent calls from all instances:
To set the default list of "transformer" functions for all subsequent calls from this instance:
```js
var saveSharedDefault = synonomous.prototype.transformations; // save for later
synonomous.prototype.transformations = customTransformationsList;
...
// restore shared default later on:
synonomous.prototype.transformations = saveSharedDefault;
```

### Add a custom transformer
```js
var transformers = require('synonomous/transformers');
transformers.toQuotation = function(key) { return '"' + key + '"'; }

### Decorate an object with properties
To add properties all referencing another existing property (_i.e.,_ synonyms):
```js
var myObject = {}, item = {};
var propNames = ['width', 'thickness'];
synonomous.decorate(myObject, propNames, item);
```
Returns mutated `myObject`:
```
{
    'width': item,
    'thickness': item
}
```
Note that this function does not call `getSynonyms`; it merely adds properties to `myObject` with the names provided in `propNames` and sets them to `item`.

### Decorate an object property
Rather than adding the properties to `myObject` in the above example, you can also specify a property of `myObject` to decorate instead by defining `synonomous.dictPath` (which is undefined by default).
The target property is expected to be an object. If it does not exist, it will be created as an object (with null prototype).
Example:
```js
synonymous.dictPath = 'properties';
synonomous.decorate(myObject, propNames, item);
```
Returns:
```
{
    'properties': {
        'width': item,
        'thickness': item
    }
}
```
`dictPath` can also be a dot-path:
```js
synonymous.dictPath = 'properties.dimensions'; // or: ['properties'.'dimensions']
synonomous.decorate(myObject, propNames, item);
```
Returns:
```
{
    'properties': {
        'dimensions': {
            'width': item,
            'thickness': item
        }
    }
}
```
It is interesting to note that getting `synonymous.dictPath` always returns an array, but one with a `toString`
override such that when coerced to a string it returns dot-separated values, producing a dot-path.

`synonomous.dictPath` can be customized in the same manner as described above for `synonomous.transformations`.
### Decorate an array with synonyms
This is the real utility of the `synonomous` module:
```js
var synonomous = new Synonomous(['verbatim', 'toAllCaps', 'toCamelCase']);
var list = ['borderLeft', 'background-color'];
synonomous.decorateList(list);
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
Specifically, the array now has properties that point to elements whose keys are transformations of each element. This lets the array double as a dictionary to its own elements.

Note that this is not an enumeration; the property values are not integer indexes but rather references to the elements themselves.

The above also demonstrates overriding the default selection of "transformer" functions with a different selection by defining a new list in `synonomous.transfomations`, which is exactly what the constructor did with the supplied parameter containing such a list.

#### Decorating with synonyms of a single element
When you just want to decorate your list with synonyms of a single element of the list, you can specify the index of such an element with the overload `decorateList(index: number, list: (string|object)[])`:
```js
var synonomous = new Synonomous;
var list = ['borderLeft', 'background-color'];
synonomous.decorateList(1, list); // just decorate with synonyms for 2nd element
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
When elements are objects rather than string primitives, you can specify which property of such objects to make synonyms of with the overload `decorateList(list: (string|object)[], propName: string = 'name')`:
```js
var synonomous = new Synonomous;
var list = [
    { style: 'borderLeft', value: '8px' },
    { style: 'background-color', value: 'pink' }
];
synonomous.decorateList(list, 'style'); // decorate with synonyms of value of each element's `style` property
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
1. The `propName` parameter defaults to the value of the `synonomous.propName` property when omitted. When so defined, _and_ the list element is an object, `propName` is used to drill down into the list element. Otherwise the list element iteself (coerced to a string) is used as the source for the synonyms.
2. Both the `propName` parameter and the `synonomous.propName` property can be a dot-path (or an array), similar to `synonomous.dictPath`.
3. `synonomous.propName` can be customized in the same manner as described above for `synonomous.dictPath` and `synonomous.transformations`.

#### Decorating with synonyms of a property of a single element
You can of course combine these two features with the overload `decorateList(index: number, list: object[], propName: string = 'name')`:
```js
synonomous.decorateList(1, list, 'style');
```
Results same as above but only synonyms of the 2nd element are added to `list` (no `borderLeft` property in this case).

### Using synonyms in code

Note that the `toCamelCase` and `toAllCaps` transformers prepend a `$` to any results that start with a digit. This creates an identifier that can be used to the right of JavaScript's dot (`.`) dereferencing operator. (JavaScript identifiers may not start with a digit but may contain a `$`.) When decorating an array, this also avoids possible conflicts with an array's element indexes.

The `verbatim` transformer does not prepend `$`. Any results that are integers that would overwrite existing array indexes are not added as properties.

### Revision History

* **2.0.0**
   * Added `decorate` method and `dictPath` property.
   * Changed `propName` property to `propPath`. _(Breaking change if property used.)_
   * Changed optional constructor params to a single `options` object. _(Breaking change if params were used.)_
   * Moved transformers to their own file. _(Breaking change if you want to override and exsiting transformer or add a custom transformer.)_
* **1.0.2** - Fixed overloads of `decorateList` when first param `index` is omitted.
* **1.0.1** — Added `toTitle` transformer.
* **1.0.0** — Initial release.