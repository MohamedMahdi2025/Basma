// Settings saved from the administrator's screen: stored as text, HR keys validated. node tests/settings.js
const crypto = require('crypto');
const { load, Authenticator } = require('./harness');
let passed = 0, failed = 0;
function ok(c, name, extra) { if (c) { passed++; console.log('  ok  ' + name); } else { failed++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const B = load({ setupKeyHash: sha('k'), now: Date.parse('2026-10-04T06:00:00Z') });
const devs = {}, ids = {}, toks = {};
function tok(no, fresh) { if (toks[no] && !fresh) return toks[no]; const b = B.call({ action: 'authBegin', empNo: no }); return (toks[no] = B.call({ action: 'authFinish', credential: devs[no].get(b.options) }).token); }
function person(no, name, role) {
  const r = no === '1000' ? B.call({ action: 'bootstrap', setupKey: 'k', name, empNo: no }) : B.call({ action: 'empSave', token: tok('1000'), emp: { empNo: no, name, role } });
  devs[no] = new Authenticator(); const b = B.call({ action: 'enrollBegin', empNo: no, code: r.activationCode });
  const f = B.call({ action: 'enrollFinish', credential: devs[no].create(b.options) }); ids[no] = f.me.id; toks[no] = f.token;
}
function direct(fn) { B.ctx.USE_TAB_CACHE_ = false; B.ctx.TAB_PREFETCH_ = null; B.ctx.READ_MEMO_ = {}; const v = B.ctx.withLock_(fn); B.ctx.READ_MEMO_ = {}; return v; }
const save = (no, settings) => B.call({ action: 'settingsSave', token: tok(no), settings });
const fresh = () => B.ctx.CacheService.getScriptCache().remove('settings:v1');
const get = () => { fresh(); return B.call({ action: 'settingsGet', token: tok('3001') }).settings; };
/** The value as it sits in the Sheet after Sheets' own conversion (the harness mimics it). */
const cellRow = key => B.sheets.settings._rows.findIndex(r => r && r[0] === key);
const cell = key => { const i = cellRow(key); return i < 0 ? undefined : B.sheets.settings._rows[i][1]; };

person('1000', 'مدير النظام', 'admin');
person('3001', 'الموارد البشرية', 'hr');
let r;

console.log('Values are written as text');
r = save('3001', { wpsDueDay: 12 });
ok(!r.ok && r.error === 'forbidden', 'only the administrator saves settings', r);
r = save('1000', { summerBanFrom: '06-20', summerBanTo: '09-10', summerBanStart: '11:30', summerBanEnd: '15:30', shiftStart: '07:30', ramadanFrom: '2027-02-08', ramadanTo: '2027-03-09' });
ok(r.ok, 'the administrator saves dates, month-days and times', r);
ok(cell('summerBanFrom') === '06-20' && cell('summerBanTo') === '09-10', 'a month-day is stored as the text 06-20, not turned into a date', [cell('summerBanFrom'), cell('summerBanTo')]);
ok(cell('shiftStart') === '07:30' && cell('summerBanStart') === '11:30', 'a time is stored as the text 07:30', cell('shiftStart'));
ok(cell('ramadanFrom') === '2027-02-08' && cell('workdays') === '0,1,2,3,4', 'a date and the work days stay text too', [cell('ramadanFrom'), cell('workdays')]);
ok(cell('wpsDueDay') === 10 && cell('allowDesktop') === true, 'numbers and true/false keep their type', [cell('wpsDueDay'), cell('allowDesktop')]);
let s = get();
ok(s.summerBanFrom === '06-20' && s.summerBanTo === '09-10' && s.summerBanStart === '11:30' && s.shiftStart === '07:30' && s.ramadanFrom === '2027-02-08' && s.ramadanTo === '2027-03-09',
  'every value reads back exactly as saved', s);
// What the old raw write did: Sheets turns "06-15" into a date. The reader repairs such cells.
B.sheets.settings.getRange(cellRow('summerBanTo') + 1, 2, 1, 1).setValues([['06-15']]);
ok(cell('summerBanTo') instanceof Date, 'a raw write of 06-15 comes back from the Sheet as a date (the harness mimics Sheets)', cell('summerBanTo'));
ok(get().summerBanTo === '06-15', 'a month-day already turned into a date is read back as 06-15');
ok(save('1000', { summerBanTo: '09-15' }).ok && cell('summerBanTo') === '09-15', 'and the next save writes it as text again');

console.log('HR and payroll settings from the settings screen');
r = save('1000', { saudizationTarget: 32.5, rostersEnabled: true, ramadanHours: 5.5, deductAbsence: true, deductLateMinutes: false, payOvertimeFromAttendance: true,
  eosWageBasis: 'basic_housing', wpsDueDay: 12, refPrefixes: { leave: 'vac' } });
ok(r.ok, 'every HR key is accepted when valid', r);
s = get();
ok(s.saudizationTarget === '32.5' && s.rostersEnabled === true && s.ramadanHours === 5.5 && s.deductAbsence === true && s.deductLateMinutes === false &&
  s.payOvertimeFromAttendance === true && s.eosWageBasis === 'basic_housing' && s.wpsDueDay === 12 && s.refPrefixes === '{"leave":"VAC"}', 'and reads back typed', s);
ok(direct(() => B.ctx.refPrefix_('leave')) === 'VAC', 'the renamed prefix is used for new numbers');
ok(direct(() => B.ctx.wpsDue_('2026-10', B.ctx.settings_())) === '2026-11-12', 'the WPS due day moves to the 12th');
const day = direct(() => B.ctx.adjustShift_({ id: 'nobody' }, { start: '08:00', end: '17:00', workdays: [0, 1, 2, 3, 4], grace: 15 }, B.ctx.settings_(), '2027-02-10'));
ok(day.end === '13:30' && day.ramadan, 'Ramadan 5.5 hours: an 08:00 shift ends at 13:30', day);
ok(save('1000', { allowDesktop: false }).ok, 'a later save of the attendance part');
s = get();
ok(s.wpsDueDay === 12 && s.refPrefixes === '{"leave":"VAC"}' && s.summerBanFrom === '06-20' && s.allowDesktop === false, 'keeps every HR value', s);
save('1000', { allowDesktop: true });
r = save('1000', { saudizationTarget: '', refPrefixes: '', ramadanFrom: '', ramadanTo: '' });
s = get();
ok(r.ok && s.saudizationTarget === '' && s.refPrefixes === '' && s.ramadanFrom === '' && s.ramadanTo === '', 'empty clears the target, the prefixes and the Ramadan dates', s);

console.log('Validation');
const before = JSON.stringify(get());
const bad = [
  [{ wpsDueDay: 29 }, 'wpsDueDay', 'the WPS day is 1 to 28'],
  [{ wpsDueDay: 2.5 }, 'wpsDueDay', 'a whole day'],
  [{ ramadanHours: 7 }, 'ramadanHours', 'Ramadan hours are at most 6 (Art. 98)'],
  [{ ramadanHours: 5.25 }, 'ramadanHours', 'in half hours'],
  [{ ramadanFrom: '2027-2-8', ramadanTo: '2027-03-09' }, 'ramadanFrom', 'dates are YYYY-MM-DD'],
  [{ ramadanFrom: '2027-02-30', ramadanTo: '2027-03-09' }, 'ramadanFrom', 'and real dates'],
  [{ ramadanFrom: '2027-02-08' }, 'ramadanTo', 'both Ramadan dates or neither'],
  [{ ramadanFrom: '2027-03-09', ramadanTo: '2027-02-08' }, 'ramadanTo', 'the end is not before the start'],
  [{ ramadanFrom: '2027-01-01', ramadanTo: '2027-03-09' }, 'ramadanTo', 'one Ramadan: at most 31 days'],
  [{ summerBanFrom: '13-01' }, 'summerBanFrom', 'a month-day is MM-DD with a real month'],
  [{ summerBanFrom: '02-30' }, 'summerBanFrom', 'and a real day'],
  [{ summerBanFrom: '6-15' }, 'summerBanFrom', 'two digits each'],
  [{ summerBanFrom: '10-01' }, 'summerBanTo', 'the season ends after it starts'],
  [{ summerBanStart: '25:00' }, 'summerBanStart', 'times are HH:MM'],
  [{ summerBanStart: '15:00', summerBanEnd: '12:00' }, 'summerBanEnd', 'the ban ends after it starts'],
  [{ saudizationTarget: 120 }, 'saudizationTarget', 'the Saudization target is 0 to 100'],
  [{ saudizationTarget: 'abc' }, 'saudizationTarget', 'and a number'],
  [{ eosWageBasis: 'basic' }, 'eosWageBasis', 'the EOS wage is total or basic_housing'],
  [{ rostersEnabled: 'yes' }, 'rostersEnabled', 'switches are true or false'],
  [{ deductAbsence: 1 }, 'deductAbsence', 'not 1 or 0'],
  [{ refPrefixes: '{bad' }, 'refPrefixes', 'prefixes are JSON'],
  [{ refPrefixes: ['LV'] }, 'refPrefixes', 'an object, not a list'],
  [{ refPrefixes: { unknown: 'X' } }, 'refPrefixes', 'of known kinds only'],
  [{ refPrefixes: { leave: 'TOOLONG' } }, 'refPrefixes', 'of 1 to 6 letters or digits'],
  [{ refPrefixes: { leave: 'LT' } }, 'refPrefixes', 'and never the prefix of another kind (LT is the letters)'],
  [{ wpsDueDay: 15, ramadanHours: 9 }, 'ramadanHours', 'one bad value refuses the whole save']
];
bad.forEach(([settings, key, name]) => { r = save('1000', settings); ok(!r.ok && r.error === 'bad_setting' && r.key === key, name + ' (bad_setting, ' + key + ')', r); });
ok(JSON.stringify(get()) === before, 'a refused save changes nothing', get());
r = save('1000', { shiftStart: '8am' });
ok(!r.ok && r.error === 'bad_time', 'the attendance keys keep their own errors', r);
ok(B.call({ action: 'auditList', token: tok('1000') }).rows.some(a => a.action === 'settings_save'), 'every save is in the audit trail');

console.log('\nCompany profile (white-label)');
let me = B.call({ action: 'me', token: tok('3001') });
ok(me.ok && me.company && me.company.nameAr === 'شركة الناقل الأفضل للغاز' && me.company.nameEn === 'Best Gas Carrier Co.', 'out of the box the profile is Best Gas, sent with the home screen', me.company);
r = save('1000', { companyNameAr: '  شركة   التجربة   المحدودة ', companyNameEn: 'Trial Trading Co.', companyShortAr: 'التجربة', companyShortEn: 'Trial', companyCr: '1010123456', companyVat: '300123456700003',
  companyAddressAr: 'الرياض، حي العليا', companyAddressEn: 'Olaya, Riyadh' });
ok(r.ok, 'the administrator sets another company name, CR, VAT and address', r);
fresh(); me = B.call({ action: 'me', token: tok('3001') });
ok(me.company.nameAr === 'شركة التجربة المحدودة' && me.company.shortEn === 'Trial' && me.company.cr === '1010123456' && me.company.vat === '300123456700003',
  'every screen gets the new profile, spaces tidied', me.company);
ok(cell('companyCr') === '1010123456' && cell('companyVat') === '300123456700003', 'CR and VAT are stored as text, not as numbers', [cell('companyCr'), cell('companyVat')]);
r = save('1000', { companyCr: '', companyVat: '' });
ok(r.ok && get().companyCr === '' && get().companyVat === '', 'CR and VAT may be left empty', r);
[[{ companyNameAr: 'ش' }, 'companyNameAr', 'a company name has at least 2 letters'], [{ companyNameEn: 'X'.repeat(81) }, 'companyNameEn', 'and at most 80'],
  [{ companyShortAr: '' }, 'companyShortAr', 'the short name is required'], [{ companyNameEn: 'Acme <b>Co</b>' }, 'companyNameEn', 'no markup in a name'],
  [{ companyCr: '12345' }, 'companyCr', 'a CR is 10 digits'], [{ companyVat: '123456789012345' }, 'companyVat', 'a VAT number starts and ends with 3 (15 digits)'],
  [{ companyAddressAr: 'ع'.repeat(201) }, 'companyAddressAr', 'an address is at most 200 characters']]
  .forEach(([settings, key, name]) => { r = save('1000', settings); ok(!r.ok && r.error === 'bad_setting' && r.key === key, name + ' (bad_setting, ' + key + ')', r); });
r = save('3001', { companyNameAr: 'شركة أخرى' });
ok(!r.ok && r.error === 'forbidden', 'only the administrator changes the company profile', r);

console.log('\nThe administrator and pay (adminSeesPay)');
person('3002', 'موظف بالراتب', 'employee');
r = B.call({ action: 'hrCompList', token: tok('1000') });
ok(r.ok, 'by default the administrator manages salaries (lists packages)', r);
r = B.call({ action: 'myFile', token: tok('1000') });
ok(r.ok && r.file.roles.payroll === true, 'and holds the payroll role in the app, so the pay pages show', r.ok && r.file.roles);
r = save('1000', { adminSeesPay: false });
ok(r.ok && get().adminSeesPay === false, 'the company can keep pay apart from system administration', r);
r = B.call({ action: 'hrCompList', token: tok('1000') });
ok(!r.ok && r.error === 'forbidden', 'then the administrator alone is refused salaries', r);
r = B.call({ action: 'hrRolesSave', token: tok('1000'), id: ids['1000'], extraRoles: 'payroll' });
ok(!r.ok && r.error === 'cannot_change_own_roles', 'and still cannot grant the payroll role to himself', r);
r = save('1000', { adminSeesPay: true });
ok(r.ok && B.call({ action: 'hrCompList', token: tok('1000') }).ok, 'switching it back restores the access', r);

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
