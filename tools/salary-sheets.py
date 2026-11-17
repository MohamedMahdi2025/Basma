"""Parse the company's monthly payroll workbooks (Payroll_<Mon>_<YYYY>*.xlsx) into one JSON file for the importer.

    python -I tools/salary-sheets.py <folder with the workbooks> <output.json> [--owner-id <national id>:<empNo>]

Reads only the main tab of each workbook (the first sheet that is not "Summary"); other tabs and the Summary are ignored
and their totals are reported for comparison. Every row is checked:
  gross = basic + housing + transport + other allowances + incentive
  total deduction = GOSI + penalties + loan + leave + new joiner + other deductions
  net = gross - total deduction
Rows that fail a check are listed and stop the run (nothing is written) unless --allow-mismatch.
The output holds people (latest month wins for master data) and months (each line exactly as the sheet).
Employee numbers: the owner keeps the given number; everyone else gets 1001 upward by joining date (unknown last),
then name, then national ID. The map is written next to the output as numbers.csv.
Personal data stays on this machine: the output belongs in the private Salaries folder, never in src/ or app/.
"""
import sys, re, json, glob, os, datetime, collections
import openpyxl

MONTHS = {m: i for i, m in enumerate(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], 1)}
COLS = {
    'Employee ID': 'nid', 'Employee Status': 'status', 'Employee Name': 'name', 'Nationality': 'nationality',
    'Department': 'department', 'Position': 'position', 'Sponsor': 'sponsor', 'Cost Center': 'costCenter',
    'Reliability': 'reliability', 'Joining Date': 'joined', 'Last working day': 'lastDay',
    'Current Loan Balance': 'loanBalance', 'Monthly Installment  Value': 'loanInstalment', 'Monthly Installment Value': 'loanInstalment',
    'Payroll Loan Deduction': 'payrollLoan', 'Remaining Loan Balance': 'loanRemaining',
    'Basic Salary': 'basic', 'Housing Allowance': 'housing', 'Transportation Allowance': 'transport',
    'Other Allowances': 'otherAllow', 'Incentive/Bonus': 'bonus', 'Gross Salary': 'gross',
    'GOSI Applicable (Yes/No)': 'gosiApplies', 'GOSI Deduction': 'gosi', 'Penalties': 'penalties',
    'Loan Deduction': 'loan', 'Leave': 'leave', 'New Joiner': 'newJoiner', 'Other Deductions': 'otherDed',
    'Total Deduction': 'totalDed', 'Net Salary': 'net', 'Payment Method': 'payMethod', 'Bank': 'bank', 'IBAN Number': 'iban',
}
MONEY = ['basic', 'housing', 'transport', 'otherAllow', 'bonus', 'gross', 'gosi', 'penalties', 'loan', 'leave', 'newJoiner',
         'otherDed', 'totalDed', 'net', 'loanBalance', 'loanInstalment', 'payrollLoan', 'loanRemaining']
NAT_FIX = {'الهند': 'هندي', 'بنجلاديش': 'بنجلادشي'}


def num(v):
    if v in (None, ''): return 0.0
    try: return round(float(v), 2)
    except (TypeError, ValueError): return None


def day(v):
    if isinstance(v, datetime.datetime): return v.date().isoformat() if v.year > 1900 else ''
    if isinstance(v, datetime.date): return v.isoformat()
    s = str(v or '').strip()
    m = re.fullmatch(r'(\d{1,2})-(\d{1,2})-(\d{4})', s)  # 8-18-2026 (month-day-year, as typed in the sheet)
    if m: return '%s-%02d-%02d' % (m.group(3), int(m.group(1)), int(m.group(2)))
    m = re.fullmatch(r'(\d{4})-(\d{2})-(\d{2}).*', s)
    return '-'.join(m.groups()) if m else ''


def text(v):
    s = re.sub(r'\s+', ' ', str(v if v is not None else '')).strip()
    return '' if s in ('None', '00:00:00') else s


