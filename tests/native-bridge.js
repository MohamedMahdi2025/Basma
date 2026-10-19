// The native wrapper bridge in index.html (BGNative, native geolocation) against a fake Capacitor: node tests/native-bridge.js
const fs = require('fs'), vm = require('vm');
const src = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8');
const a = src.indexOf('(function(){\n  var C = window.Capacitor;'), b = src.indexOf('})();', a) + 5;
const code = src.slice(a, b).replace(/\r/g, '');
let opened = null, watches = 0, cleared = [];
const G = {
  getCurrentPosition: o => Promise.reject(new Error('Location permission was denied')),
  watchPosition: (o, cb) => { watches++; setTimeout(() => cb({ coords: { latitude: 24.7, longitude: 46.6, accuracy: 12 }, timestamp: 5 }), 10); return Promise.resolve('cb' + watches); },
  clearWatch: o => { cleared.push(o.id); }
};
const NS = { openIOS: o => { opened = 'ios:' + o.option; }, openAndroid: o => { opened = 'android:' + o.option; } };
const navigator = {};
const window = { Capacitor: { isNativePlatform: () => true, getPlatform: () => 'ios', Plugins: { Geolocation: G, NativeSettings: NS } } };
vm.runInNewContext(code, { window, navigator, Object, String, Date, setTimeout });
let ok = 0, bad = 0; const t = (c, n) => { if (c) { ok++; console.log('  ok  ' + n); } else { bad++; console.log('  FAIL ' + n); } };
window.BGNative.openSettings(); t(opened === 'ios:app', 'one tap opens the app page in iPhone Settings');
navigator.geolocation.getCurrentPosition(() => {}, e => t(e.code === 1, 'a native refusal reaches the page as error code 1 (blocked)'));
const id = navigator.geolocation.watchPosition(p => {
  t(p.coords.accuracy === 12 && p.timestamp === 5, 'native positions reach the page in the browser shape');
  setTimeout(() => { navigator.geolocation.clearWatch(id); t(cleared[0] === 'cb1', 'stopping the watch stops the native one');
    const id2 = navigator.geolocation.watchPosition(() => {}); navigator.geolocation.clearWatch(id2);
    setTimeout(() => { t(cleared.indexOf('cb2') >= 0, 'a watch stopped before the native side answered is still stopped'); console.log('\n' + ok + ' passed, ' + bad + ' failed'); }, 20);
  }, 20);
}, () => {});
