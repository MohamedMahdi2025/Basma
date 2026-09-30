// Preview-only stand-ins, injected by tests/preview-server.js on localhost.
// A software passkey (WebCrypto P-256, same format a phone's Face ID
// returns) and a GPS that sits inside HQ. Add ?far=1 to stand 1.3 km away.
(function () {
  var enc = new TextEncoder();
  function b64u(buf) { var u = new Uint8Array(buf), s = ''; for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function unb64u(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function cat() { var n = 0, a = arguments; for (var i = 0; i < a.length; i++) n += a[i].length; var o = new Uint8Array(n), p = 0; for (i = 0; i < a.length; i++) { o.set(a[i], p); p += a[i].length; } return o; }
  function head(mt, n) { return n < 24 ? new Uint8Array([(mt << 5) | n]) : n < 256 ? new Uint8Array([(mt << 5) | 24, n]) : new Uint8Array([(mt << 5) | 25, n >> 8, n & 255]); }
  function cb(v) {
    if (v instanceof Uint8Array) return cat(head(2, v.length), v);
    if (typeof v === 'number') return v >= 0 ? head(0, v) : head(1, -1 - v);
    if (typeof v === 'string') { var s = enc.encode(v); return cat(head(3, s.length), s); }
    var parts = [head(5, v.length)]; v.forEach(function (kv) { parts.push(cb(kv[0]), cb(kv[1])); }); return cat.apply(null, parts);
  }
  function der(raw) {
    function int(b) { var i = 0; while (i < b.length - 1 && b[i] === 0) i++; b = b.slice(i); if (b[0] & 0x80) b = cat(new Uint8Array([0]), b); return cat(new Uint8Array([2, b.length]), b); }
    var r = int(raw.slice(0, 32)), s = int(raw.slice(32)); return cat(new Uint8Array([0x30, r.length + s.length]), r, s);
  }
  var sha = function (b) { return crypto.subtle.digest('SHA-256', b).then(function (h) { return new Uint8Array(h); }); };
  var count = Number(localStorage.getItem('shim.count') || 0);

  function authData(rpId, attested) {
    return sha(enc.encode(rpId)).then(function (h) {
      count++; localStorage.setItem('shim.count', count);
      var c = new Uint8Array([count >>> 24, (count >> 16) & 255, (count >> 8) & 255, count & 255]);
      return cat(h, new Uint8Array([attested ? 0x45 : 0x05]), c, attested || new Uint8Array(0));
    });
  }
  function simulatePrompt() { return new Promise(function (r) { setTimeout(r, 450); }); }

  var fake = {
    create: function (o) {
      var pk = o.publicKey, credId = crypto.getRandomValues(new Uint8Array(16)), kp;
      return simulatePrompt().then(function () { return crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']); })
        .then(function (k) { kp = k; return Promise.all([crypto.subtle.exportKey('jwk', k.privateKey), crypto.subtle.exportKey('jwk', k.publicKey)]); })
        .then(function (j) {
          localStorage.setItem('shim.key', JSON.stringify({ id: b64u(credId), jwk: j[0] }));
          var cose = cb([[1, 2], [3, -7], [-1, 1], [-2, unb64u(j[1].x)], [-3, unb64u(j[1].y)]]);
          var att = cat(new Uint8Array(16), new Uint8Array([0, 16]), credId, cose);
          return authData(pk.rp.id, att);
        }).then(function (ad) {
          var cd = enc.encode(JSON.stringify({ type: 'webauthn.create', challenge: b64u(pk.challenge), origin: location.origin }));
          var ao = cb([['fmt', 'none'], ['attStmt', []], ['authData', ad]]);
          return { id: b64u(credId), rawId: credId.buffer, type: 'public-key', response: { clientDataJSON: cd.buffer, attestationObject: ao.buffer } };
        });
    },
    get: function (o) {
      var pk = o.publicKey, saved = JSON.parse(localStorage.getItem('shim.key') || 'null');
      if (!saved) return Promise.reject(Object.assign(new Error('no key'), { name: 'NotAllowedError' }));
      var cd = enc.encode(JSON.stringify({ type: 'webauthn.get', challenge: b64u(pk.challenge), origin: location.origin })), ad, key;
      return simulatePrompt().then(function () { return crypto.subtle.importKey('jwk', saved.jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']); })
        .then(function (k) { key = k; return authData(pk.rpId, null); })
        .then(function (a) { ad = a; return sha(cd); })
        .then(function (h) { return crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, cat(ad, h)); })
        .then(function (sig) {
          return { id: saved.id, rawId: unb64u(saved.id).buffer, type: 'public-key', response: { clientDataJSON: cd.buffer, authenticatorData: ad.buffer, signature: der(new Uint8Array(sig)).buffer } };
        });
    }
  };
  // ?old=1 behaves like an older phone with no Face ID / fingerprint.
  var old = /[?&]old=1/.test(location.search);
  if (!old) {
    try { Object.defineProperty(navigator, 'credentials', { value: fake, configurable: true }); } catch (e) {}
    if (!window.PublicKeyCredential) window.PublicKeyCredential = function () {};
    window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable = function () { return Promise.resolve(true); };
  } else if (window.PublicKeyCredential) {
    window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable = function () { return Promise.resolve(false); };
  }

  var far = /[?&]far=1/.test(location.search);
  var HQ = { lat: 24.7136, lng: 46.6753 };
  var geo = {
    watchPosition: function (ok) {
      function emit() {
        var j = function () { return (Math.random() - 0.5) * 0.00008; };
        var off = far ? 0.0118 : 0.00026;
        ok({ coords: { latitude: HQ.lat + off + j(), longitude: HQ.lng + (far ? 0.0021 : 0.00012) + j(), accuracy: 9 + Math.random() * 6 }, timestamp: Date.now() });
      }
      emit(); return setInterval(emit, 2500);
    },
    clearWatch: function (id) { clearInterval(id); },
    getCurrentPosition: function (ok) { ok({ coords: { latitude: HQ.lat, longitude: HQ.lng, accuracy: 8 }, timestamp: Date.now() }); }
  };
  try { Object.defineProperty(navigator, 'geolocation', { value: geo, configurable: true }); } catch (e) {}
})();
