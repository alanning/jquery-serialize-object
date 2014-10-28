/**
 * jQuery serializeObject
 * @copyright 2014, macek <paulmacek@gmail.com>
 * @link https://github.com/alanning/jquery-serialize-object
 * @link https://github.com/macek/jquery-serialize-object
 * @license BSD
 * @version 2.3.0 - modified by Adrian Lanning to convert checkboxes to boolean
 */
(function(root, factory) {

  // AMD
  if (typeof define === "function" && define.amd) {
    define(["jquery", "exports"], function($, exports) {
      factory(root, exports, $);
    });
  }

  // CommonJS
  else if (typeof exports !== "undefined") {
    var $ = require("jquery");
    factory(root, exports, $);
  }

  // Browser
  else {
    root.FormSerializer = factory(root, {}, (root.jQuery || root.Zepto || root.ender || root.$));
  }

}(this, function(root, exports, $) {

  var patterns = {
    // bracket notation: profile[comm][drills]
    //validate: /^[_a-z][a-z0-9_\-]*(?:\[(?:\d*|[a-z0-9_\-]+)\])*$/i,

    // dot notation:  profile.comm.drills
    validate: /^[_a-z][a-z0-9_\/\-]*(?:\.[a-z0-9_\/\-]+)*(?:\[\])?$/i,

    key:      /[a-z0-9_\/\-]+|(?=\[\])/gi,
    push:     /^$/,
    fixed:    /^\d+$/,
    named:    /^[a-z0-9_\/\-]+$/i
  };

  function FormSerializer(helper, $form) {

    // private variables
    var data     = {},
        pushes   = {};

    // private API
    function build(base, key, value) {
      base[key] = value;
      return base;
    }

    function makeObject(root, value) {

      var keys = root.match(patterns.key), k;

      // nest, nest, ..., nest
      while ((k = keys.pop()) !== undefined) {
        // foo[]
        if (patterns.push.test(k)) {
          if (typeof value == 'undefined') {
            // special case for multi-select elements with no selections
            value = []
          } else {
            var idx = incrementPush(root.replace(/\[\]$/, ''));
            value = build([], idx, value);
          }
        }

        // foo[n]
        else if (patterns.fixed.test(k)) {
          value = build([], k, value);
        }

        // foo; foo[bar]
        else if (patterns.named.test(k)) {
          value = build({}, k, value);
        }
      }

      return value;
    }

    function incrementPush(key) {
      if (pushes[key] === undefined) {
        pushes[key] = 0;
      }
      return pushes[key]++;
    }

    function isCheckbox (name) {
      var selector = '[name="' + name + '"]';
      return $(selector, $form).attr('type') === 'checkbox';
    }

    /*
    function addToHash (key, dest, obj) {
      var existing = dest[key]

      if (!existing) {
        helper.extend(dest, obj);
      } else {
        // multiple elements with same name
        if (!helper.isArray(existing)) {
          // convert existing field to an array
          dest[key] = [existing]
        }
        dest[key].push(obj[key])
      }
    }
    */

    function addPair(pair) {
      var obj,
          existing;

      /*
      if (!patterns.validate.test(pair.name)) {
        console.log('no match', 
            patterns.validate.toString() + ".test('" + pair.name + "')")
        return this;
      }
      */

      if (pair.value === 'on' && isCheckbox(pair.name)) {
        pair.value = true
      }
      obj = makeObject(pair.name, pair.value);

      //console.log(pair.name, obj, JSON.stringify(data))
      data = helper.extend(true, data, obj)

      return this;
    }

    function addPairs(pairs) {
      if (!helper.isArray(pairs)) {
        throw new Error("formSerializer.addPairs expects an Array");
      }
      for (var i=0, len=pairs.length; i<len; i++) {
        this.addPair(pairs[i]);
      }
      return this;
    }

    function serialize() {
      return data;
    }

    function serializeJSON() {
      return JSON.stringify(serialize());
    }

    // public API
    this.addPair = addPair;
    this.addPairs = addPairs;
    this.serialize = serialize;
    this.serializeJSON = serializeJSON;
  }

  FormSerializer.patterns = patterns;

  FormSerializer.serializeObject = function serializeObject(options) {
    var $form = this,
        rawPairs;

    if (this.length > 1) {
      return new Error("jquery-serialize-object can only serialize one form at a time");
    }

    options = options || {};
    rawPairs = $form.serializeArray();

    if (options.includeUnchecked) {
      $("input[type=checkbox]:not(:checked)", $form).each(function () {
        rawPairs.push({name: this.name, value: false});
      })
    }
    if (options.includeUnselected) {
      $("select", $form).each(function () {
        if (!$(this).val()) {
          rawPairs.push({name: this.name, value: undefined});
        }
      })
    }

    return new FormSerializer($, $form).
      addPairs(rawPairs).
      serialize();
  };

  FormSerializer.serializeJSON = function serializeJSON() {
    if (this.length > 1) {
      return new Error("jquery-serialize-object can only serialize one form at a time");
    }
    return new FormSerializer($, this).
      addPairs(this.serializeArray()).
      serializeJSON();
  };

  if (typeof $.fn !== "undefined") {
    $.fn.serializeObject = FormSerializer.serializeObject;
    $.fn.serializeJSON   = FormSerializer.serializeJSON;
  }

  exports.FormSerializer = FormSerializer;

  return FormSerializer;
}));

