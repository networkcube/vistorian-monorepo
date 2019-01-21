
(function(swiftSet) { 
'use strict';
function version() { return 'swiftSet v0.9.14 MIT License © 2014 James Abney http://github.com/jabney/swiftSet'; }

// ---------------------------------------------------------------
// Set and Histogram - the Histogram is the backing object for
// Set, but it can also be used to record frequencies of discrete
// values in arrays, strings, and objects; the Set object,
// which is based upon Histogram, stores unique items and can
// process even large arrays of items very fast.
// ---------------------------------------------------------------
// http://github.com/jabney/swiftSet
// ---------------------------------------------------------------
var

// Shortcuts
slice = Array.prototype.slice,

// Encode object type for key generation.
encodeObjType = (function() {

  var toString = Object.prototype.toString,

  // Return the type of built-in objects via toString.
  typeOf = (function() {
    var reType = /\[object (\w+)\]/; 
    return function(obj) {
      return reType.exec(toString.call(obj))[1];
    };
  })(),

  // A list of built-in types.
  types = ['Null','Undefined','Array','Boolean','Number','String','Object',
    'Function','Date','Error','RegExp','Arguments','Math','JSON'],

  // Build dictionary for converting type strings to unique codes.
  codes = Object.create(null);
  types.forEach(function(type, index) {
    codes[type] = index;
  });

  // Encode an object's type as a unique number. If the type code
  // is not defined, return the type name.
  return function encodeObjType(obj) {
    var type = typeOf(obj),
    code = codes[type];
    return code === undefined ? type : code;
  }

})();

// Wrap a built-in type and give it a unique key generator.
function Wrapper(obj, toStr) {
  this.item = obj;
  this.toString = toStr ? toStr : function() {
    return '(' + obj + ':' + encodeObjType(obj) + ')';
  };
}

// Wrap an object so that it kas a key according to its type and value.
// Use: var wrap = wrapObj(); wrap(1); => {value: 1, toString: function(){...}}
function wrapObj(toStr) {
  return function(obj) {
    return new Wrapper(obj, toStr);
  }
}

// Returns true if obj is an instance of Wrapper, false otherwise.
function isWrapped(obj) {
  return obj instanceof Wrapper;
}

// ---------------------------------------------------------------
// Set - produces a set of unique items that can be queried for its
// properties. It supports five common set operations (union,
// intersection, difference, complement, equals) as well as some
// useful utility methods. The set operations are quite fast, as are
// set creation and querying. 
//
// Example usage: 
//
// var set = new Set([1, 1, 2, 3, 3, 3]).has(2) => true
// var set = new Set([1, 1, 2, 3, 3, 3]).size() => 3
// var set = new Set([1, 1, 2, 3, 3, 3]).add(4) // (1, 2, 3, 4)
// var set = new Set([1, 1, 2, 3, 3, 3]).remove(3) // (1, 2, 4)
// 
// Set Operations Example:
// 
// var set = new Set([1, 1, 2, 3, 3, 3]);
// set.intersection([2, 2, 3, 3, 4]); => [2, 3]
// 
// Arrays of objects can also be processed as sets, but they must
// have a way to return a unique value. One option is to add a
// toString method to your objects which returns some unique id; this
// gets converted into a key implicitly when the object is added to
// the set. If that's not an option, include  a 'key' value or function 
// on your objects which returns a unique value. If either of these 
// exist, they'll be used as keys when items are added to the set.
//
// Examples:
//
// {toString: function() { return "a7ff"; }}
// {id: 56, toString: function() { return this.id; }}
// {uid: 59}
// {id: f9de, uid: funciton() { return this.id; }}
// ---------------------------------------------------------------

function Set(a, key) {
  var hist = new Histogram(a, key), cachedItems = hist.items();

  // Normalize histograms a and b, then merge and iterate.
  // Returns a filtered array based on the given evaluator;
  // absent an evaluator, returns a merged histogram.
  this.process = function(b, evaluator) {
    var items = (b instanceof Set) ? b.items() : b,
    out = [],
    a = new Histogram(cachedItems, key), 
    b = new Histogram(items, key).normalize(2);
    // Merge the histograms and evaluate the contents.
    a.merge(b);
    if(evaluator) {
      a.each(function(item, freq) {
        evaluator(freq) && out.push(item); 
      });
      return out;
    } else {
      return a;
    }
  };

  // Iterates through the items in this set.
  this.each = function(action, context) {
    return hist.each(function(item) {
      return action.call(this, item);
    }, context);
  };

  // An array of items comprising the set.
  this.items = function() {
    return hist.items();
  };

  // An array of unwrapped items.
  this.unwrap = function() {
    return hist.unwrap();
  };

  // Encodes key/type pairs for each element in the set.
  this.keyify = function() {
    var uid = [], typeCode;
    hist.each(function(item, freq, key) {
      uid.push(key + ',');
    });
    return '{' + uid.sort().join('').slice(0, -1) + '}';
  };

  // Conversion of this set to a representative string.
  this.toString = function() {
    return this.keyify();
  };

  // Add an item or items to this set.
  this.add = function() {
    hist.addItems(slice.call(arguments, 0));
    cachedItems = hist.items();
    return this;
  };

  // Remove an item or items from this set.
  this.remove = function() {
    hist.removeItems(slice.call(arguments, 0));
    cachedItems = hist.items();
    return this;
  };

  // Add multiple items to the set via an array of items.
  this.addItems = function(items) {
    hist.addItems(items);
    cachedItems = hist.items();
    return this;
  };

  // Remove multiple items from the set via an array of items.
  this.removeItems = function(items) {
    hist.removeItems(items);
    cachedItems = hist.items();
    return this;
  };

  // Returns a copy of this set.
  this.copy = function(b) {
    return b ? new Set(b, key) :
      new Set(cachedItems, key);
  };

  // The number of unique elements in the set.
  this.size = function() {
    return hist.size();
  };

  // Determines if a value is present in the set.
  this.has = function(item) {
    return hist.has(item);
  };

  // Remove all items from a set. Add mew values if given.
  // TODO: unit tests.
  this.clear = function(a) {
    hist.clear(a);
    cachedItems = hist.items();
    return this;
  };

}

// Helpers
Set.wrapObj = wrapObj;
Set.isWrapped = isWrapped;

Set.prototype = {

  // ---------------------------------------------------------------
  // Set operations - these operatons make use of sets 'a' (the set based
  // on the array given in the constructor) and 'b', based on the
  // array passed to the set operation method below.
  // ---------------------------------------------------------------

  // The set of items from each set (a or b).
  union: function(b) {
    return this.process(b, function(freq) {
      return true;
    });
  },

  // The set of items that are common to both sets (a and b).
  intersection: function(b) {
    return this.process(b, function(freq) {
      return freq === 3;
    });
  },

  // Symmetric difference. The set of items from both sets
  // that are unique to each set (union minus intersection).
  // Note that for disjoint sets, this is the same as the 
  // union of 'a' and 'b'.
  difference: function(b) {
    return this.process(b, function(freq) {
      return freq < 3;
    });
  },

  // Relative complement. The set of items from 'a' except where
  // the value is also in 'b' (a minus b).
  complement: function(b) {
    return this.process(b, function(freq) {
      return freq == 1;
    });
  },

  // Returns true if given set is equivalent to this set. 
  equals: function(b) {
    var h = this.process(b);
    return h.min() === 3 && h.max() === 3;
  },

  constructor: Set
};

// ---------------------------------------------------------------
// Faster Set Operations - these are set operations that are 
// perfromed on two given arrays. They are class methods,
// can be called directly and do not requre a Set object to be 
// specifically constructed, and are generally faster than their
// Set.prototye equivalents (except perhaps for very large arrays).
//
// Example usage: Set.intersection([1, 2, 3], [2, 3, 4]) => [2, 3]
//
// Arrays of objects can be used as well, but each object must
// have a toString() method which returns a unique value, or the
// objects must be wrapped. 
//
// This also shows the core set operations algorithm without any of
// the overhead associated with constructing and managing a Set.
// ---------------------------------------------------------------
(function() {
  var uidList = [], uid;

  // Create and push the uid identity method.
  uidList.push(uid = function() {
    return this;
  });

  // Push a new uid method onto the stack. Call this and
  // supply a unique key generator for sets of objects.
  Set.pushUid = function(method) {
    uidList.push(method);
    uid = method;
    return method;
  };

  // Pop the previously pushed uid method off the stack and
  // assign top of stack to uid. Return the 
  Set.popUid = function() {
    var prev;
    uidList.length > 1 && (prev = uidList.pop());
    uid = uidList[uidList.length-1];
    return prev || null;
  };

  // Processes a histogram consructed from two arrays, 'a' and 'b'.
  // This function is used generically by the below set operation 
  // methods, a.k.a, 'evaluators', to return some subset of
  // a set union, based on frequencies in the histogram. 
  Set.process = function(a, b, evaluator) {
    var hist = Object.create(null), out = [], ukey, k;
    a.forEach(function(value) {
      ukey = uid.call(value);
      if(!hist[ukey]) {
        hist[ukey] = { value: value, freq: 1 };
      }
    });
    // Merge b into the histogram.
    b.forEach(function(value) {
      ukey = uid.call(value);
      if (hist[ukey]) {
        if (hist[ukey].freq === 1)
          hist[ukey].freq = 3;
      } else {
        hist[ukey] = { value: value, freq: 2 };
      }
    });
    // Call the given evaluator.
    if (evaluator) {
      for (k in hist) {
        if (evaluator(hist[k].freq)) out.push(hist[k].value);
      }
      return out;
    } else {
      return hist;
    }
  };

  // Join two sets together.
  // Set.union([1, 2, 2], [2, 3]) => [1, 2, 3]
  Set.union = function(a, b) {
    return Set.process(a, b, function(freq) {
      return true;
    });
  };

  // Return items common to both sets. 
  // Set.intersection([1, 1, 2], [2, 2, 3]) => [2]
  Set.intersection = function(a, b) {
    return Set.process(a, b, function(freq) {
      return freq === 3;
    });
  };

  // Symmetric difference. Items from either set that
  // are not in both sets.
  // Set.difference([1, 1, 2], [2, 3, 3]) => [1, 3]
  Set.difference = function(a, b) {
    return Set.process(a, b, function(freq) {
      return freq < 3;
    });
  };

  // Relative complement. Items from 'a' which are
  // not also in 'b'.
  // Set.complement([1, 2, 2], [2, 2, 3]) => [3]
  Set.complement = function(a, b) {
    return Set.process(a, b, function(freq) {
      return freq === 1;
    });
  };

  // Returns true if both sets are equivalent, false otherwise.
  // Set.equals([1, 1, 2], [1, 2, 2]) => true
  // Set.equals([1, 1, 2], [1, 2, 3]) => false
  Set.equals = function(a, b) {
    var max = 0, min = Math.pow(2, 53), key,
      hist = Set.process(a, b);
    for (var key in hist) {
      max = Math.max(max, hist[key].freq);
      min = Math.min(min, hist[key].freq);
    }
    return min === 3 && max === 3;
  };
})();

// Export
swiftSet.Set = Set;

// ---------------------------------------------------------------
// Histogram - a discrete histogram designed as a backing object
// for the Set constructor, but it can be used to record frequencies
// of arrays of values, characters in a string, or just about anything.
//
// Example usage: 
// 
// var str = "We hold these truths to be self-evident, that all men \
// are created equal, that they are endowed by their Creator with \
// certain unalienable Rights, that among these are Life, Liberty \
// and the pursuit of Happiness.";
// str = str.replace(/[.,]/g, '');

// var vc = [],
// hist = new Histogram(str.toLowerCase())
//   .each(function(value, freq) {
//     vc.push(value, freq);
//   });

// console.log(vc);
// // ["w", 3, "e", 28, " ", 34, "h", 13, "o", 6, "l", 9, "d", 6, ...]

// vc = [];
// hist = new Histogram(str.toLowerCase().split(' '))
//   .each(function(value, freq) {
//     vc.push(value, freq);
//   });

// console.log(vc);
// // [..., "these", 2, "truths", 1, "to", 1, "be", 1, "self-evident", 1,
// // "that", 3, "all", 1, "men", 1, "are", 3, "created", 1, "equal", 1, ...]
// ---------------------------------------------------------------

function Histogram(items, key) {
  var hist = Object.create(null), _length = 0, _max = 0,
  // If 'items' is a string, convert it to an array.
  items = typeof items === 'string' ? items.split('') : items,
  // Generate a uid function depending on whether key is specified
  // and whether it's a function or value.
  uid = (function() {
    return typeof key === 'undefined' ?
      // If key is not defined in the constructor, look for a property 
      // on the object named 'hkey' and use it as a value or function.
      // This fallback is necessary so that objects can be mixed with
      // other items in the histogram.
      function(obj) {
        var key = obj.hkey, type = typeof key;
        return type === 'undefined' ? obj :
          type === 'function' ? key.call(obj) : key;
      } :
      // If key is specified in the constructor, use it as a value
      // or a function depending on its type. In this instance,
      // all entries in the histogram must be objects with this
      // property present.
      typeof key === 'function' ?
        function(obj) { return key.call(obj); } :
        function(obj) { return obj[key]; }
  })();

  // Initialize histogram with given items.
  items && items.forEach(function(item) {
    add(item);
  });

  // Add a single item to the histogram. If 'freq' is specified,
  // set the item's frequency; this facilitates the merge operation.
  function add(item, freq) {
    var key = uid(item), entry = hist[key],
    freq = typeof freq === 'undefined' ? 1 : freq;
    // If the entry already exists, update the frequency.
    if (entry) {
      entry.freq += freq;
    // Otherwise create a new entry and update the length.
    } else {
      hist[key] = entry = { item: item, freq: freq };
      _length++;
    }
    _max = Math.max(_max, entry.freq);
    return this;
  }

  // Remove a single item from the histogram.
  function remove(item) {
    var key = uid(item);
    if (hist[key]) {
      delete hist[key];
      _length--;
    }
    return this;
  }

  // Add multiple item to the histogram via an array of item.
  this.addItems = function(items) {
    items.forEach(function(item) {
      add(item);
    });
    return this;
  };

  // Remove multiple items from the histogram via an array of items.
  this.removeItems = function(items) {
    items.forEach(function(item) {
      remove(item);
    });
    return this;
  };

  // Return a copy of this histogram. If b is given, the copy
  // will have those values instead.
  this.copy = function(b) {
    return b ? new Histogram(b, key) :
      new Histogram(null, key).merge(this);
  };

  // By default, sets all the histogram's frequencies to 1. If 'freq' 
  // is specified, sets all the histogram's frequencies to the given freq.
  this.normalize = function(freq) {
    var key, freq = typeof freq === 'undefined' ? 1 : freq;
    for (key in hist) {
      hist[key].freq = freq;
    }
    _max = freq;
    return this;
  };

  // Iterate through each of the histogram's entries. If action
  // returns a truthy item, the loop terminates.
  this.each = function(action, context) {
    for (var key in hist) {
      if (action.call(
        context, hist[key].item, hist[key].freq, key
     )) break;
    }
    return this;
  };

  // Returns true if the specified item exists in the histogram.
  this.has = function(item) {
    var key = uid(item);
    return hist[key] === undefined ? false : true;
  };

  // Returns the number of entries in the histogram.
  this.size = function() {
    return _length;
  };

  // Returns the maximum frequency of items in the histogram.
  this.max = function() {
    return _max;
  };

  // Returns the frequency corresponding to the given value.
  this.freq = function(item) {
    var key = uid(item);
    return hist[key] === undefined ? 0 : hist[key].freq;
  };

  // Merges the given histogram into this one.
  this.merge = function(h) {
    h.each(function(item, freq) {
      add(item, freq);
    });
    return this;
  };

  // Clear the histogram of all items. Add array of
  // new items if given.
  // TODO: unit tests.
  this.clear = function(a) {
    hist = Object.create(null);
    _length = 0;
    _max = 0;
    a && this.addItems(a);
    return this;
  };

}

// Helpers
Histogram.wrapObj = wrapObj;
Histogram.isWrapped = isWrapped;

Histogram.prototype = {

  // Add one or more items to the histogram.
  add: function() {
    this.addItems(slice.call(arguments, 0));
    return this;
  },

  // Remove one or more items from the histogram.
  remove: function() {
    this.removeItems(slice.call(arguments, 0));
    return this;
  },

  // Returns an array of the histogram's items.
  items: function() {
    return this.map(function(item) {
      return item;
    });
  },

  // Returns an array of the histogram's frequencies.
  frequencies: function() {
    return this.map(function(item, freq) {
      return freq;
    });
  },

  // Returns an array of the histogram's keys.
  keys: function() {
    return this.map(function(item, freq, key) {
      return key;
    });
  },

  // Returns an array of items, but unwraps any wrapped objects.
  unwrap: function() {
    return this.map(function(item) {
      return isWrapped(item) ? item.item : item;
    });
  },

  // Returns the minimum frequency in the histogram.
  min: function() {
    return Math.min.apply(null, this.frequencies());
  },

  // Return items that have frequencies greater than 
  // or equal to the given frequency.
  ge: function(freq) {
    var out = [];
    this.each(function(value, f) {
      f >= freq && out.push(value);
    });
    return out;
  },

  // Return items that have frequencies less than or
  // equal to the given frequency.
  le: function(freq) {
    var out = [];
    this.each(function(value, f) {
      f <= freq && out.push(value);
    });
    return out;
  },

  // Return items that have exactly the given frequency.
  eq: function(freq) {
    var out = [];
    this.each(function(value, f) {
      f === freq && out.push(value);
    });
    return out;
  },

  // Returns the sum of all entry's frequencies.
  total: function() {
    return this.reduce(function(sum, curr) {
      return sum + curr;
    }, 0);
  },

  // Returns the average value of frequencies in the histogram.
  average: function() {
    return this.total() / this.size();
  },

  // Returns the Shannon entropy of the histogram in bits per symbol.
  entropy: function() {
    var size = this.total();
    return this.reduce(function(sum, freq) {
      var p = freq/size;
      return sum - p * Math.log2(p);
    }, 0);
  },

  // Returns the total number of bits in the histogram.
  // If 'uniform' is truthy, assume uniform probability of values.
  // If 'uniform' > 1 assume uniform is a base.
  bits: function(uniform) {
    return this.total() * (uniform ?
      Math.log2(uniform > 1 ? uniform : this.size()) :
      this.entropy());
  },

  // Determine if another histogram is equivalent to this one.
  equals: function(histogram) {
    return this.keyify() === histogram.keyify();
  },

  // Returns an array of user-transformed entries.
  map: function(action, context) {
    var out = [];
    this.each(function(item, freq, key) {
      out.push(action.call(this, item, freq, key));
    }, context);
    return out;
  },

  // Reduces all frequencies in the histogram to a single value.
  reduce: function(action, initial) {
    return this.frequencies().reduce(function(prev, curr) {
      return action(prev, curr);
    }, initial);
  },

  // Encodes key/frequency pairs for each element in the histogram.
  // Histograms can be considered equivalent if their keys are equal.
  keyify: function() {
    var uid = [], typeCode;
    this.each(function(item, freq, key) {
      uid.push(key + ':' + freq + ',');
    });
    return '{' + uid.sort().join('').slice(0, -1) + '}';
  },

  // Conversion of this histogram to a representative string.
  toString: function() {
    return this.keyify();
  },

  constructor: Histogram
};

// Export
swiftSet.Histogram = Histogram;

})(window.swiftSet = window.swiftSet || {});

