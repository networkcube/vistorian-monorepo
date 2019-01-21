(function(swiftSet) {
'use strict'

// Imports
var
  Histogram = swiftSet.Histogram
;

function key() {
  return this.id;
}

describe('Histogram', function() {
  var
    o1 = { id: 'o1', hkey: key }, 
    o2 = { id: 'o2', hkey: key }, 
    o3 = { id: 'o3', hkey: key }, 
    o4 = { id: 'o4', hkey: key }, 
    o5 = { id: 'o5', hkey: key }
  ;

  beforeEach(function() {

  });

  describe('initialization', function() {

    it('creates an accurate histogram of numbers', function() {
      var num = [1, 1, 2, 2, 3, 3];
      var hist = new Histogram(num);

      expect(hist.has(0)).toBe(false);
      expect(hist.has(1)).toBe(true);
      expect(hist.has(2)).toBe(true);
      expect(hist.has(3)).toBe(true);

      expect(hist.freq(0)).toEqual(0);
      expect(hist.freq(1)).toEqual(2);
      expect(hist.freq(2)).toEqual(2);
      expect(hist.freq(3)).toEqual(2);

      expect(hist.size()).toEqual(3);
      expect(hist.total()).toEqual(6);
      expect(hist.min()).toEqual(2);
      expect(hist.max()).toEqual(2);
    });
    
    it('creates an accurate histogram of characters', function() {
      var chr = ['a', 'a', 'b', 'b', 'c', 'c'];
      var hist = new Histogram(chr);

      expect(hist.has('z')).toBe(false);
      expect(hist.has('a')).toBe(true);
      expect(hist.has('b')).toBe(true);
      expect(hist.has('c')).toBe(true);

      expect(hist.freq('z')).toEqual(0);
      expect(hist.freq('a')).toEqual(2);
      expect(hist.freq('b')).toEqual(2);
      expect(hist.freq('c')).toEqual(2);

      expect(hist.size()).toEqual(3);
      expect(hist.total()).toEqual(6);
      expect(hist.min()).toEqual(2);
      expect(hist.max()).toEqual(2);
    });

    it('creates an accurate histogram of objects', function() {
      var obj = [o1, o1, o2, o2, o3, o3];
      var hist = new Histogram(obj);

      expect(hist.has(o4)).toBe(false);
      expect(hist.has(o1)).toBe(true);
      expect(hist.has(o2)).toBe(true);
      expect(hist.has(o3)).toBe(true);

      expect(hist.freq(o5)).toEqual(0);
      expect(hist.freq(o1)).toEqual(2);
      expect(hist.freq(o2)).toEqual(2);
      expect(hist.freq(o3)).toEqual(2);

      expect(hist.size()).toEqual(3);
      expect(hist.total()).toEqual(6);
      expect(hist.min()).toEqual(2);
      expect(hist.max()).toEqual(2);
    });

  });
  
  describe('mutability', function() {

    it('accurately adds and removes one or more numbers', function() {
      var num = [1, 2, 2, 3, 3, 3];
      var hist = new Histogram(num);
    
      hist.add(3).add(4, 5)
        .remove(1, 2);

      expect(hist.has(1)).toBe(false);
      expect(hist.has(2)).toBe(false);
      expect(hist.has(3)).toBe(true);
      expect(hist.has(4)).toBe(true);
      expect(hist.has(5)).toBe(true);
      
      expect(hist.freq(1)).toEqual(0)
      expect(hist.freq(2)).toEqual(0);
      expect(hist.freq(3)).toEqual(4);
      expect(hist.freq(4)).toEqual(1);
      expect(hist.freq(5)).toEqual(1);

      expect(hist.size()).toEqual(3);
      expect(hist.total()).toEqual(6);
      expect(hist.min()).toEqual(1);
      expect(hist.max()).toEqual(4);

      hist = new Histogram(num)
        .addItems([3, 4, 4, 5, 5])
        .removeItems([1, 2]);

      expect(hist.has(1)).toBe(false);
      expect(hist.has(2)).toBe(false);
      expect(hist.has(3)).toBe(true);
      expect(hist.has(4)).toBe(true);
      expect(hist.has(5)).toBe(true);

      expect(hist.freq(1)).toEqual(0)
      expect(hist.freq(2)).toEqual(0);
      expect(hist.freq(3)).toEqual(4);
      expect(hist.freq(4)).toEqual(2);
      expect(hist.freq(5)).toEqual(2);

      expect(hist.size()).toEqual(3);
      expect(hist.total()).toEqual(8);
      expect(hist.min()).toEqual(2);
      expect(hist.max()).toEqual(4);
    });

    it('accurately adds and removes one or more characters', function() {
      var chr = ['a', 'b', 'b', 'c', 'c', 'c'];
      var hist = new Histogram(chr);
    
      hist.add('c').add('d', 'e')
        .remove('a', 'b');

      expect(hist.has('a')).toBe(false);
      expect(hist.has('b')).toBe(false);
      expect(hist.has('c')).toBe(true);
      expect(hist.has('d')).toBe(true);
      expect(hist.has('e')).toBe(true);
      
      expect(hist.freq('a')).toEqual(0)
      expect(hist.freq('b')).toEqual(0);
      expect(hist.freq('c')).toEqual(4);
      expect(hist.freq('d')).toEqual(1);
      expect(hist.freq('e')).toEqual(1);

      expect(hist.size()).toEqual(3);
      expect(hist.total()).toEqual(6);
      expect(hist.min()).toEqual(1);
      expect(hist.max()).toEqual(4);

      hist = new Histogram(chr)
        .addItems(['c', 'd', 'd', 'e', 'e'])
        .removeItems(['a', 'b']);

      expect(hist.has('a')).toBe(false);
      expect(hist.has('b')).toBe(false);
      expect(hist.has('c')).toBe(true);
      expect(hist.has('d')).toBe(true);
      expect(hist.has('e')).toBe(true);

      expect(hist.freq('a')).toEqual(0)
      expect(hist.freq('b')).toEqual(0);
      expect(hist.freq('c')).toEqual(4);
      expect(hist.freq('d')).toEqual(2);
      expect(hist.freq('e')).toEqual(2);

      expect(hist.size()).toEqual(3);
      expect(hist.total()).toEqual(8);
      expect(hist.min()).toEqual(2);
      expect(hist.max()).toEqual(4);
    });

    it('accurately adds and removes one or more objects', function() {
      var obj = [o1, o2, o2, o3, o3, o3];
      var hist = new Histogram(obj);
    
      hist.add(o3).add(o4, o5)
        .remove(o1, o2);

      expect(hist.has(o1)).toBe(false);
      expect(hist.has(o2)).toBe(false);
      expect(hist.has(o3)).toBe(true);
      expect(hist.has(o4)).toBe(true);
      expect(hist.has(o5)).toBe(true);
      
      expect(hist.freq(o1)).toEqual(0)
      expect(hist.freq(o2)).toEqual(0);
      expect(hist.freq(o3)).toEqual(4);
      expect(hist.freq(o4)).toEqual(1);
      expect(hist.freq(o5)).toEqual(1);

      expect(hist.size()).toEqual(3);
      expect(hist.total()).toEqual(6);
      expect(hist.min()).toEqual(1);
      expect(hist.max()).toEqual(4);

      hist = new Histogram(obj)
        .addItems([o3, o4, o4, o5, o5])
        .removeItems([o1, o2]);

      expect(hist.has(o1)).toBe(false);
      expect(hist.has(o2)).toBe(false);
      expect(hist.has(o3)).toBe(true);
      expect(hist.has(o4)).toBe(true);
      expect(hist.has(o5)).toBe(true);

      expect(hist.freq(o1)).toEqual(0)
      expect(hist.freq(o2)).toEqual(0);
      expect(hist.freq(o3)).toEqual(4);
      expect(hist.freq(o4)).toEqual(2);
      expect(hist.freq(o5)).toEqual(2);

      expect(hist.size()).toEqual(3);
      expect(hist.total()).toEqual(8);
      expect(hist.min()).toEqual(2);
      expect(hist.max()).toEqual(4);
    });

    it('can properly normalize a histogram', function() {
      var hist = new Histogram([1, 2, 2, 3, 3, 3]);

      hist.normalize();
      expect(hist.size()).toEqual(3);
      expect(hist.total()).toEqual(3);
      expect(hist.min()).toEqual(1);
      expect(hist.max()).toEqual(1);
      
      hist.normalize(2);
      expect(hist.size()).toEqual(3);
      expect(hist.total()).toEqual(6);
      expect(hist.min()).toEqual(2);
      expect(hist.max()).toEqual(2);

    });

    it('can correctly merge one histogram with another', function() {
      var hist1 = new Histogram([1, 2, 2, 3, 3, 3]),
        hist2 = new Histogram([1, 2, 3, 4]);

      hist1.merge(hist2);
      expect(hist1.size()).toEqual(4);
      expect(hist1.total()).toEqual(10);
      expect(hist1.min()).toEqual(1);
      expect(hist1.max()).toEqual(4);
    });

    it('can clear a histogram and initialize it with new values', function() {
      var
      o1 = { id: 1 },
      o2 = { id: 2 },
      o3 = { id: 3 },
      o4 = { id: 4 },
      o5 = { id: 5 },
      a = [o1, o1, o2, o3, o3],
      b = [o2, o2, o3, o4, o5],
      h1 = new Histogram(a, 'id'), h2;

      expect(h1.size()).toEqual(3);
      expect(h1.total()).toEqual(5);
      expect(h1.min()).toEqual(1);
      expect(h1.max()).toEqual(2);
      expect(h1.freq(o1)).toEqual(2);
      expect(h1.freq(o2)).toEqual(1);
      expect(h1.freq(o3)).toEqual(2);

      h2 = h1.copy().clear(b);

      expect(h2.size()).toEqual(4);
      expect(h2.total()).toEqual(5);
      expect(h2.min()).toEqual(1);
      expect(h2.max()).toEqual(2);
      expect(h2.freq(o1)).toEqual(0);
      expect(h2.freq(o2)).toEqual(2);
      expect(h2.freq(o3)).toEqual(1);
      expect(h2.freq(o4)).toEqual(1);
      expect(h2.freq(o5)).toEqual(1);

      h2.clear();
      
      expect(h2.size()).toEqual(0);
      expect(h2.total()).toEqual(0);
      expect(h2.min()).toEqual(Infinity);
      expect(h2.max()).toEqual(0);
      expect(h2.freq(o1)).toEqual(0);
      expect(h2.freq(o2)).toEqual(0);
      expect(h2.freq(o3)).toEqual(0);
      expect(h2.freq(o4)).toEqual(0);
      expect(h2.freq(o5)).toEqual(0);

    });
  });
  
  describe('object key', function() {

    describe('uses object key values and functions', function() {

      it('uses "hkey" as an object value property', function() {
        var
        o1 = { hkey: 'o1' }, 
        o2 = { hkey: 'o2' }, 
        o3 = { hkey: 'o3' }, 
        o4 = { hkey: 'o4' }, 
        o5 = { hkey: 'o5' },
        hist = new Histogram([o1, o2, o3, o4, o5]);

        expect(hist.size()).toEqual(5);
        expect(hist.total()).toEqual(5);
        expect(hist.min()).toEqual(1);
        expect(hist.max()).toEqual(1);
      });

      it('uses "hkey" as an object function property', function() {
        var
        o1 = { id: 'o1', hkey: key }, 
        o2 = { id: 'o2', hkey: key }, 
        o3 = { id: 'o3', hkey: key }, 
        o4 = { id: 'o4', hkey: key }, 
        o5 = { id: 'o5', hkey: key },
        hist = new Histogram([o1, o2, o3, o4, o5]);

        expect(hist.size()).toEqual(5);
        expect(hist.total()).toEqual(5);
        expect(hist.min()).toEqual(1);
        expect(hist.max()).toEqual(1);
      });
    });

    describe('uses explicit key values and functions', function() {

      it('uses custom key as an object value property', function() {
        var
        o1 = { myKey: 'o1' }, 
        o2 = { myKey: 'o2' }, 
        o3 = { myKey: 'o3' }, 
        o4 = { myKey: 'o4' }, 
        o5 = { myKey: 'o5' },
        hist = new Histogram([o1, o2, o3, o4, o5], 'myKey');

        expect(hist.size()).toEqual(5);
        expect(hist.total()).toEqual(5);
        expect(hist.min()).toEqual(1);
        expect(hist.max()).toEqual(1);
      });

      it('uses a custom function as a key retriever', function() {
        var
        myKey = function() { return this.id; },
        o1 = { id: 'o1' }, 
        o2 = { id: 'o2' }, 
        o3 = { id: 'o3' }, 
        o4 = { id: 'o4' }, 
        o5 = { id: 'o5' },
        hist = new Histogram([o1, o2, o3, o4, o5], myKey);

        expect(hist.size()).toEqual(5);
        expect(hist.total()).toEqual(5);
        expect(hist.min()).toEqual(1);
        expect(hist.max()).toEqual(1);
      });
    });

    it('uses object toString method to implicity generate a key', function() {
      var
      o1 = { id: 'v', toString: function() { return this.id; } }, 
      o2 = { id: 'w', toString: function() { return this.id; } }, 
      o3 = { id: 'x', toString: function() { return this.id; } }, 
      o4 = { id: 'y', toString: function() { return this.id; } }, 
      o5 = { id: 'z', toString: function() { return this.id; } },
      hist = new Histogram([o1, o2, o3, o4, o5]);

      expect(hist.size()).toEqual(5);
      expect(hist.total()).toEqual(5);
      expect(hist.min()).toEqual(1);
      expect(hist.max()).toEqual(1);
    });
  });
  
  describe('global key', function() {
    var
    o1 = { id: 1 },
    o2 = { id: 2 },
    o3 = { id: 3 },
    o4 = { id: 4 },
    o5 = { id: 5 };

    it('uses an object value property', function() {
      var hist = new Histogram([o1, o2, o2, o3, o3, o3], 'id');

      expect(hist.size()).toEqual(3);
      expect(hist.total()).toEqual(6);
      expect(hist.min()).toEqual(1);
      expect(hist.max()).toEqual(3);

      expect(hist.has(o1)).toEqual(true);
      expect(hist.has(o2)).toEqual(true);
      expect(hist.has(o3)).toEqual(true);
      expect(hist.has(o4)).toEqual(false);

      expect(hist.freq(o1)).toEqual(1);
      expect(hist.freq(o2)).toEqual(2);
      expect(hist.freq(o3)).toEqual(3);
    });

    it('uses an object function property', function() {
      var hist = new Histogram([o1, o2, o2, o3, o3, o3], function() {
        return this.id;
      });

      expect(hist.size()).toEqual(3);
      expect(hist.total()).toEqual(6);
      expect(hist.min()).toEqual(1);
      expect(hist.max()).toEqual(3);

      expect(hist.has(o1)).toEqual(true);
      expect(hist.has(o2)).toEqual(true);
      expect(hist.has(o3)).toEqual(true);
      expect(hist.has(o4)).toEqual(false);

      expect(hist.freq(o1)).toEqual(1);
      expect(hist.freq(o2)).toEqual(2);
      expect(hist.freq(o3)).toEqual(3);
    });
  });

  describe('iteration', function() {

    it('properly iterates over the histogram', function() {
      var hist = new Histogram([7, 8, 8, 9, 9, 9]),
        calls = { method: function() {}};
      spyOn(calls, 'method');

      hist.each(function(value, count, key) {
        calls.method(value);
        calls.method(count);
        calls.method(key);
      });
      // Values
      expect(calls.method).toHaveBeenCalledWith(7);
      expect(calls.method).toHaveBeenCalledWith(8);
      expect(calls.method).toHaveBeenCalledWith(9);
      // Counts
      expect(calls.method).toHaveBeenCalledWith(1);
      expect(calls.method).toHaveBeenCalledWith(2);
      expect(calls.method).toHaveBeenCalledWith(3);
      // Keys
      expect(calls.method).toHaveBeenCalledWith('7');
      expect(calls.method).toHaveBeenCalledWith('8');
      expect(calls.method).toHaveBeenCalledWith('9');
    });

    it('produces a correct list of values', function() {
      var hist = new Histogram([7, 8, 8, 9, 9, 9]),
        values = hist.items();

      expect(values).toContain(7);
      expect(values).toContain(8);
      expect(values).toContain(9);
      expect(values.length).toEqual(3);
    });

    it('produces a correct list of counts', function() {
      var hist = new Histogram([7, 8, 8, 9, 9, 9]),
        counts = hist.frequencies();

      expect(counts).toContain(1);
      expect(counts).toContain(2);
      expect(counts).toContain(3);
      expect(counts.length).toEqual(3);
    });

    it('produces a correct list of keys', function() {
      var hist = new Histogram([7, 8, 8, 9, 9, 9]),
        keys = hist.keys();

      expect(keys).toContain('7');
      expect(keys).toContain('8');
      expect(keys).toContain('9');
      expect(keys.length).toEqual(3);
    });
  });

  describe('key', function() {

    it('generates a unique histogram key for numbers', function() {
      var hist1 = new Histogram([7, 8, 8, 9, 9, 9]),
        hist2 = new Histogram([7, 8, 8, 9, 9, 9]),
        hist3 = new Histogram([7, 8, 9]);

      expect(hist1.keyify()).toEqual('{7:1,8:2,9:3}');
      expect(hist1.keyify()).toEqual(hist2.keyify());
      expect(hist1.keyify()).not.toEqual(hist3.keyify());
    });
    
    it('generates a unique histogram key for characters', function() {
      var hist1 = new Histogram(['7', '8', '8', '9', '9', '9']),
        hist2 = new Histogram(['7', '8', '8', '9', '9', '9']),
        hist3 = new Histogram(['7', '8', '9']);

      expect(hist1.keyify()).toEqual('{7:1,8:2,9:3}');
      expect(hist1.keyify()).toEqual(hist2.keyify());
      expect(hist1.keyify()).not.toEqual(hist3.keyify());
    });

    it('generates a unique histogram key for objects', function() {
      var hist1 = new Histogram([o1, o2, o2, o3, o3, o3]),
        hist2 = new Histogram([o1, o2, o2, o3, o3, o3]),
        hist3 = new Histogram([o1, o2, o3]);

      expect(hist1.keyify()).toEqual('{o1:1,o2:2,o3:3}');
      expect(hist1.keyify()).toEqual(hist2.keyify());
      expect(hist1.keyify()).not.toEqual(hist3.keyify());
    });

    it('can treat strings and numbers as different values', function() {
      var wrap = Histogram.wrapObj(),
      hist1 = new Histogram()
        .add(wrap(1),wrap(2),wrap(2),wrap(3),wrap(3),wrap(3)),
      hist2 = new Histogram()
        .add(wrap('1'),wrap('2'),wrap('2'),wrap('3'),wrap('3'),wrap('3'));

      expect(hist1.has(wrap(1))).toEqual(true);
      expect(hist1.has(wrap(2))).toEqual(true);
      expect(hist1.has(wrap(3))).toEqual(true);
      expect(hist1.has(wrap('3'))).toEqual(false);

      expect(hist2.has(wrap('1'))).toEqual(true);
      expect(hist2.has(wrap('2'))).toEqual(true);
      expect(hist2.has(wrap('3'))).toEqual(true);
      expect(hist2.has(wrap(3))).toEqual(false);

      expect(hist1.keyify()).not.toEqual(hist2.keyify());
      hist1.addItems(hist2.items());
      expect(hist1.size()).toEqual(6);
    });

    it('correctly determines histogram equivalence', function() {
      var hist1 = new Histogram([7, 8, 8, 9, 9, 9]),
        hist2 = new Histogram([7, 8, 8, 9, 9, 9]),
        hist3 = new Histogram([7, 8, 9]);
      expect(hist1.equals(hist2)).toEqual(true);
      expect(hist1.equals(hist3)).toEqual(false);
    });

    it('can use histograms as values in a histogram', function() {
      var h1 = new Histogram([1, 2, 3, 3, 3, 3]),
        h2 = new Histogram([4, 5, 5, 6, 6, 6]),
        h3 = new Histogram([7, 8, 8, 9, 9, 9]),
        hist1 = new Histogram([h1, h2, h2, h3, h3, h3]),
        hist2 = new Histogram([h1, h2, h2, h3, h3, h3]),
        hist3 = new Histogram([h1, h2, h3]);

      expect(hist1.size()).toEqual(3);
      expect(hist1.total()).toEqual(6);
      expect(hist1.min()).toEqual(1);
      expect(hist1.max()).toEqual(3);
      expect(hist1.freq(h1)).toEqual(1);
      expect(hist1.freq(h2)).toEqual(2);
      expect(hist1.freq(h3)).toEqual(3);
      expect(hist1.equals(hist2)).toEqual(true);
      expect(hist1.equals(hist3)).toEqual(false);
    });
  });

  describe('mixed values', function() {
      var wrap = Histogram.wrapObj(), isWrapped = Histogram.isWrapped,
      hist1 = new Histogram([wrap(1), wrap(1), '1', wrap(2), '2', o1, o2]),
      hist2 = hist1.copy();

    it('can build a mixed set of numbers, strings, and objects', function() {
      var values;

      expect(hist1.size()).toEqual(6);
      expect(hist1.total()).toEqual(7);
      expect(hist1.min()).toEqual(1);
      expect(hist1.max()).toEqual(2);

      expect(hist1.has(wrap(1))).toEqual(true);
      expect(hist1.has(wrap('1'))).toEqual(false);
      expect(hist1.has('1')).toEqual(true);
      expect(hist1.has(wrap(2))).toEqual(true);
      expect(hist1.has('2')).toEqual(true);
      expect(hist1.has(o1)).toEqual(true);
      expect(hist1.has(wrap(o1))).toEqual(false);
      expect(hist1.has(o2)).toEqual(true);
      expect(hist1.equals(hist2)).toEqual(true);

      expect(hist2.size()).toEqual(6);
      expect(hist2.total()).toEqual(7);
      expect(hist2.min()).toEqual(1);
      expect(hist2.max()).toEqual(2);

      expect(hist2.has(wrap(1))).toEqual(true);
      expect(hist2.has(wrap('1'))).toEqual(false);
      expect(hist2.has('1')).toEqual(true);
      expect(hist2.has(wrap(2))).toEqual(true);
      expect(hist2.has('2')).toEqual(true);
      expect(hist2.has(o1)).toEqual(true);
      expect(hist2.has(wrap(o1))).toEqual(false);
      expect(hist2.has(o2)).toEqual(true);
      expect(hist2.equals(hist1)).toEqual(true);

      values = hist1.items().map(function(item) {
        return isWrapped(item) ? item.item : item;
      });

      expect(values).toContain(1);
      expect(values).toContain('1');
      expect(values).toContain(2);
      expect(values).toContain('2');
      expect(values).toContain(o1);
      expect(values).toContain(o2);

      values = hist2.items().map(function(item) {
        return isWrapped(item) ? item.item : item;
      });

      expect(values).toContain(1);
      expect(values).toContain('1');
      expect(values).toContain(2);
      expect(values).toContain('2');
      expect(values).toContain(o1);
      expect(values).toContain(o2);
    });

    it('can properly unwrap values that are wrapped', function() {
      var values = hist1.unwrap();

      expect(values).toContain(1);
      expect(values).toContain('1');
      expect(values).toContain(2);
      expect(values).toContain('2');
      expect(values).toContain(o1);
      expect(values).toContain(o2);

    });
  });

  describe('copy', function() {
    it('can reliably copy a histogram', function() {
      var
      o1 = { id: 1 },
      o2 = { id: 2 },
      o3 = { id: 3 },
      o4 = { id: 4 },
      o5 = { id: 5 },
      hist1 = new Histogram([o1, o2, o2, o3, o3, o3], 'id'),
      hist2 = hist1.copy();

      hist2.add(o4, o5);
      expect(hist2.size()).toEqual(5);
      expect(hist2.total()).toEqual(8);
      expect(hist2.min()).toEqual(1);
      expect(hist2.max()).toEqual(3);

      expect(hist2.has(o1)).toEqual(true);
      expect(hist2.has(o2)).toEqual(true);
      expect(hist2.has(o3)).toEqual(true);
      expect(hist2.has(o4)).toEqual(true);
      expect(hist2.has(o5)).toEqual(true);

      expect(hist2.freq(o1)).toEqual(1);
      expect(hist2.freq(o2)).toEqual(2);
      expect(hist2.freq(o3)).toEqual(3);
      expect(hist2.freq(o4)).toEqual(1);
      expect(hist2.freq(o5)).toEqual(1);

      hist2 = hist1.copy([o3, o3, o4, o4, o5]);

      expect(hist2.size()).toEqual(3);
      expect(hist2.total()).toEqual(5);
      expect(hist2.min()).toEqual(1);
      expect(hist2.max()).toEqual(2);

      expect(hist2.has(o1)).toEqual(false);
      expect(hist2.has(o2)).toEqual(false);
      expect(hist2.has(o3)).toEqual(true);
      expect(hist2.has(o4)).toEqual(true);
      expect(hist2.has(o5)).toEqual(true);

      expect(hist2.freq(o1)).toEqual(0);
      expect(hist2.freq(o2)).toEqual(0);
      expect(hist2.freq(o3)).toEqual(2);
      expect(hist2.freq(o4)).toEqual(2);
      expect(hist2.freq(o5)).toEqual(1);
    });
  });

  describe('clear', function() {
  });
});

})(window.swiftSet, undefined);

