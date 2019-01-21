(function(swiftSet) {
'use strict'

// Imports
var
  // Histogram = swiftSet.Histogram,
  Set = swiftSet.Set
;

function key() {
  return this.id;
}

describe('Set', function() {
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

    it('creates an accurate set of numbers', function() {
      var num = [7, 7, 8, 8, 9, 9];
      var set = new Set(num);

      expect(set.has(1)).toBe(false);
      expect(set.has(7)).toBe(true);
      expect(set.has(8)).toBe(true);
      expect(set.has(9)).toBe(true);
      expect(set.size()).toEqual(3);
    });
    
    it('creates an accurate set of characters', function() {
      var chr = ['a', 'a', 'b', 'b', 'c', 'c'];
      var set = new Set(chr);

      expect(set.has('x')).toBe(false);
      expect(set.has('a')).toBe(true);
      expect(set.has('b')).toBe(true);
      expect(set.has('c')).toBe(true);
      expect(set.size()).toEqual(3);
    });

    it('creates an accurate set of objects', function() {
      var obj = [o1, o1, o2, o2, o3, o3];
      var set = new Set(obj);

      expect(set.has(o4)).toBe(false);
      expect(set.has(o1)).toBe(true);
      expect(set.has(o2)).toBe(true);
      expect(set.has(o3)).toBe(true);
      expect(set.size()).toEqual(3);
    });

  });
  
  describe('mutability', function() {

    it('accurately adds and removes one or more numbers', function() {
      var num = [1, 2, 2, 3, 3, 3];
      var set = new Set(num);
    
      set.add(3).add(4, 5)
        .remove(1, 2);

      expect(set.has(1)).toBe(false);
      expect(set.has(2)).toBe(false);
      expect(set.has(3)).toBe(true);
      expect(set.has(4)).toBe(true);
      expect(set.has(5)).toBe(true);
      expect(set.size()).toEqual(3);

      expect(set.items()).not.toContain(1);
      expect(set.items()).not.toContain(2);
      expect(set.items()).toContain(3);
      expect(set.items()).toContain(4);
      expect(set.items()).toContain(5);
      expect(set.items().length).toEqual(3);
      
      set = new Set(num)
        .addItems([3, 4, 4, 5, 5])
        .removeItems([1, 2]);

      expect(set.has(1)).toBe(false);
      expect(set.has(2)).toBe(false);
      expect(set.has(3)).toBe(true);
      expect(set.has(4)).toBe(true);
      expect(set.has(5)).toBe(true);
      expect(set.size()).toEqual(3);

      expect(set.items()).not.toContain(1);
      expect(set.items()).not.toContain(2);
      expect(set.items()).toContain(3);
      expect(set.items()).toContain(4);
      expect(set.items()).toContain(5);
      expect(set.items().length).toEqual(3);
      
    });

    it('accurately adds and removes one or more characters', function() {
      var chr = ['a', 'b', 'b', 'c', 'c', 'c'];
      var set = new Set(chr);
    
      set.add('c').add('d', 'e')
        .remove('a', 'b');

      expect(set.has('a')).toBe(false);
      expect(set.has('b')).toBe(false);
      expect(set.has('c')).toBe(true);
      expect(set.has('d')).toBe(true);
      expect(set.has('e')).toBe(true);
      expect(set.size()).toEqual(3);

      expect(set.items()).not.toContain('a');
      expect(set.items()).not.toContain('v');
      expect(set.items()).toContain('c');
      expect(set.items()).toContain('d');
      expect(set.items()).toContain('e');
      expect(set.items().length).toEqual(3);
      
      set = new Set(chr)
        .addItems(['c', 'd', 'd', 'e', 'e'])
        .removeItems(['a', 'b']);

      expect(set.has('a')).toBe(false);
      expect(set.has('b')).toBe(false);
      expect(set.has('c')).toBe(true);
      expect(set.has('d')).toBe(true);
      expect(set.has('e')).toBe(true);
      expect(set.size()).toEqual(3);

      expect(set.items()).not.toContain('a');
      expect(set.items()).not.toContain('v');
      expect(set.items()).toContain('c');
      expect(set.items()).toContain('d');
      expect(set.items()).toContain('e');
      expect(set.items().length).toEqual(3);
    });

    it('accurately adds and removes one or more objects', function() {
      var obj = [o1, o2, o2, o3, o3, o3];
      var set = new Set(obj);
    
      set.add(o3).add(o4, o5)
        .remove(o1, o2);

      expect(set.has(o1)).toBe(false);
      expect(set.has(o2)).toBe(false);
      expect(set.has(o3)).toBe(true);
      expect(set.has(o4)).toBe(true);
      expect(set.has(o5)).toBe(true);
      expect(set.size()).toEqual(3);

      expect(set.items()).not.toContain(o1);
      expect(set.items()).not.toContain(o2);
      expect(set.items()).toContain(o3);
      expect(set.items()).toContain(o4);
      expect(set.items()).toContain(o5);
      expect(set.items().length).toEqual(3);
      
      set = new Set(obj)
        .addItems([o3, o4, o4, o5, o5])
        .removeItems([o1, o2]);

      expect(set.has(o1)).toBe(false);
      expect(set.has(o2)).toBe(false);
      expect(set.has(o3)).toBe(true);
      expect(set.has(o4)).toBe(true);
      expect(set.has(o5)).toBe(true);
      expect(set.size()).toEqual(3);

      expect(set.items()).not.toContain(o1);
      expect(set.items()).not.toContain(o2);
      expect(set.items()).toContain(o3);
      expect(set.items()).toContain(o4);
      expect(set.items()).toContain(o5);
      expect(set.items().length).toEqual(3);
    });

    it('can clear a set and initialize it with new values', function() {
      var
      o1 = { id: 1 },
      o2 = { id: 2 },
      o3 = { id: 3 },
      o4 = { id: 4 },
      o5 = { id: 5 },
      a = [o1, o1, o2, o3, o3],
      b = [o2, o2, o3, o4, o5],
      s1 = new Set(a, 'id'), s2;

      expect(s1.size()).toEqual(3);
      expect(s1.has(o1)).toEqual(true);
      expect(s1.has(o2)).toEqual(true);
      expect(s1.has(o3)).toEqual(true);

      s2 = s1.copy().clear(b);

      expect(s2.size()).toEqual(4);
      expect(s2.has(o1)).toEqual(false);
      expect(s2.has(o2)).toEqual(true);
      expect(s2.has(o3)).toEqual(true);
      expect(s2.has(o4)).toEqual(true);
      expect(s2.has(o5)).toEqual(true);
    });
  });

  describe('object key', function() {

    describe('uses object key values and functions', function() {

      it('uses "khey" as an object value property', function() {
        var
        o1 = { hkey: 'o1' }, 
        o2 = { hkey: 'o2' }, 
        o3 = { hkey: 'o3' }, 
        o4 = { hkey: 'o4' }, 
        o5 = { hkey: 'o5' },
        set = new Set([o1, o2, o3, o4, o5]);

        expect(set.has(o1)).toEqual(true);
        expect(set.has(o2)).toEqual(true);
        expect(set.has(o3)).toEqual(true);
        expect(set.has(o4)).toEqual(true);
        expect(set.has(o5)).toEqual(true);
        expect(set.has({})).toEqual(false);
        expect(set.size()).toEqual(5);
      });

      it('uses "hkey" as an object function property', function() {
        var
        o1 = { id: 'o1', hkey: key }, 
        o2 = { id: 'o2', hkey: key }, 
        o3 = { id: 'o3', hkey: key }, 
        o4 = { id: 'o4', hkey: key }, 
        o5 = { id: 'o5', hkey: key },
        set = new Set([o1, o2, o3, o4, o5]);

        expect(set.has(o1)).toEqual(true);
        expect(set.has(o2)).toEqual(true);
        expect(set.has(o3)).toEqual(true);
        expect(set.has(o4)).toEqual(true);
        expect(set.has(o5)).toEqual(true);
        expect(set.has({})).toEqual(false);
        expect(set.size()).toEqual(5);
      });
    });

    describe('uses explicit key values and functions', function() {

      it('uses custom key as an object property value', function() {
        var
        o1 = { myKey: 'o1' }, 
        o2 = { myKey: 'o2' }, 
        o3 = { myKey: 'o3' }, 
        o4 = { myKey: 'o4' }, 
        o5 = { myKey: 'o5' },
        set = new Set([o1, o2, o3, o4, o5], 'myKey');

        expect(set.has(o1)).toEqual(true);
        expect(set.has(o2)).toEqual(true);
        expect(set.has(o3)).toEqual(true);
        expect(set.has(o4)).toEqual(true);
        expect(set.has(o5)).toEqual(true);
        expect(set.has({})).toEqual(false);
        expect(set.size()).toEqual(5);
      });

      it('uses a custom function as a key retriever', function() {
        var
        myKey = function() { return this.id; },
        o1 = { id: 'o1' }, 
        o2 = { id: 'o2' }, 
        o3 = { id: 'o3' }, 
        o4 = { id: 'o4' }, 
        o5 = { id: 'o5' },
        set = new Set([o1, o2, o3, o4, o5], myKey);

        expect(set.has(o1)).toEqual(true);
        expect(set.has(o2)).toEqual(true);
        expect(set.has(o3)).toEqual(true);
        expect(set.has(o4)).toEqual(true);
        expect(set.has(o5)).toEqual(true);
        expect(set.has({})).toEqual(false);
        expect(set.size()).toEqual(5);
      });
    });

    it('uses object toString method to implicity generate a key', function() {
      var
      o1 = { id: 'v', toString: function() { return this.id; } }, 
      o2 = { id: 'w', toString: function() { return this.id; } }, 
      o3 = { id: 'x', toString: function() { return this.id; } }, 
      o4 = { id: 'y', toString: function() { return this.id; } }, 
      o5 = { id: 'z', toString: function() { return this.id; } },
      set = new Set([o1, o2, o3, o4, o5]);

      expect(set.has(o1)).toEqual(true);
      expect(set.has(o2)).toEqual(true);
      expect(set.has(o3)).toEqual(true);
      expect(set.has(o4)).toEqual(true);
      expect(set.has(o5)).toEqual(true);
      expect(set.has({})).toEqual(false);
      expect(set.size()).toEqual(5);
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
      var set = new Set([o1, o2, o2, o3, o3, o3], 'id');

      expect(set.size()).toEqual(3);

      expect(set.has(o1)).toEqual(true);
      expect(set.has(o2)).toEqual(true);
      expect(set.has(o3)).toEqual(true);
      expect(set.has(o4)).toEqual(false);
    });

    it('uses an object function property', function() {
      var set = new Set([o1, o2, o2, o3, o3, o3], function() {
        return this.id;
      });

      expect(set.size()).toEqual(3);

      expect(set.has(o1)).toEqual(true);
      expect(set.has(o2)).toEqual(true);
      expect(set.has(o3)).toEqual(true);
      expect(set.has(o4)).toEqual(false);
    });
  });

  describe('iteration', function() {

    it('properly iterates over the set', function() {
      var set = new Set([7, 8, 8, 9, 9, 9]),
      calls = { method: function() {}};
      spyOn(calls, 'method');

      set.each(function(item, count, key) {
        calls.method(item);
      });
      expect(calls.method).toHaveBeenCalledWith(7);
      expect(calls.method).toHaveBeenCalledWith(8);
      expect(calls.method).toHaveBeenCalledWith(9);
      expect(calls.method).not.toHaveBeenCalledWith(0);
    });

    it('produces a correct list of items', function() {
      var set = new Set([7, 8, 8, 9, 9, 9]),
        values = set.items();

      expect(values).toContain(7);
      expect(values).toContain(8);
      expect(values).toContain(9);
      expect(values.length).toEqual(3);
    });
  });

  describe('key', function() {

    it('generates a unique key for numbers', function() {
      var set1 = new Set([7, 8, 8, 9, 9, 9]),
      set2 = new Set([7, 8, 9]),
      set3 = new Set([3, 4, 5]);

      expect(set1.keyify()).toEqual('{7,8,9}');
      expect(set1.keyify()).toEqual(set2.keyify());
      expect(set1.keyify()).not.toEqual(set3.keyify());
    });
    
    it('generates a unique key for characters', function() {
      var set1 = new Set(['7', '8', '8', '9', '9', '9']),
        set2 = new Set(['7', '8', '9']),
        set3 = new Set(['3', '4', '5']);

      expect(set1.keyify()).toEqual('{7,8,9}');
      expect(set1.keyify()).toEqual(set2.keyify());
      expect(set1.keyify()).not.toEqual(set3.keyify());
    });

    it('generates a unique key for objects', function() {
      var set1 = new Set([o1, o2, o2, o3, o3, o3]),
        set2 = new Set([o1, o2, o2, o3, o3, o3]),
        set3 = new Set([o3, o4, o5]);

      expect(set1.keyify()).toEqual('{o1,o2,o3}');
      expect(set1.keyify()).toEqual(set2.keyify());
      expect(set1.keyify()).not.toEqual(set3.keyify());
    });

    it('can treat strings and numbers differently (with wrap)', function() {
      var wrap = Set.wrapObj(),
      set1 = new Set()
        .add(wrap(1),wrap(2),wrap(2),wrap(3),wrap(3),wrap(3)),
      set2 = new Set()
        .add(wrap('1'),wrap('2'),wrap('2'),wrap('3'),wrap('3'),wrap('3'));

      expect(set1.has(wrap(1))).toEqual(true);
      expect(set1.has(wrap(2))).toEqual(true);
      expect(set1.has(wrap(3))).toEqual(true);
      expect(set1.has(wrap('3'))).toEqual(false);

      expect(set2.has(wrap('1'))).toEqual(true);
      expect(set2.has(wrap('2'))).toEqual(true);
      expect(set2.has(wrap('3'))).toEqual(true);
      expect(set2.has(wrap(3))).toEqual(false);

      expect(set1.keyify()).not.toEqual(set2.keyify());
      set1.addItems(set2.items());
      expect(set1.size()).toEqual(6);
    });

    it('correctly determines set equivalence', function() {
      var set1 = new Set([7, 8, 8, 9, 9, 9]),
        set2 = new Set([7, 8, 9]),
        set3 = new Set([6, 7, 8]);
      expect(set1.equals(set2)).toEqual(true);
      expect(set1.equals(set3)).toEqual(false);
    });

    it('can use sets as items in a set', function() {
      var s1 = new Set([1, 2, 3, 3, 3, 3]),
        s2 = new Set([4, 5, 5, 6, 6, 6]),
        s3 = new Set([7, 8, 8, 9, 9, 9]),
        s4 = new Set([0]),
        set1 = new Set([s1, s2, s2, s3, s3, s3]),
        set2 = new Set([s1, s2, s3]),
        set3 = new Set([s2, s3, s4]);

      expect(set1.size()).toEqual(3);
      expect(set1.equals(set2)).toEqual(true);
      expect(set1.equals(set3)).toEqual(false);
    });
  });
  
  describe('mixed items', function() {
      var wrap = Set.wrapObj(), isWrapped = Set.isWrapped,
      set1 = new Set([wrap(1), wrap(1), '1', wrap(2), '2', o1, o2]),
      set2 = set1.copy();

    it('can build a mixed set of numbers, strings, and objects', function() {
      var values;

      expect(set1.size()).toEqual(6);
      expect(set1.has(wrap(1))).toEqual(true);
      expect(set1.has(wrap('1'))).toEqual(false);
      expect(set1.has('1')).toEqual(true);
      expect(set1.has(wrap(2))).toEqual(true);
      expect(set1.has('2')).toEqual(true);
      expect(set1.has(o1)).toEqual(true);
      expect(set1.has(wrap(o1))).toEqual(false);
      expect(set1.has(o2)).toEqual(true);
      expect(set1.equals(set2)).toEqual(true);

      expect(set2.size()).toEqual(6);
      expect(set2.has(wrap(1))).toEqual(true);
      expect(set2.has(wrap('1'))).toEqual(false);
      expect(set2.has('1')).toEqual(true);
      expect(set2.has(wrap(2))).toEqual(true);
      expect(set2.has('2')).toEqual(true);
      expect(set2.has(o1)).toEqual(true);
      expect(set2.has(wrap(o1))).toEqual(false);
      expect(set2.has(o2)).toEqual(true);
      expect(set2.equals(set2)).toEqual(true);

      values = set1.items().map(function(item) {
        return isWrapped(item) ? item.item : item;
      });

      expect(values).toContain(1);
      expect(values).toContain('1');
      expect(values).toContain(2);
      expect(values).toContain('2');
      expect(values).toContain(o1);
      expect(values).toContain(o2);

      values = set2.items().map(function(item) {
        return isWrapped(item) ? item.item : item;
      });

      expect(values).toContain(1);
      expect(values).toContain('1');
      expect(values).toContain(2);
      expect(values).toContain('2');
      expect(values).toContain(o1);
      expect(values).toContain(o2);
    });

    it('can use a custom toString method on a wrapper', function() {
      var
      o1 = { id: 'o1' }, 
      o2 = { id: 'o2' }, 
      o3 = { id: 'o3' }, 
      o4 = { id: 'o4' }, 
      o5 = { id: 'o5' },
      wrap = Set.wrapObj(toStr),
      set = new Set([wrap(o1), wrap(o1), wrap(o2), wrap(o3)]);
      function toStr() { return this.item.id; }

      expect(set.size()).toEqual(3);
      expect(set.has(wrap(o1))).toEqual(true);
      expect(set.has(wrap(o2))).toEqual(true);
      expect(set.has(wrap(o3))).toEqual(true);
      expect(set.has(wrap(o4))).toEqual(false);
    });

    it('can properly unwrap values that are wrapped', function() {
      var values = set1.unwrap();

      expect(values).toContain(1);
      expect(values).toContain('1');
      expect(values).toContain(2);
      expect(values).toContain('2');
      expect(values).toContain(o1);
      expect(values).toContain(o2);
      expect(values.length).toEqual(6);

    });
  });

  describe('operations on numbers', function() {
    var set1 = new Set([1, 2, 3]),
    set2 = new Set([2, 3, 4]);

    it('can pefrom a proper union', function() {

      expect(set1.union(set2)).toContain(1);
      expect(set1.union(set2)).toContain(2);
      expect(set1.union(set2)).toContain(3);
      expect(set1.union(set2)).toContain(4);
      
      expect(set1.union([2, 3, 4])).toContain(1);
      expect(set1.union([2, 3, 4])).toContain(2);
      expect(set1.union([2, 3, 4])).toContain(3);
      expect(set1.union([2, 3, 4])).toContain(4);
    });

    it('can pefrom a proper intersection', function() {

      expect(set1.intersection(set2)).not.toContain(1);
      expect(set1.intersection(set2)).toContain(2);
      expect(set1.intersection(set2)).toContain(3);
      expect(set1.intersection(set2)).not.toContain(4);
      
      expect(set1.intersection([2, 3, 4])).not.toContain(1);
      expect(set1.intersection([2, 3, 4])).toContain(2);
      expect(set1.intersection([2, 3, 4])).toContain(3);
      expect(set1.intersection([2, 3, 4])).not.toContain(4);
    });

    it('can pefrom a proper difference', function() {

      expect(set1.difference(set2)).toContain(1);
      expect(set1.difference(set2)).not.toContain(2);
      expect(set1.difference(set2)).not.toContain(3);
      expect(set1.difference(set2)).toContain(4);
      
      expect(set1.difference([2, 3, 4])).toContain(1);
      expect(set1.difference([2, 3, 4])).not.toContain(2);
      expect(set1.difference([2, 3, 4])).not.toContain(3);
      expect(set1.difference([2, 3, 4])).toContain(4);
    });

    it('can pefrom a proper complement', function() {

      expect(set1.complement(set2)).toContain(1);
      expect(set1.complement(set2)).not.toContain(2);
      expect(set1.complement(set2)).not.toContain(3);
      expect(set1.complement(set2)).not.toContain(4);
      
      expect(set1.complement([2, 3, 4])).toContain(1);
      expect(set1.complement([2, 3, 4])).not.toContain(2);
      expect(set1.complement([2, 3, 4])).not.toContain(3);
      expect(set1.complement([2, 3, 4])).not.toContain(4);
    });

    it('can determine set equivalence', function() {
      var set1 = new Set([1, 1, 2, 2, 3, 3]),
      set2 = new Set([1, 2, 3]),
      set3 = new Set([2, 3, 4]);

      expect(set1.equals(set2)).toEqual(true);
      expect(set1.equals([1, 2, 3])).toEqual(true);
      expect(set1.equals(set3)).toEqual(false);
      expect(set1.equals([2, 3, 4])).toEqual(false);
    });
  });

  describe('operations on characters', function() {
    var set1 = new Set(['a', 'b', 'c']),
    set2 = new Set(['b', 'c', 'd']);

    it('can pefrom a proper union', function() {

      expect(set1.union(set2)).toContain('a');
      expect(set1.union(set2)).toContain('b');
      expect(set1.union(set2)).toContain('c');
      expect(set1.union(set2)).toContain('d');
      
      expect(set1.union(['b', 'c', 'd'])).toContain('a');
      expect(set1.union(['b', 'c', 'd'])).toContain('b');
      expect(set1.union(['b', 'c', 'd'])).toContain('c');
      expect(set1.union(['b', 'c', 'd'])).toContain('d');
    });

    it('can pefrom a proper intersection', function() {

      expect(set1.intersection(set2)).not.toContain('a');
      expect(set1.intersection(set2)).toContain('b');
      expect(set1.intersection(set2)).toContain('c');
      expect(set1.intersection(set2)).not.toContain('d');
      
      expect(set1.intersection(['b', 'c', 'd'])).not.toContain('a');
      expect(set1.intersection(['b', 'c', 'd'])).toContain('b');
      expect(set1.intersection(['b', 'c', 'd'])).toContain('c');
      expect(set1.intersection(['b', 'c', 'd'])).not.toContain('d');
    });

    it('can pefrom a proper difference', function() {

      expect(set1.difference(set2)).toContain('a');
      expect(set1.difference(set2)).not.toContain('b');
      expect(set1.difference(set2)).not.toContain('c');
      expect(set1.difference(set2)).toContain('d');
      
      expect(set1.difference(['b', 'c', 'd'])).toContain('a');
      expect(set1.difference(['b', 'c', 'd'])).not.toContain('b');
      expect(set1.difference(['b', 'c', 'd'])).not.toContain('c');
      expect(set1.difference(['b', 'c', 'd'])).toContain('d');
    });

    it('can pefrom a proper complement', function() {

      expect(set1.complement(set2)).toContain('a');
      expect(set1.complement(set2)).not.toContain('b');
      expect(set1.complement(set2)).not.toContain('c');
      expect(set1.complement(set2)).not.toContain('d');
      
      expect(set1.complement(['b', 'c', 'd'])).toContain('a');
      expect(set1.complement(['b', 'c', 'd'])).not.toContain('b');
      expect(set1.complement(['b', 'c', 'd'])).not.toContain('c');
      expect(set1.complement(['b', 'c', 'd'])).not.toContain('d');
    });

    it('can determine set equivalence', function() {
      var set1 = new Set(['a', 'a', 'b', 'b', 'c', 'c']),
      set2 = new Set(['a', 'b', 'c']),
      set3 = new Set(['b', 'c', 'd']);

      expect(set1.equals(set2)).toEqual(true);
      expect(set1.equals(['a', 'b', 'c'])).toEqual(true);
      expect(set1.equals(set3)).toEqual(false);
      expect(set1.equals(['b', 'c', 'd'])).toEqual(false);
    });
  });

  describe('operations on objects', function() {
    var set1 = new Set([o1, o2, o3]),
    set2 = new Set([o2, o3, o4]);

    it('can pefrom a proper union', function() {

      expect(set1.union(set2)).toContain(o1);
      expect(set1.union(set2)).toContain(o2);
      expect(set1.union(set2)).toContain(o3);
      expect(set1.union(set2)).toContain(o4);
      
      expect(set1.union([o2, o3, o4])).toContain(o1);
      expect(set1.union([o2, o3, o4])).toContain(o2);
      expect(set1.union([o2, o3, o4])).toContain(o3);
      expect(set1.union([o2, o3, o4])).toContain(o4);
    });

    it('can pefrom a proper intersection', function() {

      expect(set1.intersection(set2)).not.toContain(o1);
      expect(set1.intersection(set2)).toContain(o2);
      expect(set1.intersection(set2)).toContain(o3);
      expect(set1.intersection(set2)).not.toContain(o4);
      
      expect(set1.intersection([o2, o3, o4])).not.toContain(o1);
      expect(set1.intersection([o2, o3, o4])).toContain(o2);
      expect(set1.intersection([o2, o3, o4])).toContain(o3);
      expect(set1.intersection([o2, o3, o4])).not.toContain(o4);
    });

    it('can pefrom a proper difference', function() {

      expect(set1.difference(set2)).toContain(o1);
      expect(set1.difference(set2)).not.toContain(o2);
      expect(set1.difference(set2)).not.toContain(o3);
      expect(set1.difference(set2)).toContain(o4);
      
      expect(set1.difference([o2, o3, o4])).toContain(o1);
      expect(set1.difference([o2, o3, o4])).not.toContain(o2);
      expect(set1.difference([o2, o3, o4])).not.toContain(o3);
      expect(set1.difference([o2, o3, o4])).toContain(o4);
    });

    it('can pefrom a proper complement', function() {

      expect(set1.complement(set2)).toContain(o1);
      expect(set1.complement(set2)).not.toContain(o2);
      expect(set1.complement(set2)).not.toContain(o3);
      expect(set1.complement(set2)).not.toContain(o4);
      
      expect(set1.complement([o2, o3, o4])).toContain(o1);
      expect(set1.complement([o2, o3, o4])).not.toContain(o2);
      expect(set1.complement([o2, o3, o4])).not.toContain(o3);
      expect(set1.complement([o2, o3, o4])).not.toContain(o4);
    });

    it('can determine set equivalence', function() {
      var set1 = new Set([o1, o1, o2, o2, o3, o3]),
      set2 = new Set([o1, o2, o3]),
      set3 = new Set([o2, o3, o4]);

      expect(set1.equals(set2)).toEqual(true);
      expect(set1.equals([o1, o2, o3])).toEqual(true);
      expect(set1.equals(set3)).toEqual(false);
      expect(set1.equals([o2, o3, o4])).toEqual(false);
    });
  });

  describe('copy', function() {
    it('can reliably copy a set', function() {
      var
      o1 = { id: 1 },
      o2 = { id: 2 },
      o3 = { id: 3 },
      o4 = { id: 4 },
      o5 = { id: 5 },
      set1 = new Set([o1, o2, o2, o3, o3, o3], 'id'),
      set2 = set1.copy();

      set2.add(o4, o5);

      expect(set2.size()).toEqual(5);
      expect(set2.has(o1)).toEqual(true);
      expect(set2.has(o2)).toEqual(true);
      expect(set2.has(o3)).toEqual(true);
      expect(set2.has(o4)).toEqual(true);
      expect(set2.has(o5)).toEqual(true);

      set2 = set1.copy([o3, o3, o4, o5, o5]);

      expect(set2.size()).toEqual(3);
      expect(set2.has(o1)).toEqual(false);
      expect(set2.has(o2)).toEqual(false);
      expect(set2.has(o3)).toEqual(true);
      expect(set2.has(o4)).toEqual(true);
      expect(set2.has(o5)).toEqual(true);
    });
  });

  describe('static set operations', function() {
    it('can perform a union of two sets of numbers', function() {
      var s = swiftSet.Set;
      expect(s.union([1, 2, 3], [4, 5])).toContain(1);
      expect(s.union([1, 2, 3], [4, 5])).toContain(2);
      expect(s.union([1, 2, 3], [4, 5])).toContain(3);
      expect(s.union([1, 2, 3], [4, 5])).toContain(4);
      expect(s.union([1, 2, 3], [4, 5])).toContain(5);
    });
    it('can perform an intersection of two sets', function() {
      var s = swiftSet.Set;
      expect(s.intersection([1, 2, 3], [3, 4, 5])).not.toContain(1);
      expect(s.intersection([1, 2, 3], [3, 4, 5])).not.toContain(2);
      expect(s.intersection([1, 2, 3], [3, 4, 5])).toContain(3);
      expect(s.intersection([1, 2, 3], [3, 4, 5])).not.toContain(4);
      expect(s.intersection([1, 2, 3], [3, 4, 5])).not.toContain(5);
    });
    it('can perform a difference of two sets', function() {
      var s = swiftSet.Set;
      expect(s.difference([1, 2, 3], [3, 4, 5])).toContain(1);
      expect(s.difference([1, 2, 3], [3, 4, 5])).toContain(2);
      expect(s.difference([1, 2, 3], [3, 4, 5])).not.toContain(3);
      expect(s.difference([1, 2, 3], [3, 4, 5])).toContain(4);
      expect(s.difference([1, 2, 3], [3, 4, 5])).toContain(5);
    });
    it('can perform a complement of two sets', function() {
      var s = swiftSet.Set;
      expect(s.complement([1, 2, 3], [3, 4, 5])).toContain(1);
      expect(s.complement([1, 2, 3], [3, 4, 5])).toContain(2);
      expect(s.complement([1, 2, 3], [3, 4, 5])).not.toContain(3);
      expect(s.complement([1, 2, 3], [3, 4, 5])).not.toContain(4);
      expect(s.complement([1, 2, 3], [3, 4, 5])).not.toContain(5);
    });
    it('can determine set equality', function() {
      var s = swiftSet.Set;
      expect(s.equals([1, 2, 3, 3], [1, 1, 2, 2, 3])).toEqual(true);
      expect(s.equals([1, 2, 3], [3, 4, 5])).toEqual(false);
    });
  });

  describe('static set operations', function() {
    var o1 = {id: 1},
    o2 = {id:2},
    o3 = {id:3},
    o4 = {id:4},
    o5 = {id:5};

    beforeEach(function() {
      Set.pushUid(function() { return this.id; });
    });

    afterEach(function() {
      Set.popUid();
    });

    it('can perform a union of two sets of objects', function() {
      var s = swiftSet.Set;
      expect(s.union([o1, o1, o3], [o4, o5])).toContain(o1);
      expect(s.union([o1, o2, o3], [o4, o5])).toContain(o2);
      expect(s.union([o1, o2, o3], [o4, o5])).toContain(o3);
      expect(s.union([o1, o2, o3], [o4, o5])).toContain(o4);
      expect(s.union([o1, o2, o3], [o4, o5])).toContain(o5);
    });
    it('can perform an intersection of two sets', function() {
      var s = swiftSet.Set;
      expect(s.intersection([o1, o2, o3], [o3, o4, o5])).not.toContain(o1);
      expect(s.intersection([o1, o2, o3], [o3, o4, o5])).not.toContain(o2);
      expect(s.intersection([o1, o2, o3], [o3, o4, o5])).toContain(o3);
      expect(s.intersection([o1, o2, o3], [o3, o4, o5])).not.toContain(o4);
      expect(s.intersection([o1, o2, o3], [o3, o4, o5])).not.toContain(o5);
    });
    it('can perform a difference of two sets', function() {
      var s = swiftSet.Set;
      expect(s.difference([o1, o2, o3], [o3, o4, o5])).toContain(o1);
      expect(s.difference([o1, o2, o3], [o3, o4, o5])).toContain(o2);
      expect(s.difference([o1, o2, o3], [o3, o4, o5])).not.toContain(o3);
      expect(s.difference([o1, o2, o3], [o3, o4, o5])).toContain(o4);
      expect(s.difference([o1, o2, o3], [o3, o4, o5])).toContain(o5);
    });
    it('can perform a complement of two sets', function() {
      var s = swiftSet.Set;
      expect(s.complement([o1, o2, o3], [o3, o4, o5])).toContain(o1);
      expect(s.complement([o1, o2, o3], [o3, o4, o5])).toContain(o2);
      expect(s.complement([o1, o2, o3], [o3, o4, o5])).not.toContain(o3);
      expect(s.complement([o1, o2, o3], [o3, o4, o5])).not.toContain(o4);
      expect(s.complement([o1, o2, o3], [o3, o4, o5])).not.toContain(o5);
    });
    it('can determine set equality', function() {
      var s = swiftSet.Set;
      expect(s.equals([o1, o2, o3, o3], [o1, o1, o2, o2, o3])).toEqual(true);
      expect(s.equals([o1, o2, o3], [o3, o4, o5])).toEqual(false);
    });
  });


});

})(window.swiftSet, undefined);

