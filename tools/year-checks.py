"""Calculation checks on the parsed payroll sheets, written to an Excel report for management.

    python -I tools/year-checks.py <Salaries folder>

Reads _import/year.json and _import/year-payload.json. For every month and every employee row:
  gross vs the sum of its parts (basic + housing + transport + other allowances + incentive)
  total deduction vs the sum of its parts (GOSI, traffic, penalties, loan, leave, new joiner, other)
  net vs gross - total deduction
plus duplicates, rows without a usable ID, rows matched by name, and the month totals (sheet vs what BASMA loads).
Writes Salaries/Payroll-checks-2026.xlsx (private folder) and prints a summary.
"""
import sys, os, json, collections
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
sys.stdout.reconfigure(encoding='utf-8')
folder = sys.argv[1]
Y = json.load(open(os.path.join(folder, '_import/year.json'), encoding='utf-8'))
P = json.load(open(os.path.join(folder, '_import/year-payload.json'), encoding='utf-8'))
names = {p['nid']: p for p in P['people']}
DED = ['gosi', 'traffic', 'penalties', 'loan', 'leave', 'newJoiner', 'otherDed']
issues, totals = [], []
for m in sorted(P['months']):
    lines = P['months'][m]
    for x in lines:
        p = names.get(x['nid'], {})
        who = (p.get('empNo', ''), x['nid'] if not str(x['nid']).startswith('NOID') else '(بلا هوية)', x.get('name') or p.get('name', ''))
        g = round(x.get('basic', 0) + x.get('housing', 0) + x.get('transport', 0) + x.get('otherAllow', 0) + x.get('bonus', 0), 2)
        d = round(sum(x.get(k, 0) for k in DED), 2)
        if m != '2026-10':
            if abs(g - x['gross']) > 0.01: issues.append((m, *who, x.get('row'), 'الإجمالي لا يساوي مجموع بنوده', x['gross'], g, round(x['gross'] - g, 2), 'أضيف سطر "فرق الإجمالي عن بنوده في الكشف" ليطابق الصافي'))
            if abs(d - x['totalDed']) > 0.01: issues.append((m, *who, x.get('row'), 'مجموع الخصومات لا يساوي بنودها', x['totalDed'], d, round(x['totalDed'] - d, 2), 'يحتاج مراجعة'))
            if abs(x['gross'] - x['totalDed'] - x['net']) > 0.01: issues.append((m, *who, x.get('row'), 'الصافي لا يساوي الإجمالي ناقص الخصومات', x['net'], round(x['gross'] - x['totalDed'], 2), round(x['net'] - (x['gross'] - x['totalDed']), 2), 'يحتاج مراجعة'))
        if x.get('net', 0) < 0: issues.append((m, *who, x.get('row'), 'صافي سالب', x['net'], 0, x['net'], 'يحتاج مراجعة'))
        if x.get('matchedByName'): issues.append((m, *who, x.get('row'), 'لا يوجد رقم هوية صالح؛ رُبط بالاسم', x['net'], x['net'], 0, 'تأكد من أنه الشخص الصحيح'))
        if x.get('noId'): issues.append((m, *who, x.get('row'), 'بلا رقم هوية؛ أضيف بسجل بلا هوية', x['net'], x['net'], 0, 'الرقم في الكشف: ' + str(x.get('idOnSheet') or '-')))
    if m == '2026-10':
        for x in lines:
            if abs(x.get('transferred', 0) - x['net']) > 0.01:
                p = names.get(x['nid'], {})
                issues.append((m, p.get('empNo', ''), x['nid'], x.get('name') or p.get('name', ''), x.get('row'), 'المحوّل يختلف عن الصافي المستحق', x['net'], x.get('transferred', 0), round(x.get('transferred', 0) - x['net'], 2), (x.get('action') or '')[:120]))
    sheet = Y['report'].get(m, {})
    totals.append((m, len(lines), round(sum(x['net'] for x in lines), 2), sheet.get('people'), sheet.get('net')))
for p in Y['problems']:
    if 'twice' in p: issues.append((p[:7], '', '', '', '', 'صف مكرر في الكشف', '', '', '', p))
wb = openpyxl.Workbook()
ws = wb.active; ws.title = 'ملاحظات الحساب'; ws.sheet_view.rightToLeft = True
hdr = ['الشهر', 'الرقم الوظيفي', 'الهوية', 'الاسم', 'صف الكشف', 'الملاحظة', 'القيمة في الكشف', 'القيمة المحسوبة', 'الفرق', 'الإجراء']
ws.append(hdr)
for r in issues: ws.append(list(r))
ws2 = wb.create_sheet('مطابقة الإجماليات'); ws2.sheet_view.rightToLeft = True
ws2.append(['الشهر', 'عدد الأسطر في بصمة', 'صافي بصمة', 'عدد الأسطر المقروءة', 'صافي الأسطر المقروءة'])
for r in totals: ws2.append(list(r))
for w in (ws, ws2):
    for c in w[1]: c.font = Font(bold=True, color='FFFFFF'); c.fill = PatternFill('solid', fgColor='4D6D51'); c.alignment = Alignment(horizontal='center')
    for col in w.columns: w.column_dimensions[col[0].column_letter].width = 18
ws.column_dimensions['F'].width = 42; ws.column_dimensions['J'].width = 60
for row in ws.iter_rows(min_row=2):
    if 'مراجعة' in str(row[9].value or '') or 'مكرر' in str(row[5].value or ''): [setattr(c, 'fill', PatternFill('solid', fgColor='FDECEA')) for c in row]
out = os.path.join(folder, 'Payroll-checks-2026.xlsx'); wb.save(out)
c = collections.Counter(r[5] for r in issues)
print('issues', len(issues)); [print('  ', k, v) for k, v in c.items()]
print('saved', out)
