# synonomous
Transform strings into synonyms for list decoration

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
Spcifically, the array now has properties that point to elements whose keys are transformations of each element. This lets the array double as a dictionary to its own elements.

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

#### Decorating with synonyms of a specified property of each element
When elements are objects rather than string primitives, you can specify which property of such objects to make synonyms of with the overload `decorateList(list: (string|object)[], propName: string = 'name')`:
```js
var synonomous = new Synonomous;
var list = [
    { style: 'borderLeft', value: '8px' },
    { style: 'background-color', value: 'pink' }
];
synonomous.decorateList(list, 'style'); // decorate with synonyms of `style` property of elements
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
Note that `propName` defaults to `'name'` when not given and the list element is an object rather than a string primitive.

#### Decorating with synonyms of a property of a single element
You can of course combine these two features with the overload `decorateList(index: number, list: object[], propName: string = 'name')`:
```js
synonomous.decorateList(1, list, 'style');
```
Results same as above but only synonyms of the 2nd element are added to `list` (no `borderLeft` property in this case).

### Using synonyms in code

Note that the `toCamelCase` and `toAllCaps` transformers prepend a `$` to any results that start with a digit. This creates an identifier that can be used to the right of JavaScript's dot (`.`) dereferencing operator. (JavaScript identifiers may not start with a digit but may contain a `$`.) When decorating an array, this also avoids possible conflicts with an array's element indexes.

The `verbatim` transformer does not prepend `$`. Any results that are integers that would overwrite existing array indexes are not added as properties.
