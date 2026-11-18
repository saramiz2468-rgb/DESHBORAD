/* Lightweight runtime: renders the declarative template in index.html
   (holes {{path}}, <sc-for>, <sc-if>, onClick/onChange bindings) with Preact,
   and persists the app state in this browser's localStorage. */
(function () {
  'use strict';
  var h = preact.h, render = preact.render, Fragment = preact.Fragment;
  var STORE_KEY = 'legal-system-v1';
  var TRANSIENT = ['toast', 'k', 'dialog', 'edit', 'c360', 'openCase', 'payEdit', 'more', 'undo', 'report', 'cfgOpen', 'openJ'];

  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  var WHOLE = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;

  function resolve(path, scopes) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    var parts = path.split('.');
    var cur, found = false;
    for (var i = 0; i < scopes.length; i++) {
      var sc = scopes[i];
      if (sc && typeof sc === 'object' && parts[0] in sc) { cur = sc[parts[0]]; found = true; break; }
    }
    if (!found) return undefined;
    for (var j = 1; j < parts.length; j++) { if (cur == null) return undefined; cur = cur[parts[j]]; }
    return cur;
  }
  function interp(str, scopes) {
    return str.replace(HOLE, function (m, p) { var v = resolve(p, scopes); return v == null ? '' : String(v); });
  }
  function attrVal(str, scopes) {
    var m = str.match(WHOLE);
    if (m) return resolve(m[1], scopes);
    return str.indexOf('{{') >= 0 ? interp(str, scopes) : str;
  }
  var TEXTLIKE = /^(text|search|number|email|tel|url|password)$/;

  function build(node, scopes) {
    if (node.nodeType === 3) {
      var t = node.nodeValue;
      if (!t.trim() && t.indexOf('\n') >= 0) return null;
      return t.indexOf('{{') >= 0 ? interp(t, scopes) : t;
    }
    if (node.nodeType !== 1) return null;
    var tag = node.localName;
    if (tag === 'template') {
      var kind = node.getAttribute('data-sc');
      var src = node.content;
      if (kind === 'if') {
        return attrVal(node.getAttribute('value') || '', scopes) ? kids(src, scopes) : null;
      }
      if (kind === 'for') {
        var list = attrVal(node.getAttribute('list') || '', scopes) || [];
        var as = node.getAttribute('as') || 'item';
        var out = [];
        for (var i = 0; i < list.length; i++) {
          var it = list[i], sc = {}; sc[as] = it; sc.$index = i;
          var key = it && typeof it === 'object' && it.id != null ? it.id + '#' + i : i;
          out.push(h(Fragment, { key: key }, kids(src, [sc].concat(scopes))));
        }
        return out;
      }
      return null;
    }
    var props = {};
    var attrs = node.attributes;
    for (var a = 0; a < attrs.length; a++) {
      var name = attrs[a].name, low = name.toLowerCase();
      if (low.indexOf('hint-') === 0 || low.indexOf('data-claude') === 0) continue;
      var v = attrVal(attrs[a].value, scopes);
      if (low === 'onchange') {
        var type = (node.getAttribute('type') || 'text').toLowerCase();
        var textish = tag === 'textarea' || (tag === 'input' && TEXTLIKE.test(type));
        props[textish ? 'onInput' : 'onChange'] = v;
        continue;
      }
      if (low.indexOf('on') === 0 && low.length > 2) { props['on' + low.charAt(2).toUpperCase() + low.slice(3)] = v; continue; }
      if (low === 'disabled' || low === 'checked' || low === 'selected' || low === 'readonly') { props[low === 'readonly' ? 'readOnly' : low] = !!v && v !== 'false'; continue; }
      if (low === 'defaultvalue') { props.defaultValue = v; continue; }
      if (low === 'for') { props.htmlFor = v; continue; }
      if (low === 'inputmode') { props.inputMode = v; continue; }
      props[name] = v;
    }
    return h(tag, props, kids(node, scopes));
  }
  function kids(node, scopes) {
    var out = [], cn = node.childNodes;
    for (var i = 0; i < cn.length; i++) {
      var r = build(cn[i], scopes);
      if (r == null) continue;
      if (Array.isArray(r)) { for (var j = 0; j < r.length; j++) out.push(r[j]); } else out.push(r);
    }
    return out;
  }

  function loadSaved() {
    try { var raw = localStorage.getItem(STORE_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  function persistable(state) {
    var o = {};
    for (var k in state) if (TRANSIENT.indexOf(k) < 0) o[k] = state[k];
    return o;
  }
  var saveTimer = null;
  function save(state) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(persistable(state))); } catch (e) { /* storage full or blocked */ }
    }, 150);
  }

  var inst = null, root = null, mount = null, queued = false;
  function paint() {
    queued = false;
    var vals = inst.renderVals();
    render(h(Fragment, null, kids(root, [vals])), mount);
    save(inst.state);
  }
  function schedule() { if (!queued) { queued = true; Promise.resolve().then(paint); } }

  window.DCLogic = function DCLogic(props) { this.props = props || {}; this.state = {}; };
  window.DCLogic.prototype.setState = function (u) {
    var patch = typeof u === 'function' ? u(this.state) : u;
    this.state = Object.assign({}, this.state, patch);
    schedule();
  };
  window.DCLogic.prototype.forceUpdate = function () { schedule(); };
  window.DCLogic.persistable = persistable;

  window.bootApp = function (Component) {
    var raw = document.getElementById('tpl').textContent
      .replace(/<sc-(for|if)\b/g, '<template data-sc="$1"')
      .replace(/<\/sc-(for|if)>/g, '</template>');
    var t = document.createElement('template');
    t.innerHTML = raw;
    root = t.content;
    mount = document.getElementById('app');
    inst = new Component({});
    var saved = loadSaved();
    if (saved) inst.state = Object.assign({}, inst.state, saved);
    paint();
    if (inst.componentDidMount) inst.componentDidMount();
  };
})();
