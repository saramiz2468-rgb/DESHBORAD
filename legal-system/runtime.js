/* Lightweight runtime: renders the declarative template in index.html
   (holes {{path}}, <sc-for>, <sc-if>, onClick/onChange bindings) with Preact,
   caches state in localStorage, and — when config.js provides a Supabase
   project — syncs the shared state live between all signed-in users. */
(function () {
  'use strict';
  var h = preact.h, render = preact.render, Fragment = preact.Fragment;
  var STORE_KEY = 'legal-system-v1';
  var TRANSIENT = ['toast', 'k', 'dialog', 'edit', 'c360', 'openCase', 'payEdit', 'more', 'undo', 'report', 'cfgOpen', 'openJ'];
  // per-device view preferences: kept locally, never synced
  var LOCAL_ONLY = ['page', 'owner', 'tabs', 'sf', 'caseFilter', 'other'];
  var TABLE = 'app_kv';

  /* ---------------- template compiler ---------------- */
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
      var kind = node.getAttribute('data-sc'), src = node.content;
      if (kind === 'if') return attrVal(node.getAttribute('value') || '', scopes) ? kids(src, scopes) : null;
      if (kind === 'for') {
        var list = attrVal(node.getAttribute('list') || '', scopes) || [];
        var as = node.getAttribute('as') || 'item', out = [];
        for (var i = 0; i < list.length; i++) {
          var it = list[i], sc = {}; sc[as] = it; sc.$index = i;
          var key = it && typeof it === 'object' && it.id != null ? it.id + '#' + i : i;
          out.push(h(Fragment, { key: key }, kids(src, [sc].concat(scopes))));
        }
        return out;
      }
      return null;
    }
    var props = {}, attrs = node.attributes;
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
      if (low === 'autocomplete') { props.autoComplete = v; continue; }
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

  /* ---------------- helpers ---------------- */
  function persistable(state) {
    var o = {};
    for (var k in state) if (TRANSIENT.indexOf(k) < 0) o[k] = state[k];
    return o;
  }
  function syncable(state) {
    var o = {};
    for (var k in state) if (TRANSIENT.indexOf(k) < 0 && LOCAL_ONLY.indexOf(k) < 0) o[k] = state[k];
    return o;
  }
  function J(x) { return JSON.stringify(x === undefined ? null : x); }
  function clone(x) { return x === undefined ? undefined : JSON.parse(JSON.stringify(x)); }
  function isPlain(x) { return x && typeof x === 'object' && !Array.isArray(x); }
  function idArray(x) { return Array.isArray(x) && x.every(function (r) { return r && typeof r === 'object' && r.id != null; }); }

  /* Three-way merge: keep everything the other users changed (remote),
     and lay this device's own changes (local vs base) on top. */
  function merge(base, local, remote) {
    if (remote === undefined || remote === null) return local;
    if (J(local) === J(base)) return remote;
    if (isPlain(local) && isPlain(remote)) {
      var b = isPlain(base) ? base : {}, out = Object.assign({}, remote), k;
      for (k in local) if (J(local[k]) !== J(b[k])) out[k] = isPlain(local[k]) && isPlain(remote[k]) ? merge(b[k], local[k], remote[k]) : local[k];
      for (k in b) if (!(k in local)) delete out[k];
      return out;
    }
    if (idArray(local) && idArray(remote) && (base == null || idArray(base))) {
      var bm = {}, res = remote.slice(), pos = {};
      (base || []).forEach(function (r) { bm[r.id] = r; });
      res.forEach(function (r, i) { pos[r.id] = i; });
      local.forEach(function (r) {
        var changed = !bm[r.id] || J(bm[r.id]) !== J(r);
        if (!changed) return;
        if (r.id in pos) res[pos[r.id]] = r; else { pos[r.id] = res.length; res.push(r); }
      });
      return res;
    }
    if (Array.isArray(local) && Array.isArray(remote)) {
      var seen = {}, mixed = [];
      local.concat(remote).forEach(function (r) { var s = J(r); if (!seen[s]) { seen[s] = 1; mixed.push(r); } });
      return mixed.slice(0, Math.max(local.length, remote.length));
    }
    return local;
  }

  function loadCache() {
    try { var raw = localStorage.getItem(STORE_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  var cacheTimer = null;
  function saveCache(state) {
    clearTimeout(cacheTimer);
    cacheTimer = setTimeout(function () {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(persistable(state))); } catch (e) { /* blocked */ }
    }, 150);
  }

  /* ---------------- cloud sync (office code) ---------------- */
  var cfg = window.LS_CONFIG || {};
  var cloud = !!(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);
  var CODE_KEY = 'legal-system-office-code';
  var client = null, channel = null, pollTimer = null;
  var sync = { status: cloud ? 'connecting' : 'local', email: '', error: '', ready: !cloud, needLogin: false, busy: false, copied: false };
  var base = {};            // last state known to be in the cloud, per key
  var pushTimer = null, pushing = false, pushAgain = false;
  var officeCode = '';

  function setSync(p) { Object.assign(sync, p); schedule(); }
  function readCode() {
    var m = (location.hash || '').match(/[#&]k=([^&]+)/);
    if (m) { var c = decodeURIComponent(m[1]); try { localStorage.setItem(CODE_KEY, c); } catch (e) {} return c; }
    try { return localStorage.getItem(CODE_KEY) || ''; } catch (e) { return ''; }
  }
  function roomName(text) {
    // short non-secret fingerprint of the office code, used only to pick the live-update channel
    var h1 = 0x811c9dc5, h2 = 0x01000193;
    for (var i = 0; i < text.length; i++) { var c = text.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619) >>> 0; h2 = Math.imul(h2 ^ c, 2246822519) >>> 0; }
    return 'ls-' + h1.toString(16) + h2.toString(16);
  }
  function makeClient(code) {
    return window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { 'x-office-key': code } }
    });
  }
  async function pullAll() {
    var r = await client.from(TABLE).select('key,value');
    if (r.error) throw r.error;
    var remote = {};
    (r.data || []).forEach(function (row) { remote[row.key] = row.value; });
    return remote;
  }
  function applyRemote(k, remote) {
    if (J(remote) === J(base[k])) return;
    var local = inst.state[k];
    var next = merge(base[k], local, remote);
    base[k] = clone(remote);
    if (J(next) !== J(local)) { var p = {}; p[k] = next; inst.state = Object.assign({}, inst.state, p); schedule(); }
    if (J(next) !== J(remote)) queuePush(400);
  }
  async function connect(code) {
    setSync({ needLogin: false, status: 'connecting', error: '', busy: true });
    try {
      client = makeClient(code);
      var ok = await client.rpc('office_check');
      if (ok.error) throw ok.error;
      if (ok.data !== true) {
        try { localStorage.removeItem(CODE_KEY); } catch (e) {}
        setSync({ needLogin: true, ready: false, busy: false, error: 'הקוד לא נכון. יש לבקש את קישור המשרד מחדש.' });
        return;
      }
      officeCode = code;
      try { localStorage.setItem(CODE_KEY, code); } catch (e) {}
      var remote = await pullAll();
      var local = syncable(inst.state), patch = {};
      Object.keys(remote).forEach(function (k) { patch[k] = remote[k]; base[k] = clone(remote[k]); });
      Object.keys(local).forEach(function (k) { if (!(k in remote)) delete base[k]; });
      inst.state = Object.assign({}, inst.state, patch);
      await subscribe(code);
      clearInterval(pollTimer);
      pollTimer = setInterval(function () { if (!pushing && document.visibilityState !== 'hidden') refresh(); }, 30000);
      setSync({ ready: true, status: 'synced', busy: false });
      queuePush(0);
    } catch (e) {
      setSync({ ready: true, status: 'error', busy: false, error: 'אין חיבור לענן: ' + String(e.message || e) });
      setTimeout(function () { if (sync.status === 'error') connect(code); }, 8000);
    }
  }
  async function refresh() {
    try { var remote = await pullAll(); Object.keys(remote).forEach(function (k) { applyRemote(k, remote[k]); }); if (sync.status === 'error') setSync({ status: 'synced', error: '' }); }
    catch (e) { setSync({ status: 'error', error: 'אין חיבור לענן' }); }
  }
  async function subscribe(code) {
    if (channel) client.removeChannel(channel);
    var room = roomName(code);
    channel = client.channel(room, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'changed' }, async function (msg) {
        var k = msg && msg.payload && msg.payload.key;
        if (!k) return;
        var r = await client.from(TABLE).select('value').eq('key', k).maybeSingle();
        if (!r.error && r.data) applyRemote(k, r.data.value);
      })
      .subscribe();
  }
  function dirtyKeys() {
    var cur = syncable(inst.state), out = [];
    Object.keys(cur).forEach(function (k) { if (J(cur[k]) !== J(base[k])) out.push(k); });
    return out;
  }
  function queuePush(delay) {
    if (!cloud || !sync.ready || sync.needLogin || !officeCode) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(pushNow, delay == null ? 600 : delay);
  }
  async function pushNow() {
    if (!client || !officeCode) return;
    if (pushing) { pushAgain = true; return; }
    var keys = dirtyKeys();
    if (!keys.length) { if (sync.status === 'saving') setSync({ status: 'synced' }); return; }
    pushing = true;
    setSync({ status: 'saving' });
    try {
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        var r = await client.from(TABLE).select('value').eq('key', k).maybeSingle();
        if (r.error) throw r.error;
        var remote = r.data ? r.data.value : undefined;
        var merged = merge(base[k], inst.state[k], remote);
        var w = await client.from(TABLE).upsert({ key: k, value: merged, updated_at: new Date().toISOString() });
        if (w.error) throw w.error;
        base[k] = clone(merged);
        if (J(merged) !== J(inst.state[k])) { var p = {}; p[k] = merged; inst.state = Object.assign({}, inst.state, p); }
        if (channel) channel.send({ type: 'broadcast', event: 'changed', payload: { key: k } });
      }
      pushing = false;
      setSync({ status: 'synced', error: '' });
      if (pushAgain || dirtyKeys().length) { pushAgain = false; queuePush(200); }
    } catch (e) {
      pushing = false;
      setSync({ status: 'error', error: 'השמירה בענן נכשלה, מנסה שוב…' });
      queuePush(5000);
    }
  }
  function login() {
    var c = ((document.getElementById('ls-code') || {}).value || '').trim();
    var m = c.match(/[#&]k=([^&\s]+)/);
    if (m) c = decodeURIComponent(m[1]);
    if (!c) { setSync({ error: 'יש להדביק את קישור המשרד או את הקוד' }); return; }
    connect(c);
  }
  async function logout() {
    await pushNow();
    if (channel && client) client.removeChannel(channel);
    channel = null; clearInterval(pollTimer);
    try { localStorage.removeItem(CODE_KEY); } catch (e) {}
    officeCode = ''; base = {};
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    setSync({ needLogin: true, ready: false, status: 'connecting', error: '' });
  }
  function shareLink() { return location.origin + location.pathname + '#k=' + encodeURIComponent(officeCode); }
  async function copyLink() {
    var link = shareLink();
    try { await navigator.clipboard.writeText(link); setSync({ copied: true }); setTimeout(function () { setSync({ copied: false }); }, 2500); }
    catch (e) { window.prompt('העתיקי את הקישור:', link); }
  }
  window.addEventListener('online', function () { if (officeCode) { refresh(); queuePush(300); } });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && officeCode && sync.ready) refresh(); });
  window.addEventListener('beforeunload', function (e) {
    if (cloud && sync.ready && officeCode && dirtyKeys().length) { pushNow(); e.preventDefault(); e.returnValue = ''; }
  });

  function syncVals() {
    var label = { local: 'שמירה במכשיר זה', connecting: 'מתחבר…', saving: 'שומר בענן…', synced: 'מסונכרן עם כל הצוות', error: 'אין חיבור לענן' }[sync.status];
    return {
      cloud: cloud, local: !cloud, ready: sync.ready, needLogin: sync.needLogin, showApp: sync.ready && !sync.needLogin,
      loading: cloud && !sync.ready && !sync.needLogin,
      status: sync.status, label: label, email: '', error: sync.error, hasError: !!sync.error, busy: sync.busy,
      dotCls: 'syncdot ' + sync.status, login: login, logout: logout, copyLink: copyLink,
      copyLabel: sync.copied ? 'הקישור הועתק ✓' : 'העתקת קישור לצוות',
      onKey: function (e) { if (e.key === 'Enter') login(); }
    };
  }

  /* ---------------- render loop ---------------- */
  var inst = null, root = null, mount = null, queued = false;
  function paint() {
    queued = false;
    var vals = inst.renderVals();
    vals.sync = syncVals();
    render(h(Fragment, null, kids(root, [vals])), mount);
    saveCache(inst.state);
    if (cloud && sync.ready && !sync.needLogin && !pushing && dirtyKeys().length) queuePush();
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
  window.DCLogic._merge = merge;

  window.bootApp = function (Component) {
    var raw = document.getElementById('tpl').textContent
      .replace(/<sc-(for|if)\b/g, '<template data-sc="$1"')
      .replace(/<\/sc-(for|if)>/g, '</template>');
    var t = document.createElement('template');
    t.innerHTML = raw;
    root = t.content;
    mount = document.getElementById('app');
    inst = new Component({});
    var cached = loadCache();
    if (cached) inst.state = Object.assign({}, inst.state, cached);
    if (cloud) {
      var code = readCode();
      if (code) connect(code); else sync.needLogin = true;
    }
    paint();
    if (inst.componentDidMount) inst.componentDidMount();
  };
})();
