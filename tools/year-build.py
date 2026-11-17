"""Builds the sheetYear payload from tools/salary-sheets2.py output.

    python -I tools/year-build.py <Salaries folder>

Reads _import/year.json (parsed months) and _import/numbers.csv (employee numbers already given), and the January workbook
for its rows without a usable ID. Writes _import/year-payload.json and prints what needs a person's eye:
- January rows with no 10-digit ID (or an ID already used by someone else in the month) are matched to a person by name
  only when exactly one person in the other months has that name; the rest are listed and not loaded.
- People: master fields from the latest full month they appear in; employee number kept when known, else the next free
  number from 1001 up by joining date.
"""
import sys, re, json, os, csv, glob
import openpyxl
sys.stdout.reconfigure(encoding='utf-8')
folder = sys.argv[1]
Y = json.load(open(os.path.join(folder, '_import/year.json'), encoding='utf-8'))
months = Y['months']
NET_ONLY = ['2026-10']


def norm(s):
    s = re.sub(r'\s+', ' ', str(s or '')).strip().lower()
    return s.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا').replace('ى', 'ي').replace('ة', 'ه')


numbers = {}
with open(os.path.join(folder, '_import/numbers.csv'), encoding='utf-8-sig') as fh:
    for r in csv.DictReader(fh): numbers[r['nationalId']] = r['empNo']

# names seen in months other than January -> IDs
names = {}
for m, ls in months.items():
    if m == '2026-01': continue
    for x in ls:
        for nm in (x.get('name'), x.get('nameEn')):
            if nm: names.setdefault(norm(nm), set()).add(x['nid'])


def by_name(*cands):
    hits = set()
    for nm in cands:
        k = norm(nm)
        if len(k) < 4: continue
        for key, ids in names.items():
            if k == key or (len(k) >= 8 and (k in key or key in k)): hits |= ids
    return hits


# January rows the parser could not take (no ID, or an ID that belongs to someone else)
jan_file = glob.glob(os.path.join(folder, 'January Salaries 2026*.xlsx'))[0]
ws = openpyxl.load_workbook(jan_file, data_only=True, read_only=True)['Total Salaries']
jan_ids = {x['nid'] for x in months['2026-01']}
matched, unmatched = [], []
for i, r in enumerate(ws.iter_rows(min_row=5, max_row=400, values_only=True), 5):
    if not r or not any(v not in (None, '') for v in r[:17]): continue
    rid = str(r[8] if r[8] is not None else '').strip()
    first = [x for x in months['2026-01'] if x['row'] == i]
    if first: continue  # already parsed
    hits = by_name(r[1], r[2]) - jan_ids
    num = lambda v: round(float(v or 0), 2) if isinstance(v, (int, float)) else 0.0
    line = {'nid': None, 'row': i, 'tab': 'Total Salaries', 'name': str(r[1] or '').strip(), 'nameEn': str(r[2] or '').strip(), 'position': str(r[5] or '').strip(),
            'sponsor': str(r[6] or '').strip(), 'costCenter': str(r[7] or '').strip(), 'basic': num(r[9]), 'housing': num(r[10]), 'transport': num(r[11]),
            'otherAllow': num(r[12]), 'bonus': 0.0, 'gross': num(r[13]), 'gosi': num(r[14]), 'otherDed': num(r[15]), 'totalDed': round(num(r[14]) + num(r[15]), 2),
            'net': num(r[16]), 'payMethod': str(r[17] or '').strip(), 'traffic': 0.0, 'penalties': 0.0, 'loan': 0.0, 'leave': 0.0, 'newJoiner': 0.0}
    if len(hits) == 1:
        line['nid'] = hits.pop(); line['matchedByName'] = True; months['2026-01'].append(line); jan_ids.add(line['nid']); matched.append((i, line['name'] or line['nameEn'], rid, line['nid'], line['net']))
    else:
        unmatched.append((i, line['name'] or line['nameEn'], rid, line['net'], len(hits)))

# people
full = [m for m in sorted(months) if m not in NET_ONLY]
people = {}
for m in sorted(months):
    for x in months[m]:
        p = people.setdefault(x['nid'], {'nid': x['nid'], 'months': []})
        p['months'].append(m)
        if m in NET_ONLY:
            if not p.get('name'): p['name'] = x.get('name', '')
            continue
        for k in ('name', 'nameEn', 'nationality', 'department', 'position', 'sponsor', 'costCenter', 'reliability', 'payMethod', 'bank', 'iban'):
            if x.get(k): p[k] = x[k]
        if x.get('joined'): p['joined'] = x['joined']
for p in people.values():
    p['isSaudi'] = p.get('nationality') == 'سعودي' or p.get('reliability') == 'Saudi' or str(p['nid']).startswith('1')
    p['ibanOk'] = bool(re.fullmatch(r'SA\d{22}', p.get('iban') or ''))
    p['payToOther'] = (p.get('payMethod') or '').lower().startswith('transfer to')
used = set(numbers.values()); nxt = max([int(n) for n in used if n.isdigit()] + [1000]) + 1
new = sorted([p for p in people.values() if p['nid'] not in numbers], key=lambda p: (0 if p.get('joined') else 1, p.get('joined') or '', p.get('name') or '', p['nid']))
for p in people.values():
    if p['nid'] in numbers: p['empNo'] = numbers[p['nid']]
for p in new:
    p['empNo'] = str(nxt); nxt += 1
missing_old = [n for n in numbers if n not in people]
payload = {'people': list(people.values()), 'months': months, 'netOnly': NET_ONLY}
json.dump(payload, open(os.path.join(folder, '_import/year-payload.json'), 'w', encoding='utf-8'), ensure_ascii=False)
with open(os.path.join(folder, '_import/numbers-year.csv'), 'w', encoding='utf-8-sig') as fh:
    fh.write('empNo,nationalId,name,joined,sponsor,new\n')
    for p in sorted(people.values(), key=lambda p: int(p['empNo'])):
        fh.write('%s,%s,"%s",%s,"%s",%s\n' % (p['empNo'], p['nid'], (p.get('name') or '').replace('"', "'"), p.get('joined') or '', (p.get('sponsor') or '').replace('"', "'"), 'yes' if p['nid'] not in numbers else ''))
print('people', len(people), 'already numbered', len(people) - len(new), 'new', len(new), 'numbers', new[0]['empNo'] if new else '-', '..', new[-1]['empNo'] if new else '-')
print('numbered before but in none of the sheets', len(missing_old))
print('January matched by name', len(matched)); [print('  ', x) for x in matched]
print('January NOT loaded (no ID, no unique name match)', len(unmatched), 'net', round(sum(x[3] for x in unmatched), 2)); [print('  ', x) for x in unmatched]
for m in sorted(months): print(m, len(months[m]), 'net', round(sum(x['net'] for x in months[m]), 2))
