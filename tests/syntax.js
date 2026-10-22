// Every client script must parse: the inline script of index.html and every js/*.js (a broken quote blanks the whole app).
const fs = require('fs'), path = require('path'), vm = require('vm');
let passed = 0, failed = 0;
const check = (name, code) => { try { new vm.Script(code, { filename: name }); passed++; console.log('  ok  ' + name); } catch (e) { failed++; console.log('  FAIL ' + name + '  -> ' + e.stack.split('\n')[0] + ' ' + e.message); } };
const root = path.join(__dirname, '..'), html = fs.readFileSync(path.join(root, 'index.html'), 'utf8'), re = /<script>([\s\S]*?)<\/script>/g;
let m, i = 0; while ((m = re.exec(html))) check('index.html script ' + (++i), m[1]);
fs.readdirSync(path.join(root, 'js')).filter(f => f.endsWith('.js')).forEach(f => check('js/' + f, fs.readFileSync(path.join(root, 'js', f), 'utf8')));
console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
