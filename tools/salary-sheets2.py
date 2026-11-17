"""Parse a full year of the company's approved payroll workbooks (Jan..Oct 2026 layouts) into one JSON for the importer.

    python -I tools/salary-sheets2.py <folder> <output.json>

Each month's workbook has its own layout; MONTH_FILES names the file pattern, the tab(s) that hold the approved payroll
and the header row. Columns are found by keywords in the header text (English or Arabic). Every row is checked:
gross = parts, total deduction = parts (when the sheet has them), net = gross - total deduction. October is a
disbursement report: net only (no breakdown), with the amount transferred and advances recorded per person.
Personal data stays on this machine: the output belongs in the private Salaries folder, never in src/ or app/.
"""
import sys, re, json, glob, os, datetime, collections
import openpyxl
sys.stdout.reconfigure(encoding='utf-8')

MONTH_FILES = [  # (month, file glob, [tabs], header row)
    ('2026-01', 'January Salaries 2026*.xlsx', ['Total Salaries'], 4),
    ('2026-02', 'Payroll_Feb_2026*.xlsx', ['Legal', 'Outsourced'], 1),
    ('2026-03', 'Payroll_Mar_2026*.xlsx', ['Master File'], 1),
    ('2026-04', 'Payroll_Apr_2026*.xlsx', ['April'], 1),
    ('2026-05', 'Payroll_May_2026*.xlsx', ['May'], 1),
    ('2026-06', 'Payroll_June_2026*.xlsx', ['June'], 1),
    ('2026-07', 'Payroll_Jul_2026*.xlsx', ['Master Payroll Sheet Jul'], 1),
    ('2026-08', 'Payroll_Aug_2026*.xlsx', ['Sheet4'], 1),
    ('2026-09', 'Payroll_Sep_2026*.xlsx', ['Sep'], 1),
    ('2026-10', '*أكتوبر 2026*.xlsx', ['تفاصيل الرواتب'], 7),
]
# key -> list of regexes tried in order against the lower-cased header text
KEYS = [
    ('nid', [r'employee id', r'id/iqama', r'رقم الهوية']), ('status', [r'employee status']), ('name', [r'employee name', r'arabic name', r'اسم الموظف']),
    ('nameEn', [r'english name']), ('nationality', [r'nationality']), ('department', [r'department']), ('costCenter', [r'cost center']),
    ('position', [r'position']), ('reliability', [r'reliability']), ('joined', [r'joining date']), ('lastDay', [r'last working day']),
    ('sponsor', [r'sponsor', r'sponser']), ('loanBalance', [r'current loan balance']), ('loanRemaining', [r'remaining loan']),
    ('basic', [r'basic']), ('housing', [r'housing']), ('transport', [r'transportation']), ('otherAllow', [r'^other allowances', r'^others']),
    ('bonus', [r'incentive', r'bonus']), ('gross', [r'gross']), ('gosiApplies', [r'gosi applicable']), ('gosi', [r'gosi deduction', r'^gosi']),
    ('traffic', [r'traffic violation']), ('penalties', [r'penalties']), ('loan', [r'^loan deduction']), ('leave', [r'unpaid leave', r'^leave']),
    ('newJoiner', [r'new joiner']), ('otherDed', [r'^other deductions', r'^deduction']), ('totalDed', [r'total deduction']), ('net', [r'net salary', r'net income']),
    ('payMethod', [r'payment method', r'طريقة الصرف']), ('bank', [r'^bank']), ('iban', [r'iban']),
    # October report
    ('netDue', [r'صافي الراتب المستحق']), ('transferred', [r'إجمالي المحوّل الفعلي']), ('advanceSelf', [r'سلفة على الموظف نفسه']),
    ('advanceOther', [r'قُيد على شخص آخر']), ('action', [r'التعديل والإجراء']), ('route', [r'مسار الصرف']),
]
MONEY = ['basic', 'housing', 'transport', 'otherAllow', 'bonus', 'gross', 'gosi', 'traffic', 'penalties', 'loan', 'leave', 'newJoiner', 'otherDed',
         'totalDed', 'net', 'loanBalance', 'loanRemaining', 'netDue', 'transferred', 'advanceSelf', 'advanceOther']
DED = ['gosi', 'traffic', 'penalties', 'loan', 'leave', 'newJoiner', 'otherDed']
NAT = {'الهند': 'هندي', 'بنجلاديش': 'بنجلادشي', 'pakistani': 'باكستاني', 'indian': 'هندي', 'bengali': 'بنجلادشي', 'bangladeshi': 'بنجلادشي', 'saudi': 'سعودي',
       'sudanese': 'سوداني', 'filipino': 'فلبيني', 'yemeni': 'يمني', 'egyptian': 'مصري', 'jordanian': 'أردني', 'ethiopian': 'أثيوبي', 'nepali': 'نيبالي'}


def num(v):
    if v in (None, ''): return 0.0
    try: return round(float(str(v).replace(',', '')), 2)
    except (TypeError, ValueError): return None