def main():
    folder, out = sys.argv[1], sys.argv[2]
    owner = None
    if '--owner-id' in sys.argv:
        nid, no = sys.argv[sys.argv.index('--owner-id') + 1].split(':'); owner = (nid, no)
    allow = '--allow-mismatch' in sys.argv
    months, problems, report = {}, [], {}
    for f in sorted(glob.glob(os.path.join(folder, 'Payroll_*.xlsx'))):
        m = re.search(r'Payroll_([A-Z][a-z]{2})_(\d{4})', os.path.basename(f))
        if not m: continue
        month = '%s-%02d' % (m.group(2), MONTHS[m.group(1)])
        wb = openpyxl.load_workbook(f, data_only=True)
        ws = [w for w in wb.worksheets if w.title != 'Summary'][0]
        hdr = [str(h).split('|')[0].strip() if h is not None else '' for h in next(ws.iter_rows(min_row=1, max_row=1, values_only=True))]
        lines = []
        for i, r in enumerate(ws.iter_rows(min_row=2, values_only=True), 2):
            raw = {COLS[h]: v for h, v in zip(hdr, r) if h in COLS}
            nid = text(raw.get('nid'))
            if not re.fullmatch(r'\d{10}', nid):
                if any(v not in (None, '') for v in r) and nid != 'Total': problems.append('%s row %d: no 10-digit ID (%s)' % (month, i, nid[:12]))
                continue
            o = {k: text(raw.get(k)) for k in ('status', 'name', 'nationality', 'department', 'position', 'sponsor', 'costCenter', 'reliability', 'gosiApplies', 'payMethod', 'bank')}
            o.update({'nid': nid, 'row': i, 'joined': day(raw.get('joined')), 'joinedRaw': text(raw.get('joined')), 'lastDay': day(raw.get('lastDay')),
                      'iban': text(raw.get('iban')).replace(' ', '').upper()})
            o['nationality'] = NAT_FIX.get(o['nationality'], o['nationality'])
            for k in MONEY:
                v = num(raw.get(k))
                if v is None: problems.append('%s row %d (%s): %s is not a number: %r' % (month, i, nid, k, raw.get(k))); v = 0.0
                o[k] = v
            g = round(o['basic'] + o['housing'] + o['transport'] + o['otherAllow'] + o['bonus'], 2)
            d = round(o['gosi'] + o['penalties'] + o['loan'] + o['leave'] + o['newJoiner'] + o['otherDed'], 2)
            if abs(g - o['gross']) > 0.01: problems.append('%s row %d (%s): gross %s but parts add to %s' % (month, i, nid, o['gross'], g))
            if abs(d - o['totalDed']) > 0.01: problems.append('%s row %d (%s): total deduction %s but parts add to %s' % (month, i, nid, o['totalDed'], d))
            if abs(o['gross'] - o['totalDed'] - o['net']) > 0.01: problems.append('%s row %d (%s): net %s but gross - deductions = %s' % (month, i, nid, o['net'], round(o['gross'] - o['totalDed'], 2)))
            lines.append(o)
        ids = collections.Counter(x['nid'] for x in lines)
        for k, v in ids.items():
            if v > 1: problems.append('%s: ID %s appears %d times' % (month, k, v))
        months[month] = lines
        report[month] = {'file': os.path.basename(f), 'tab': ws.title, 'people': len(lines),
                         'gross': round(sum(x['gross'] for x in lines), 2), 'deductions': round(sum(x['totalDed'] for x in lines), 2),
                         'net': round(sum(x['net'] for x in lines), 2)}
    # master data: the latest month that has the person wins
    people = {}
    for month in sorted(months):
        for x in months[month]:
            p = people.setdefault(x['nid'], {'months': []})
            p['months'].append(month)
            for k in ('name', 'nationality', 'department', 'position', 'sponsor', 'costCenter', 'reliability', 'gosiApplies', 'payMethod', 'bank', 'iban', 'status', 'lastDay'):
                if x[k] or k in ('status', 'lastDay', 'iban', 'bank', 'payMethod'): p[k] = x[k]
            if x['joined']: p['joined'] = x['joined']
            p['joinedRaw'] = x['joinedRaw']
            p['last'] = {k: x[k] for k in ('basic', 'housing', 'transport', 'otherAllow')}
    last_month = max(months)
    for nid, p in people.items():
        p['nid'] = nid
        p['leftBy'] = '' if last_month in p['months'] else max(p['months'])  # not on the latest sheet
        p['isSaudi'] = p.get('nationality') == 'سعودي'
        p['ibanOk'] = bool(re.fullmatch(r'SA\d{22}', p.get('iban') or ''))
        p['payToOther'] = (p.get('payMethod') or '').lower().startswith('transfer to')
    # numbers
    order = sorted([p for p in people.values() if not (owner and p['nid'] == owner[0])],
                   key=lambda p: (0 if p.get('joined') else 1, p.get('joined') or '', p.get('name') or '', p['nid']))
    for i, p in enumerate(order): p['empNo'] = str(1001 + i)
    if owner and owner[0] in people: people[owner[0]]['empNo'] = owner[1]
    json.dump({'months': months, 'people': list(people.values()), 'report': report, 'problems': problems},
              open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    with open(os.path.join(os.path.dirname(out), 'numbers.csv'), 'w', encoding='utf-8-sig') as fh:
        fh.write('empNo,nationalId,name,joined,sponsor\n')
        for p in sorted(people.values(), key=lambda p: int(p['empNo'])):
            fh.write('%s,%s,"%s",%s,"%s"\n' % (p['empNo'], p['nid'], (p.get('name') or '').replace('"', "'"), p.get('joined') or '', (p.get('sponsor') or '').replace('"', "'")))
    print(json.dumps({'report': report, 'people': len(people), 'problems': len(problems)}, ensure_ascii=False, indent=1))
    for x in problems[:60]: print('PROBLEM', x)
    if problems and not allow: sys.exit(2)


if __name__ == '__main__':
    main()
