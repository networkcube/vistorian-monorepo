swiftSet.js
===========

`swiftSet.js` provides a javascript `Set` data type for storing unique values and performing basic set operations _swiftly_. It also includes a discrete-value `Histogram` class which is used as a backing object for `Set`, although it can also be used on its own. `swiftSet.js` can handle numeric values, strings, and objects if they're properly configured. Virtually any type of object can be part of a `Set`. 

Contents
+ [Set](#set)
  + [Usage](#usage)
    + [Set Operations](#set-operations)
    + [Sets of Objects](#sets-of-objects)
      + [The `toString` Method](#the-tostring-method)
      + [The Object `hkey` Method](#the-object-hkey-method)
      + [The Global Key Method](#the-global-key-method)
      + [The Wrapper Method](#the-wrapper-method)
    + [Mixed Values](#mixed-values)
      + [How The Wrapper Works](#how-the-wrapper-works)
      + [Specify A Custom `tostring` Method For The Wrapper](#specify-a-custom-tostring-method-for-the-wrapper)
    + [Static Set Operations](#static-set-operations)
      + [Setting A Global Uid Method For Static Set Operations](#setting-a-global-uid-method-for-static-set-operations)
  + [How `Set` uses `Histogram` For Fast Operations](#how-set-uses-histogram-for-fast-operations)
  + [Extend Set With Custom Operations](#extend-set-with-custom-operations)
+ [Histogram](#histogram)

## Set
This section describes how to get started using `Set` then describes its methods as well as how to work with objects and mixed values.

**Note:** the order of items in a set is _undefined_.

### Usage

Include a reference to `swiftSet.js` in your project.

`<script type="text/javascript" src="swiftSet.js"></script>`

Import `Set` from the swiftSet namespace into whichever context you want to use it in.

```javascript
var 
// Import swiftSet's Set class.
Set = swiftSet.Set,
```
Create a new set.

```javascript
// Create an empty set and then add items...
set = new Set().add(1, 2, 2, 3, 3, 3), // (1, 2, 3),

// ...or pass an array of items to the constructor.
set = new Set([1, 2, 2, 3, 3, 3]); // (1, 2, 3);
```

Add and remove items, determine set size, check if an item is in the set, retrieve an array representing the set's unique items, iterate over a set, and make a copy of the set object.

```javascript
var
// Import Set
Set = swiftSet.Set, set, a, b;

// Create a new set.
set = new Set(['a', 'b', 'c']); // ('a', 'b', 'c')

// Add items to the set.
set.add('d', 'e'); // ('a', 'b', 'c', 'd', 'e')

// Remove items from the set.
set.remove('a', 'b'); // ('c', 'd', 'e')

// Add items to the set via an array.
set.addItems(['a', 'b']); // ('a', 'b', 'c', 'd', 'e')

// Remove items from the set via an array.
set.removeItems(['d', 'e']); // ('a', 'b', 'c')

// Get the number of items in the set.
set.size(); // => 3

// Determine if the set has a specific item.
set.has('a'); // => true
set.has('e'); // => false

// Get an array of items in the set.
set.items(); // => ['a', 'b', 'c']

// Iterate over items in the set.
set.each(function(item) {
  console.log(item); // 'a', 'b', 'c'
});

// ... or, since set.items() returns an array ...
set.items().forEach(function(item) {
  console.log(item); // 'a', 'b', 'c'
});

// Copy a set.
a= set.copy(); // ('a', 'b', 'c')

// Copy a set and initialize the copy with new items.
a = new Set([1, 2, 3, 3]); // => (1, 2, 3)
b = a.copy([3, 4, 5, 5]); // => (3, 4, 5)

// Clear a set and give it new items.
a.clear(b.items()); // => (3, 4, 5)

// Clear a set.
a.clear();  // => ()

// If a string is passed to the constructor, it is 
// automatically converted to a character array.
a = new Set('abcacbbacbcacabcba').items().sort() // => ['a', 'b', 'c']
```

#### Set Operations
`Set` supports five basic set operations: union, intersection, difference, complement, and equals. `difference` is the _symmetric difference_, and `complement` is the _relative complement_. Set operations produce no side effects, so no state in the calling set is affected.

```javascript
var
// Import.
Set = swiftSet.Set,

a = new Set([1, 2, 3]),
b = new Set([2, 3, 4]);

// Union A ∪ B joins two sets together.
a.union([2, 3, 4]); // => [1, 2, 3, 4]
a.union(b); // => [1, 2, 3, 4]

// Intersection A ∩ B returns elements common to both sets.
a.intersection([2, 3, 4]); // => [2, 3]
a.intersection(b); // => [2, 3]

// Symmetric Difference A ∆ B returns items not common to both sets.
a.difference([2, 3, 4]); // => [1, 4]
a.difference(b); // => [1, 4]

// Relative Complement A \ B returns elements in A 
// that are not also in B (A - B).
a.complement([2, 3, 4]); // => [1]
a.complement(b); // => [1];

// Equals A = B determines set equality.
a.equals([1, 2, 2, 3, 3]); // => true
a.equals(b); // => false
```

**Note:** Set operations do not modify the set they're called on. Rather the output of a set operation is a new array containing the results of the operation. If you need the set to take on the values of an operation, call the `clear` method and pass in the results of an operation: `a.clear(a.intersection(b))`. To create a new set from an operation, use either `var c = new Set(a.intersection(b))` or `var c = a.copy(a.intersection(b))`. Using `clear` or `copy` retains the [Global Key](#the-global-key-method) value if one was passed to the constructor.

#### Sets of Objects
Objects can also be used in sets, but it requires an extra step &mdash; one of several options to return a unique key from an object. Every option requires that an object has some property to establish its uniqueness in order to differentiate it from other objects. This is often some sort if unique value or identifier, and it acts as a key for when the item is added to `Set`'s internal histogram (at its core an object literal).

##### The `toString` Method
This method requires that objects in the set have a `toString` method which can return a unique identifier for the object. `toString` gets called automatically whenever an object is inserted as a key in an object literal; it can be overridden to return some unique identifier.

```javascript
var
// Import.
Set = swiftSet.Set,

// Create a toString function that returns an object id.
toStr = function() {
  return this.id;
},

// Create objects with unique ids and add a reference to the toString function.
o1 = {id: 1, toString: toStr},
o2 = {id: 2, toString: toStr},
o3 = {id: 3, toString: toStr},
o4 = {id: 4, toString: toStr},

// Create two sets.
a = new Set([o1, o2, o2, o3, o3, o3]),
b = new Set([o2, o3, o4]);

// They should each have three items.
a.size(); // => 3
b.size(); // => 3

// Perform an operation.
a.union(b); // => [o1, o2, o3, o4]
```

**Note:** Since in the above case the objects are given ids of 1-4, they will have those keys in `Set`'s internal histogram, and so will match numbers `1` through `4` as well as strings `"1"` through `"4"`. If you're mixing objects with numbers or strings in a set, you must make sure that the objects' id values will not interfere, unless you're intention is to allow an object with `id: 1` to be treated as the same value as numeric `1` and string `"1"`. However, most likely that's not what you want. See [Mixed Values](#mixed-values) for information on how to make sure that numeric values and numeric strings can be treated as separate items in `Set`.

```javascript
var
// Import.
Set = swiftSet.Set,

// Determine how items with the same key are treated in a set.

o1 = {id: 1, toString: function() { return this.id; }},
set = new Set([1, "1", o1]);

// This set will only have one item.
set.size(); // => 1
set.has(1); // => true
set.has("1"); // => true
set.has(o1); // => true 
set.items() // => [1], this could also be ["1"] or [o1].
```

##### The Object `hkey` Method
This method requires that objects in the set each have a `hkey` property, and that the property is either a value or a function. This method is particularly useful when overriding an object's `toString` method is not an option, or when a set needs to contain [Mixed Values](#mixed-values) consisting of objects and numeric values and/or numeric strings.

```javascript
var
// Import.
Set = swiftSet.Set,

// Create objects with a value key.
o1 = {hkey: 1},
o2 = {hkey: 2},
o3 = {hkey: 3},
o4 = {hkey: 4},

// Create two sets.
a = new Set([o1, o1, o2, o3]),
b = new Set([o2, o3, o4]);

// They should both have three items.
a.size(); // => 3
b.size(); // => 3

// Perform an operation.
a.intersection(b); // => [o2, o3]

// Create a function to be used as a key retriever.
function key() {
  return this.id;  
}

o1 = {id: 1, hkey: key},
o2 = {id: 2, hkey: key},
o3 = {id: 3, hkey: key},
o4 = {id: 4, hkey: key},

// Create two sets.
a = new Set([o1, o2, o3]),
b = new Set([o2, o3, o4]);

// They should both have three items.
a.size(); // => 3
b.size(); // => 3

// Perform an operation.
a.difference(b); // => [o1, o4]
```

##### The Global Key Method
This method requires that a `key` property or function is specified in `Set`'s constructor. The effective difference between this method and the [Object `hkey` Method](#the-object-hkey-method) is that when a global key is specified, it's expected that every item in the set will be an object with that property; whereas objects making use of the [Object `hkey` Method](#the-object-hkey-method) can be mixed with other values in the set. See [Mixed Values](#mixed-values) for more information.

```javascript
var
// Import.
Set = swiftSet.Set,

// Create objects with a unique identifier.
o1 = {id: 1},
o2 = {id: 2},
o3 = {id: 3},
o4 = {id: 4},

// Create two sets and specify a value key.
a = new Set([o1, o1, o2, o3], 'id'),
b = new Set([o2, o3, o4], 'id');

// They should both have three items.
a.size(); // => 3
b.size(); // => 3

// Perform an operation.
a.complement(b); // => [o1]

// Create a function to be used as a key retriever.
function getId() {
  return this.id;  
}

// Create two sets and specify a function key.
a = new Set([o1, o2, o3], getId),
b = new Set([o2, o3, o4], getId);

// They should both have three items.
a.size(); // => 3
b.size(); // => 3

// Perform an operation.
a.intersection(b); // => [o2, o3]
```

##### The Wrapper Method

Another option for adding objects to sets is to wrap them using `Set.wrapObj()`. This method requires a bit of extra work, but it may be desirable in cases where you want to mix objects in a set with other types such as strings and/or numbers but you don't want to use the [Object `hkey` Method](#the-object-hkey-method). When objects are wrapped, they're given a wrapper object which has a `toString` method. The default `toString` method of the wrapper is suitable for `Number`s and `String`s, but it will likely not be readily suitable for some other types such as object literals. In these cases a custom toString method can be specified in the initial call to `wrapObj`. The wrapper will have a property called `item` which will contain the object that was wrapped.

```javascript
var
// Import.
Set = swiftSet.Set,

// Specify a custom toString method for the wrapper.
wrap = Set.wrapObj(function() { return this.item.id; }),

// Create objects with a unique identifier.
o1 = {id: 1},
o2 = {id: 2},
o3 = {id: 3},
o4 = {id: 4},

// Create a list of wrapped objects.
items = [o1, o2, o3, o4].map(function(item) {
  return wrap(item);
}),

// Create a set of wrapped objects.
set = new Set(items);

// The set should have four items.
set.size(); // => 4

// Check that the items exist.
set.has(wrap(o1)); // => true
set.has(wrap(o2)); // => true
set.has(wrap(o3)); // => true
set.has(wrap(o4)); // => true

// Get the items unwrapped.
set.unwrap(); // => [o1, o2, o3, o4];
```

For more information on Wrappers, see [Mixed Values](#mixed-values), [How The Wrapper Works](#how-the-wrapper-works), and [Specify a custom `toString` method for the wrapper](#specify-a-custom-tostring-method-for-the-wrapper).

#### Mixed Values

The issue with mixing and matching numeric and string values in a set is that the numeric value `1` and the string `"1"` both evaluate to `"1"` when used as a key in an object literal, which is used in `Set`'s underlying histogram. swiftSet gets around this limitation by providing functionality to give numeric values and numeric strings (or other types) a wrapper object which returns a unique key according to the type of value. 

```javascript
var
// Import.
Set = swiftSet.Set,

// Get the wrap helper.
wrap = Set.wrapObj(),

// Import the wrapped evaluator.
isWrapped = Set.isWrapped,

// Create an array of mixed values and wrap them.
items = [1, '1', 2, '2'].map(function(item) {
  return wrap(item);
}),

// Create a set with the wrapped items.
set = new Set(items);

// There should be four items in the set.
set.size(); // => 4

// Check that the items exist.
set.has(wrap(1)); // => true
set.has(wrap('1')); // => true
set.has(wrap(2)); // => true
set.has(wrap('2')); // true

// Get an array of the wrapped items.
set.items(); // => [{item: 1, ...}, {item: '1', ...}, {item: 2, ...}, ...]

// Get an array of the unwrapped items.
set.unwrap(); // => [1, '1', 2, '2']

// Objects can also be added, as long as one of the key methods is used.
var o1 = {hkey: 'o1'},
o2 = {hkey: 'o2' };

// Add objects to set (these are not wrapped).
set.add(o1, o2);

// Manually unwrap items (or use unwrap as shown above.
set.items().map(function(item) {
  return isWrapped(item) ? item.item : item;
}); // => [1, '1', 2, '2', {key: 'o1'}, {key: 'o2'}]
```

##### How The Wrapper Works
`Set.wrapObj()` creates a wrapper object with two properties: an `item` property which holds the original value of the item and a `toString` method that encodes the value's type as part of its key.

```javascript

var
// Import.
Set = swiftSet.Set,

wrap = Set.wrapObj();
wrap(1); // => Wrapper {item: 1, toString: function(){...}}
wrap('1'); // => Wrapper {item: '1', toString: function(){...}}
wrap({id:1}); // => Wrapper {item: {id:1}, toString: function() {...}}
```

In the first instance `toString` returns a key with the value `(1:4)` which has the format `(key:typecode)`. `typecode` is a numeric value that represents a built-in type, in this case, `Number`. 

In the second instance `toString` returns a key with the value `(1:5)`. The numeric code `5` represents the built-in type `String`.

**Note:** The numeric typecode is generated internally and its actual value is arbitrary. The important thing is that different types produce different typecodes, so that even values which have the same key, such as `1` and `"1"`, end up encoding with different keys in the wrapper because they're of different types. For more insight into how the type is encoded, see the `swiftSet.js` code.

In the third instance `toString` returns a key with the value `([object Object]:6)`. The numeric code `6` represents the built-in type `Object`. However this key is useless: _every object literal will produce this exact key_. If you want to wrap object literals, you must specify a custom `toString` method for the wrapper. See [Specify a custom `toString` method for the wrapper](#specify-a-custom-tostring-method-for-the-wrapper) below.

##### Specify A Custom `tostring` Method For The Wrapper
If for some reason the wrapper's default `toString` method doesn't meet your needs, such as for some type of custom object, a `toString` method can be specified in the call to `Set.wrapObj()`. The `toString` method will have access to the wrapped object through the `item` property.

```javascript
var
// Import.
Set = swiftSet.Set,

// Specify a custom toString method for the wrapper.
wrap = Set.wrapObj(function() { return 'id' + this.item.id; }),

// Manually wrap an array of objects.
items = [{id: 1}, {id: 2}, {id: 3}].map(function(item) {
  return wrap(item);
}), // => [{item: {id:1}, toString: function() {...}}, ...]

// Create a set of the items.
set = new Set(items);

// The set should have three items.
set.size(); // => 3

// Check that each item exists.
set.has(wrap(items[0])); // => true
set.has(wrap(items[1])); // => true
set.has(wrap(items[2])); // => true

// Get an array of unwrapped items.
set.unwrap(); // => [{id: 1}, {id: 2}, {id: 3}] 
```
In the above example the items have the keys `"id1"`, `"id2"` and `"id3"` as supplied by the specified `toString` function.

#### Static Set Operations
swiftSet.js provides class-level set operations, or _static methods_ for performing `union`, `intersection`, `difference`, `complement`, and `equals` without the need to instantiate a `Set` object. These are low overhead implementations and will typically execute faster than their `Set.prototype` equivalents. However they maintain no state; no persistent objects need to be created, and they operate on two arrays of values. 

```javascript
var
// Import.
Set = swiftSet.Set,

// Create two arrays of values.
a = [1, 1, 2, 3],
b = [2, 3, 4, 4];

Set.union(a, b); // => [1, 2, 3, 4]
Set.intersection(a, b); // => [2, 3]
Set.difference(a, b); // => [1, 4]
Set.complement(a, b); // => [1]
Set.equals(a, b); // => false
Set.equals(a, [1, 2, 2, 3]); // => true
```

Objects can be used with these operations as long as they have their own `toString` method, or are wrapped. (Objects using one of these two strategies will also work for mixing various object types within a single set.) For information on how to set a global key retriever for static set operations, see [Setting A Global Uid Method For Static Set Operations](#setting-a-global-uid-method-for-static-set-operations).

```javascript
var
// Import.
Set = swiftSet.Set,
wrap = Set.wrapObj(function() { return this.item.id; }),

// Create two arrays of wrapped objects.
a = [{id:1}, {id:2}, {id:3}].map(function(item) {
  return wrap(item);  
}),
b = [{id:2}, {id:3}, {id:4}].map(function(item) {
  return wrap(item);
});

// Pefrom some operations and unwrap the results.

Set.union(a, b).map(function(item) {
  return item.item;
}); // => [{id:1}, {id:2}, {id:3}, {id:4}]

Set.intersection(a, b).map(function(item) {
  return item.item;
}); // => [{id:2}, {id:3}]

Set.difference(a, b).map(function(item) {
    return item.item;
}); // => [{id:1}, {id:4}]

Set.complement(a, b).map(function(item) {
  return item.item;
}); // => [{id:1}]

// No need to unwrap anything for equals.

Set.equals(a, b); // => false
Set.equals(a, [{id:1}, {id:2}, {id:3}]); // => true
```

However it might be desirable use a global method for key retrieval on whole sets of custom objects. See [Setting A Global Uid Method For Static Set Operations](#setting-a-global-uid-method-for-static-set-operations) for more information.

##### Setting A Global Uid Method For Static Set Operations
By default, static set operations use an identity function, `uid`, that just returns the given item for use as a key. This is suitable for sets of values that are all strings or all numbers. In order to use static set operations with sets of custom objects, the default key method, an identity function, can be overridden. This is accomplished using `Set.pushUid` and `Set.popUid`. By pushing a new `uid` method onto the stack, the default identity function can be superceded. This system allows multiple `uid` methods to be pushed and popped as necessary to work with sets of custom objects.

```javascript
var
// Import.
Set = swiftSet.Set,

// Create objects with a unique id. 
o1 = { id: 'id1' },
o2 = { id: 'id2' },
o3 = { id: 'id3' },
o4 = { id: 'id4' },
o5 = { id: 'id5' },

// Create two arrays of objects for set operations.
a = [o1, o2, o3, o3],
b = [o2, o2, o3, o4];

// Push a custom uid method onto the stack.
Set.pushUid(function() { return this.id; });

// Perform a set operation.
Set.union(a, b); // => [o1, o2, o3, o4]

// Restore the previous (default) uid method.
// This is not strictly necessary unless set operations are being
// used in multiple contexts with different object types.
Set.popUid();

```

If only one type of custom object is being used throughout a given project, it's not strictly necessary to call `Set.popUid`, but it's good housekeeping in general. However if set operations need to be used in different contexts and with different custom objects, it's not only helpful but necessary to do this.

```javascript
var
// Import.
Set = swiftSet.Set,

// Create objects with a unique id. 
o1 = { id: 'id1' },
o2 = { id: 'id2' },
o3 = { id: 'id3' },
o4 = { id: 'id4' },
o5 = { id: 'id5' },

// Create two arrays of objects for set operations.
a = [o1, o2, o3, o3],
b = [o2, o2, o3, o4];

// Push a custom uid method onto the stack.
Set.pushUid(function() { return this.id; });

// Perform a set operation.
Set.union(a, b); // => [o1, o2, o3, o4]

function doOtherStuff() {
  var p1 = { _id: '1' },
  p2 = { _id: '2' },
  p3 = { _id: '3' },
  p4 = { _id: '4' },
  p5 = { _id: '5' },
  c = [p1, p1, p2, p3],
  d = [p2, p3, p3, p4], intersection;

  Set.pushUid(function() { return this._id; });
  intersection = Set.intersection(c, d); // => [o2, o3]
  
  // Restore the previously pushed uid method.
  Set.popUid();

  return intersection;
}

doOtherStuff();

Set.difference(a, b); // => [o1, o4]

// Restore the default method.
Set.popUid();

Set.complement([1, 2, 3], [2, 3, 4]); // => [1]
```
**Note:** While every call to `Set.pushUid` should be accompanied with a compelementary call to `Set.popUid` as a matter of practice, it's not possible to break things by calling `Set.popUid` too many times. The default `uid` method is preserved on the stack regardless of how many times `Set.popUid` is called.

### How `Set` uses `Histogram` For Fast Operations
As the name implies, `swiftSet.js` is _swift_. Operations are fast even for large arrays. `Set` operations make use of two discrete-value histograms which are merged together to get a complete picture of one set's relation to the other. 

Here's what a histogram constructed from an array of values looks like conceptually:

```javascript
var
// Import.
Set = swiftSet.Set,

// Create a set.
set = new Set([1, 1, 2, 2, 2, 3]); // (1, 2, 3)

// Internally the set's histogram looks something like this:
// 
//   |
// 3 |     ***
// 2 | *** ***
// 1 | *** *** ***
// --------------------
//   |  1 | 2 | 3 |
// 
// The `x` axis represents the items in the set, and the `y` axis represents
// the frequency of that item's occurrence in the original array. Value 1 has
// two entries, value 2 has three, and 3 has one entry. This reflects the
// composition of the original array [1, 1, 2, 2, 2, 3] although the order
// of items is undefined. The internal histogram contains enough information
// to rebuild the original array except for the order of its items.
```

There's no interface in `Set` that exposes the structure of the histogram. If you wish to make use of this type of data, construct a `Histogram` object, which is available with `swiftSet`. See the [Histogram](#histogram) class documentation below.

Set operations build two histograms, one for each set of items, after which both histograms are _normalized_ and _merged_. The first set `a` gets its histogram normalized to `1` and the second set `b` gets its values normalized to `2`. This destroys the information about the composition of the original arrays but it creates a new layer of information about the members of each set, their similarities, and their differences, such that although the arrays' original composition information is lost, both sets `a` and `b` could be individually reconstructed from the data in the merged histogram.

```javascript
// Two histograms are created for each set during an operation. Then they
// are normalized and merged.
//
var
// Import.
Set = swiftSet.Set,

// Create two sets.
a = new Set([1, 1, 2, 2, 2, 3]), // (1, 2, 3)
b = new Set([2, 2, 3, 4, 4, 4]); // (2, 3, 4)

// Perform any operation.
a.union(b); // => [1, 2, 3, 4]
a.intersection(b); // => [2, 3]
a.difference(b); // => [1, 4]
a.complement(b); // => [1]

// Histograms before normalization.
//
//          a                      b
//   |                      |
// 3 |     ***            3 |         ***
// 2 | *** ***            2 | ***     ***
// 1 | *** *** ***        1 | *** *** ***
// -----------------      -----------------
// a |  1 | 2 | 3 |       b |  2 | 3 | 4 |
// 
//
// Histograms after normalization (`a` is normalized to `1` and `b` to `2`).
//
//          a                      b
//   |                      |
// 3 |                    3 |
// 2 |                    2 | *** *** ***
// 1 | *** *** ***        1 | *** *** ***
// -----------------      -----------------
// a |  1 | 2 | 3 |       b |  2 | 3 | 4 |
//
```

When the histograms are additively merged, a picture of the two sets' properties emerges. Items exclusively in set `a` have a frequency value of `1`. Items exclusively in set `b` have a frequency value of `2`. Items common to both sets add together to produce a frequency value of `3`. Continuing from the previous example,

```javascript
// The two normalized histograms during a set operation combine
// additively to make a single merged histogram.
// 
//                       a+b
//   |
// 3 |           ********* *********           --- max
// 2 |           ********* ********* *********
// 1 | ********* ********* ********* ********* --- min
// --------------------------------------------
//   |     1    |    2    |    3    |    4    |
//   | items in |      items in     |items in |
//   |     a    |      both sets    |    b    |
//
```

This information is sufficient to perform all five included set operations, although the `equals` operation is calculated differently than the other four. `Set` operations abstract the concept of an _evaluator_, which is called as the process iterates over the items in the histogram and builds the output based on whether the evaluator returns true or false. 

Here's a snipet from `swiftSet.js` that shows the `difference` operation calling into the `process` method, which iterates over the merged histogram and calls back to the given evaluator to determine if an item passed the test.

```javascript
// The inner loop of Set's process method calls the evaluator.

// Merge histogram b into a.
a.merge(b);
if(evaluator) {
  // Iterate a and build the output array.
  a.each(function(item, freq) {
    // The item gets added to the output if the evaluator passes.
    evaluator(freq) && out.push(item); 
  });
  return out;
} else {

// ...

// The difference method's evaluator gets called by the above code.
difference: function(b) {
  // Call the process method and supply the evaluator callback.
  return this.process(b, function(freq) {
    // Pass/fail condition.
    return freq < 3;
  });
},
```

When performing a `union` all frequencies are valid, so all the items are returned in the output.

`return true` `=>` `[1, 2, 3, 4]`

When performing an `intersection` only items with a frequency of `3` are returned in the output.

`return freq === 3` `=>` `[2, 3]`

When performing a `difference` only items with frequencies less than `3` are returned.

`return freq < 3` `=>` `[1, 4]`

When performing a `complement` only items with a frequency of `1` are returned.

`return freq === 1` `=>` `[1]`

The `equals` operation returns true if the `min` frequency and the `max` frequency are both `3`. Equivalent sets have the same items, hence the same frequencies after the merge. `equals` doesn't use an evaluator, rather it analyzes the merged histogram to determine the `min` and `max` frequencies of the items.

```javascript
var
// Import.
Set = swiftSet.Set,

// Create two equivalent sets.
a = new Set([1, 1, 2, 3, 3, 3]), // (1, 2, 3)
b = new Set([1, 2, 2, 2, 3, 3]), // (1, 2, 3)

// Perform equals operation.
a.equals(b); // => true

// Histograms after normalization but before merge.
//
//          a                      b
//   |                      |
// 3 |                    3 |
// 2 |                    2 | *** *** ***
// 1 | *** *** ***        1 | *** *** ***
// -----------------      -----------------
// a |  1 | 2 | 3 |       b |  1 | 2 | 3 |
//
//
// Histogram after merge. 
//
//                  a+b
//   |
// 3 | ********* ********* ********* --- min, max
// 2 | ********* ********* *********
// 1 | ********* ********* *********
// ----------------------------------
//   |     1    |    2    |    3    |
//
```
Comparing the above with the previous merged histogram example, you can see that the former has a `min` frequency of `1` and a `max` frequency of `3`, hence the sets are not equal. In the latter example, where both sets contain the same items, the histogram is flat. The `min` and `max` frequencies are both `3`.

### Extend `Set` With Custom Operations

You can extend `Set`'s operations in its `prototype` by copying an existing operation, changing its name, and changing the pass/fail condition in the evaluator:

```javascript
var
// Import.
Set = swiftSet.Set,
a = new Set([1, 2, 3]),
b = new Set([2, 3, 4]);

// Create a reverse complement operation, B\A, which returns 
// the items from b that are not also in a.
Set.prototype.rcomplement = function(b) {
  return this.process(b, function(freq) {
    // Pass/fail condition.
    return freq === 2;
  });
};

// Perform the rcomplement operation.
a.rcomplement(b); // => [4]

// Create a set reconstructor, which rebuilds both sets from the
// information in the merged histogram.
Set.prototype.reconstruct = function(b) {
  // When the process method is called without an evaluator,
  // it returns the merged histogram.
  var hist = this.process(b), out = {a:[], b:[]};
  hist.each(function(item, freq, key) {
    freq === 3 && out.a.push(item) && out.b.push(item); // Members of both sets.
    freq === 1 && out.a.push(item); // Members of set a.
    freq === 2 && out.b.push(item); // Members of set b.
  });
  return out;
};

// Not a particularly useful operation, but it demonstrates that
// both sets can be reconstructed from the merged histogram.
a.reconstruct(b); // => {a:[1, 2, 3], b:[2, 3, 4]}
```
## Histogram

<!---
### About Keys
```javascript

```
-->