def day(v):
    if isinstance(v, datetime.datetime): return v.date().isoformat() if v.year > 1900 else ''
    if isinstance(v, datetime.date): return v.isoformat()
    s = str(v or '').strip()
    m = re.fullmatch(r'(\d{1,2})-(\d{1,2})-(\d{4})', s)
    if m: return '%s-%02d-%02d' % (m.group(3), int(m.group(1)), int(m.group(2)))
    m = re.fullmatch(r'(\d{4})-(\d{2})-(\d{2}).*', s)
    return '-'.join(m.groups()) if m else ''


def text(v):
    s = re.sub(r'\s+', ' ', str(v if v is not None else '')).strip()
    return '' if s in ('None', '00:00:00') else s


def colmap(hdr):
    out, used = {}, set()
    low = [str(h or '').split('|')[0].strip().lower() for h in hdr]
    full = [str(h or '').strip() for h in hdr]
    for key, pats in KEYS:
        for p in pats:
            hit = [i for i, h in enumerate(low) if i not in used and (re.search(p, h) or re.search(p, full[i]))]
            if hit: out[key] = hit[0]; used.add(hit[0]); break
    return out


def main():
    folder, out = sys.argv[1], sys.argv[2]
    months, problems, report = {}, [], {}
    for month, pat, tabs, hrow in MONTH_FILES:
        files = sorted(glob.glob(os.path.join(folder, pat)))
        if not files: problems.append('%s: no file %s' % (month, pat)); continue
        wb = openpyxl.load_workbook(files[0], data_only=True, read_only=True)
        lines, seen = [], {}
        for tab in tabs:
            ws = wb[tab]
            rows = list(ws.iter_rows(min_row=hrow, max_row=min(ws.max_row or 2000, 2000), values_only=True))
            cm = colmap(rows[0])
            for i, r in enumerate(rows[1:], hrow + 1):
                g = lambda k: r[cm[k]] if k in cm and cm[k] < len(r) else None
                nid = text(g('nid'))
                if not re.fullmatch(r'\d{10}', nid):
                    if any(v not in (None, '') for v in r) and not re.search(r'total|إجمالي|المجموع', ' '.join(text(v) for v in r[:4]), re.I) and nid:
                        problems.append('%s %s row %d: no 10-digit ID (%s)' % (month, tab, i, nid[:14]))
                    continue
                o = {k: text(g(k)) for k in ('status', 'name', 'nameEn', 'nationality', 'department', 'costCenter', 'position', 'reliability', 'sponsor',
                                               'gosiApplies', 'payMethod', 'bank', 'action', 'route')}
                o.update({'nid': nid, 'row': i, 'tab': tab, 'joined': day(g('joined')), 'joinedRaw': text(g('joined')), 'lastDay': day(g('lastDay')),
                          'iban': text(g('iban')).replace(' ', '').upper()})
                o['nationality'] = NAT.get(o['nationality'].lower(), NAT.get(o['nationality'], o['nationality']))
                for k in MONEY:
                    v = num(g(k)) if k in cm else 0.0
                    if v is None: problems.append('%s %s row %d (%s): %s not a number: %r' % (month, tab, i, nid, k, g(k))); v = 0.0
                    o[k] = v
                if month == '2026-10':
                    o['net'] = o['netDue']
                else:
                    parts = round(o['basic'] + o['housing'] + o['transport'] + o['otherAllow'] + o['bonus'], 2)
                    if 'gross' not in cm: o['gross'] = parts
                    d = round(sum(o[k] for k in DED), 2)
                    if 'totalDed' not in cm: o['totalDed'] = d
                    o['grossParts'] = parts; o['dedParts'] = d
                    if abs(o['gross'] - o['totalDed'] - o['net']) > 0.01:
                        problems.append('%s %s row %d (%s): net %s but gross - deductions = %s' % (month, tab, i, nid, o['net'], round(o['gross'] - o['totalDed'], 2)))
                if nid in seen:
                    problems.append('%s: ID %s twice (%s row %d and %s row %d)' % (month, nid, seen[nid]['tab'], seen[nid]['row'], tab, i)); continue
                seen[nid] = o; lines.append(o)
        months[month] = lines
        report[month] = {'file': os.path.basename(files[0]), 'tabs': tabs, 'people': len(lines), 'gross': round(sum(x['gross'] for x in lines), 2),
                         'deductions': round(sum(x['totalDed'] for x in lines), 2), 'net': round(sum(x['net'] for x in lines), 2),
                         'grossOffParts': sum(1 for x in lines if 'grossParts' in x and abs(x['grossParts'] - x['gross']) > 0.01),
                         'dedOffParts': sum(1 for x in lines if 'dedParts' in x and abs(x['dedParts'] - x['totalDed']) > 0.01)}
    json.dump({'months': months, 'report': report, 'problems': problems}, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(json.dumps(report, ensure_ascii=False, indent=1))
    for p in problems[:80]: print('PROBLEM', p)
    print('problems', len(problems))


if __name__ == '__main__':
    main()
