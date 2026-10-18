/**
 * Best Gas Attendance (نظام الحضور) — backend core.
 * Google Apps Script web app; a Google Sheet is the database.
 * Files: Code.gs (this: config, sheet db, tokens, router), WebAuthn.gs
 * (passkey verification, P-256 ECDSA), Attendance.gs (geofence, punches,
 * risk, summaries), Admin.gs (employees, zones, settings, reports).
 * No secrets live in this file: the token key is generated into script
 * properties on first use, and the setup key hash comes from Secrets.js,
 * which exists only in the private clasp folder.
 */

var CONFIG = {
  RP_NAME: 'Best Gas Attendance',
  RP_ID: 'besgasksa.github.io',
  ORIGINS: ['https://besgasksa.github.io'],
  TZ_OFFSET_MIN: 180, // Asia/Riyadh, no DST
  EMP_TOKEN_HOURS: 12,
  ADMIN_TOKEN_HOURS: 8,
  CHALLENGE_SECONDS: 180,
  ACTIVATION_HOURS: 72,
  ACTIVATION_MAX_TRIES: 5
};

var SHEETS = { EMP: 'employees', CRED: 'credentials', ZONES: 'zones', PUNCH: 'punches', AUDIT: 'audit', SET: 'settings',
  DEPT: 'departments', POS: 'positions', PRIV: 'empPrivate', COMP: 'compensation', JOBH: 'jobHistory', DOCS: 'documents',
  REQ: 'requests', HOL: 'holidays', RUN: 'payrollRuns', SLIP: 'payslips', ADJ: 'adjustments',
  CYC: 'perfCycles', KPI: 'kpis', REV: 'reviews', FB: 'feedback360', RLOG: 'reportLog',
  ONB: 'onboarding', SRV: 'surveys', SANS: 'surveyAnswers', POL: 'policies', PACK: 'policyAcks', PLAN: 'devPlans',
  DLG: 'delegations', WPS: 'wpsLog', RECON: 'salaryRecon', SHIFT: 'shifts', ROSTER: 'roster', DCODE: 'discCodes', DCASE: 'discCases', INJ: 'injuries', ASSET: 'assets', CUST: 'custody', CLR: 'clearance', DEMO: 'demoLedger',
  // Government services, expenses and the accounting journal (GovServices.gs, Expenses.gs, Journal.gs)
  GOV_VISA: 'govVisas', GOV_IQR: 'iqamaRenewals', GOV_FEE: 'govFees', TICKET: 'ticketRights', TICKET_USE: 'ticketUses', EXPENSE: 'expenseClaims', JOURNAL: 'journalLog',
  // Leave cycle and approval flows (Flows.gs)
  LCYC: 'leaveCycles', FLOW: 'approvalFlows',
  // Wave 2 modules (2026-10-14): recruitment (Recruitment.gs), loans (Loans.gs), training (Training.gs), medical insurance
  // (Insurance.gs), announcements (Announce.gs), HR help desk (HelpDesk.gs)
  REQN: 'requisitions', CAND: 'candidates', INTV: 'interviews', OFFER: 'offers', LOAN: 'loans',
  COURSE: 'courses', TSESS: 'trainSessions', TENR: 'trainEnrol', INSP: 'insPolicies', INSM: 'insMembers', INSMV: 'insMoves',
  ANN: 'announcements', ANNR: 'annReads', HDT: 'hdTickets',
  EXS: 'exitSurveys', KUD: 'kudos', FSET: 'finalSettlements', CRC: 'compCycles', CRP: 'compProposals' }; // Wave 3 (Engage.gs): exit interview, recognition

var HEADERS = {
  employees: ['id', 'empNo', 'name', 'nameEn', 'email', 'phone', 'department', 'title', 'role', 'status',
    'zoneIds', 'shiftStart', 'shiftEnd', 'workdays', 'tokenVer', 'actHash', 'actExp', 'actTries', 'createdAt', 'updatedAt',
    'pwHash', 'pwSalt', 'pwTries', 'pwLockUntil', 'actIssuedBy', 'pwMustChange',
    // HR (Phase 1): job placement and the Qiwa unified-contract terms
    'extraRoles', 'departmentId', 'positionId', 'managerId', 'hireDate', 'contractType', 'contractEnd', 'probationEnd',
    'nationality', 'isSaudi', 'gender', 'workLocation', 'contractNo', 'occupationCode', 'employmentType',
    'workDaysPerWeek', 'dailyHours', 'annualLeaveDays', 'noticeDays',
    // HR (Phase 2): leave opening balance carried over from the old system, and resignation
    'leaveOpeningDays', 'leaveOpeningDate', 'resignedOn', 'lastWorkingDay',
    // Shifts (2026-09-30): Ramadan short day applies unless 'no' (Art. 98); outdoor work is checked against the summer midday ban
    'ramadanReduced', 'outdoor'],
  credentials: ['credId', 'empId', 'x', 'y', 'signCount', 'label', 'status', 'createdAt', 'lastUsedAt', 'aaguid', 'kind',
    'platform', 'pinHash', 'pinSalt', 'pinTries'],
  zones: ['id', 'name', 'nameEn', 'lat', 'lng', 'radius', 'status', 'createdAt', 'updatedAt'],
  punches: ['id', 'empId', 'type', 'ts', 'date', 'lat', 'lng', 'acc', 'zoneId', 'distance', 'status', 'risk', 'flags',
    'source', 'note', 'reviewBy', 'reviewAt', 'credId', 'ua', 'createdAt'],
  audit: ['ts', 'actorId', 'action', 'targetId', 'detail'],
  settings: ['key', 'value'],
  departments: ['id', 'code', 'nameAr', 'nameEn', 'parentId', 'headEmpId', 'costCenter', 'status', 'createdAt', 'updatedAt'],
  positions: ['id', 'code', 'titleAr', 'titleEn', 'departmentId', 'grade', 'purposeAr', 'purposeEn', 'dutiesAr', 'dutiesEn',
    'requirementsAr', 'requirementsEn', 'status', 'createdAt', 'updatedAt'],
  empPrivate: ['empId', 'nationalId', 'idExpiry', 'birthDate', 'maritalStatus', 'iban', 'bankName', 'gosiNumber', 'gosiCohort',
    'address', 'emergencyName', 'emergencyPhone', 'updatedAt', 'borderNo', 'passportNo', 'passportExpiry', 'nationalAddress',
    'personalEmail', 'nameEnOfficial', 'gosiWage'],
  compensation: ['id', 'empId', 'effectiveFrom', 'basic', 'housing', 'transport', 'otherJson', 'currency', 'reason',
    'enteredBy', 'approvedBy', 'approvedAt', 'status', 'createdAt', 'batchId', 'ref'],
  jobHistory: ['id', 'empId', 'effectiveFrom', 'departmentId', 'positionId', 'managerId', 'grade', 'reason', 'enteredBy', 'createdAt'],
  documents: ['id', 'empId', 'type', 'number', 'issueDate', 'expiryDate', 'note', 'status', 'createdAt', 'updatedAt', 'ref'],
  requests: ['id', 'ref', 'empId', 'type', 'subtype', 'fromDate', 'toDate', 'days', 'amount', 'months', 'payloadJson', 'reason', 'docNo',
    'status', 'step', 'stepsJson', 'effectJson', 'createdAt', 'updatedAt', 'decidedAt',
    'flowJson'], // the approval flow fixed when the request was made (Flows.gs); empty = the built-in chain
  holidays: ['id', 'date', 'toDate', 'nameAr', 'nameEn', 'createdBy', 'createdAt', 'status'],
  payrollRuns: ['id', 'ref', 'month', 'status', 'preparedBy', 'preparedAt', 'approvedBy', 'approvedAt', 'totalsJson', 'note', 'emailedAt', 'createdAt', 'updatedAt',
    'scope'], // '' = the company's payroll; 'demo' = a run over the demo company only (Demo.gs), never mixed with the real one
  payslips: ['id', 'ref', 'runId', 'month', 'empId', 'status', 'linesJson', 'gross', 'deductions', 'net', 'gosiEmployee', 'gosiEmployer',
    'paidDays', 'absentDays', 'infoJson', 'emailedAt', 'createdAt', 'updatedAt', 'eosAccrual', 'companyCost'],
  adjustments: ['id', 'ref', 'empId', 'month', 'kind', 'code', 'amount', 'reason', 'enteredBy', 'status', 'createdAt'],
  perfCycles: ['id', 'ref', 'year', 'nameAr', 'nameEn', 'type', 'status', 'kpiWeight', 'compWeight', 'goalsDue', 'midDue', 'reviewDue', 'createdBy', 'createdAt', 'updatedAt'],
  kpis: ['id', 'ref', 'cycleId', 'empId', 'titleAr', 'titleEn', 'measure', 'target', 'unit', 'weight', 'status', 'midStatus', 'midNote', 'actual',
    'selfScore', 'selfComment', 'mgrScore', 'mgrComment', 'setBy', 'createdAt', 'updatedAt'],
  reviews: ['id', 'ref', 'cycleId', 'empId', 'stage', 'selfCompJson', 'selfComment', 'selfAt', 'mgrCompJson', 'mgrComment', 'mgrBy', 'mgrAt',
    'kpiScore', 'compScore', 'overall', 'finalRating', 'calibratedBy', 'calibrationNote', 'employeeComment', 'acknowledgedAt', 'createdAt', 'updatedAt'],
  feedback360: ['id', 'ref', 'cycleId', 'subjectId', 'raterId', 'relation', 'status', 'answersJson', 'comment', 'createdAt', 'submittedAt'],
  reportLog: ['id', 'ref', 'reportId', 'paramsJson', 'rows', 'format', 'hash', 'by', 'at', 'reviewedBy', 'reviewedAt', 'reviewNote'],
  onboarding: ['id', 'ref', 'empId', 'taskKey', 'phase', 'titleAr', 'titleEn', 'owner', 'dueDate', 'status', 'doneBy', 'doneAt', 'note', 'createdBy', 'createdAt'],
  surveys: ['id', 'ref', 'titleAr', 'titleEn', 'questionsJson', 'status', 'opensAt', 'closesAt', 'eligible', 'votersJson', 'createdBy', 'createdAt'],
  // No employee id here, on purpose: answers are anonymous.
  surveyAnswers: ['id', 'surveyId', 'departmentId', 'tenureBand', 'answersJson', 'comment', 'at'],
  policies: ['id', 'ref', 'code', 'titleAr', 'titleEn', 'bodyAr', 'bodyEn', 'version', 'effectiveFrom', 'status', 'createdBy', 'createdAt', 'updatedAt'],
  policyAcks: ['id', 'policyId', 'version', 'empId', 'at'],
  devPlans: ['id', 'ref', 'empId', 'type', 'titleAr', 'reason', 'goalsJson', 'support', 'startDate', 'endDate', 'status', 'checkInsJson', 'ackAt', 'employeeComment', 'outcomeNote', 'createdBy', 'createdAt', 'updatedAt'],
  delegations: ['id', 'ref', 'fromEmpId', 'toEmpId', 'fromDate', 'toDate', 'scope', 'reason', 'status', 'createdBy', 'createdAt'],
  wpsLog: ['id', 'ref', 'runId', 'month', 'status', 'rows', 'total', 'generatedBy', 'generatedAt', 'uploadedBy', 'uploadedAt', 'bankRef', 'confirmedBy', 'confirmedAt', 'note'],
  salaryRecon: ['id', 'ref', 'month', 'source', 'total', 'matched', 'mismatchesJson', 'missingJson', 'unknownJson', 'status', 'by', 'at', 'resolvedBy', 'resolvedAt', 'note'],
  shifts: ['id', 'code', 'nameAr', 'nameEn', 'start', 'end', 'workdays', 'outdoor', 'status', 'createdAt', 'updatedAt'],
  roster: ['id', 'empId', 'shiftId', 'fromDate', 'toDate', 'status', 'createdBy', 'createdAt'],
  discCodes: ['id', 'code', 'titleAr', 'titleEn', 'p1', 'p2', 'p3', 'p4', 'status', 'createdAt', 'updatedAt'],
  discCases: ['id', 'ref', 'empId', 'code', 'violation', 'occurrence', 'incidentDate', 'discoveredDate', 'description', 'reportedBy', 'chargedAt', 'responseText', 'responseAt',
    'hearingsJson', 'suggested', 'decision', 'decisionNote', 'decidedBy', 'decidedAt', 'amount', 'adjMonth', 'objection', 'objectedAt', 'objectionResult', 'status', 'createdAt', 'updatedAt',
    'notifiedOn'], // Art. 72 (amended 2025): the day the employee was told of the decision; the 30-day grievance window runs from it
  injuries: ['id', 'ref', 'empId', 'occurredAt', 'place', 'description', 'firstAid', 'witnesses', 'reportedBy', 'reportedAt', 'gosiDue', 'gosiRef', 'gosiReportedAt', 'offFrom', 'offTo',
    'status', 'closedNote', 'createdAt', 'updatedAt'],
  assets: ['id', 'ref', 'type', 'nameAr', 'serial', 'value', 'status', 'note', 'createdAt', 'updatedAt'],
  custody: ['id', 'assetId', 'empId', 'handedAt', 'handedBy', 'conditionOut', 'ackAt', 'returnedAt', 'returnedTo', 'conditionIn', 'status', 'charge', 'chargeStatus', 'chargeBy', 'chargeApprovedBy', 'note'],
  demoLedger: ['tab', 'key', 'batch', 'at'],
  clearance: ['id', 'ref', 'empId', 'lastDay', 'reason', 'tasksJson', 'status', 'createdBy', 'createdAt', 'clearedAt'],
  // exit/re-entry (ref = the ERV request's) and final exit (FEX) visas, kept by hand until a Muqeem link exists
  govVisas: ['id', 'ref', 'kind', 'empId', 'requestId', 'visaType', 'durationDays', 'travelFrom', 'travelTo', 'linkRef', 'dependants', 'visaNo', 'issuedOn', 'expiry',
    'fee', 'feeRef', 'paidBy', 'status', 'issuedBy', 'issuedAt', 'returnedOn', 'returnBy', 'note', 'createdBy', 'createdAt', 'updatedAt'],
  iqamaRenewals: ['id', 'ref', 'empId', 'iqamaNo', 'oldExpiry', 'newExpiry', 'renewedOn', 'years', 'muqeemRef', 'paidBy', 'feesJson', 'total', 'note', 'enteredBy', 'createdAt'],
  govFees: ['id', 'ref', 'empId', 'type', 'amount', 'date', 'reference', 'paidBy', 'sourceRef', 'note', 'status', 'enteredBy', 'enteredAt', 'verifiedBy', 'verifiedAt', 'voidNote'],
  ticketRights: ['id', 'empId', 'travelClass', 'everyYears', 'dependants', 'route', 'cashValue', 'fromDate', 'status', 'note', 'setBy', 'createdAt', 'updatedAt'],
  ticketUses: ['id', 'ref', 'empId', 'rightId', 'usedOn', 'cycleDue', 'persons', 'kind', 'amount', 'reference', 'note', 'status', 'enteredBy', 'approvedBy', 'approvedAt', 'adjRef', 'createdAt'],
  expenseClaims: ['id', 'ref', 'empId', 'title', 'linesJson', 'total', 'vat', 'flagsJson', 'attachmentsJson', 'status', 'step', 'stepsJson', 'payout', 'payMonth', 'adjRef',
    'paidRef', 'paidOn', 'paidBy', 'costCenter', 'departmentId', 'createdAt', 'updatedAt', 'decidedAt'],
  journalLog: ['id', 'ref', 'runId', 'month', 'status', 'lines', 'debit', 'credit', 'hash', 'generatedBy', 'generatedAt', 'importedBy', 'importedAt', 'odooRef',
    'confirmedBy', 'confirmedAt', 'note'],
  // leave cycle LC-YYYY-00001: pre-leave clearance, departure, return to work (Flows.gs)
  leaveCycles: ['id', 'ref', 'requestId', 'requestRef', 'empId', 'subtype', 'fromDate', 'toDate', 'days', 'status', 'substituteId', 'tasksJson', 'departedOn', 'departedBy',
    'returnedOn', 'returnRecordedAt', 'returnConfirmedOn', 'returnConfirmedBy', 'outcome', 'earlyDays', 'lateDays', 'extensionRef', 'art80Json', 'historyJson',
    'createdBy', 'createdAt', 'updatedAt', 'closedAt'],
  // approval flows per request type, versioned AF-001 (Flows.gs); status active | superseded | default (= back to the built-in chain)
  approvalFlows: ['id', 'ref', 'type', 'version', 'status', 'stepsJson', 'note', 'createdBy', 'createdAt'],
  // ---- Wave 2 (2026-10-14) ----
  // recruitment: requisition RQ -> candidates CND -> interviews INT -> offer OFR -> hire (Recruitment.gs)
  requisitions: ['id', 'ref', 'titleAr', 'titleEn', 'departmentId', 'positionId', 'headcount', 'employmentType', 'contractType', 'reason', 'replacesEmpId',
    'hiringManagerId', 'budgetMin', 'budgetMax', 'saudiOnly', 'targetDate', 'justification', 'status', 'stepsJson', 'requestedBy', 'decidedBy', 'decidedAt',
    'filled', 'closedNote', 'createdAt', 'updatedAt'],
  candidates: ['id', 'ref', 'reqId', 'name', 'nameEn', 'email', 'phone', 'nationality', 'isSaudi', 'gender', 'birthDate', 'source', 'referredBy', 'currentTitle',
    'currentEmployer', 'yearsExperience', 'expectedSalary', 'noticeDays', 'cvRef', 'consentAt', 'stage', 'historyJson', 'rating', 'rejectReason', 'note', 'empId',
    'createdBy', 'createdAt', 'updatedAt', 'purgeAfter'],
  interviews: ['id', 'ref', 'candidateId', 'reqId', 'at', 'durationMin', 'mode', 'location', 'panelJson', 'status', 'feedbackJson', 'createdBy', 'createdAt', 'updatedAt'],
  offers: ['id', 'ref', 'candidateId', 'reqId', 'positionId', 'departmentId', 'managerId', 'titleAr', 'startDate', 'contractType', 'contractMonths', 'probationDays',
    'basic', 'housing', 'transport', 'otherJson', 'annualLeaveDays', 'noticeDays', 'workLocation', 'workDaysPerWeek', 'dailyHours', 'expiresOn', 'warningsJson',
    'status', 'preparedBy', 'approvedBy', 'approvedAt', 'decisionNote', 'sentAt', 'respondedAt', 'responseNote', 'empId', 'compRef', 'createdAt', 'updatedAt'],
  // employee loans LN (Loans.gs), apart from salary advances (Leave.gs 'advance'); instalments are payslip lines code 'loan'
  loans: ['id', 'ref', 'empId', 'kind', 'principal', 'months', 'installment', 'startMonth', 'purpose', 'consentAt', 'status', 'step', 'stepsJson', 'requestedBy',
    'disbursedOn', 'disbursedRef', 'disbursedBy', 'settlementsJson', 'closedOn', 'createdAt', 'updatedAt', 'decidedAt'],
  // training: course catalogue CRS, sessions TRS, enrolments and certificates (Training.gs)
  courses: ['id', 'code', 'titleAr', 'titleEn', 'provider', 'category', 'hours', 'validityMonths', 'costPerPerson', 'mandatoryJson', 'status', 'createdBy', 'createdAt', 'updatedAt'],
  trainSessions: ['id', 'ref', 'courseId', 'fromDate', 'toDate', 'location', 'trainer', 'capacity', 'cost', 'status', 'note', 'createdBy', 'createdAt', 'updatedAt'],
  trainEnrol: ['id', 'sessionId', 'courseId', 'empId', 'status', 'requestedBy', 'approvedBy', 'score', 'result', 'certNo', 'issuedOn', 'expiresOn', 'title', 'provider',
    'hours', 'cost', 'note', 'markedBy', 'createdAt', 'updatedAt'],
  // medical insurance (CCHI): policies INP, members (employees and dependants), additions/deletions INS (Insurance.gs)
  insPolicies: ['id', 'ref', 'insurer', 'policyNo', 'fromDate', 'toDate', 'classesJson', 'status', 'note', 'createdBy', 'createdAt', 'updatedAt'],
  insMembers: ['id', 'policyId', 'empId', 'relation', 'name', 'nameEn', 'birthDate', 'gender', 'idNo', 'insClass', 'memberNo', 'fromDate', 'toDate', 'status',
    'premium', 'note', 'createdBy', 'createdAt', 'updatedAt'],
  insMoves: ['id', 'ref', 'memberId', 'policyId', 'empId', 'kind', 'effective', 'fromClass', 'toClass', 'premiumDelta', 'status', 'requestedBy', 'submittedBy',
    'submittedAt', 'insurerRef', 'confirmedBy', 'confirmedAt', 'note', 'createdAt', 'updatedAt'],
  // announcements ANN and who read / acknowledged them (Announce.gs)
  announcements: ['id', 'ref', 'kind', 'titleAr', 'titleEn', 'bodyAr', 'bodyEn', 'audienceJson', 'pinned', 'requireAck', 'publishAt', 'expiresAt', 'status',
    'createdBy', 'publishedBy', 'publishedAt', 'createdAt', 'updatedAt'],
  annReads: ['id', 'annId', 'empId', 'readAt', 'ackAt'],
  // HR help desk HD (HelpDesk.gs)
  hdTickets: ['id', 'ref', 'empId', 'category', 'subject', 'body', 'priority', 'confidential', 'status', 'assigneeId', 'queue', 'messagesJson', 'slaDue',
    'firstResponseAt', 'resolvedAt', 'closedAt', 'rating', 'ratingNote', 'createdAt', 'updatedAt'],
  // exit interview EXS and recognition (Engage.gs, Wave 3)
  exitSurveys: ['id', 'ref', 'empId', 'status', 'reason', 'answersJson', 'submittedAt', 'createdAt'],
  kudos: ['id', 'fromId', 'toId', 'value', 'message', 'status', 'createdAt'],
  // final settlement FS (Payroll.gs, Wave 3)
  // annual pay review CR (Payroll.gs, Wave 3)
  compCycles: ['id', 'ref', 'name', 'effectiveFrom', 'budgetPct', 'basis', 'status', 'note', 'createdBy', 'createdAt', 'closedAt'],
  compProposals: ['id', 'cycleId', 'empId', 'pct', 'note', 'proposedBy', 'status', 'updatedAt'],
  finalSettlements: ['id', 'ref', 'empId', 'lastDay', 'reason', 'quoteJson', 'net', 'status', 'preparedBy', 'preparedAt', 'approvedBy', 'approvedAt', 'paidOn', 'paidRef', 'paidBy', 'note', 'createdAt', 'updatedAt']
};

var ROLES = { employee: 1, hr: 2, admin: 3 };

function cfg_() {
  var p = PropertiesService.getScriptProperties();
  var rp = p.getProperty('RP_ID');
  var or = p.getProperty('ORIGINS');
  return {
    rpId: rp || CONFIG.RP_ID,
    origins: or ? or.split(',').map(function (s) { return s.trim(); }) : CONFIG.ORIGINS
  };
}

// ---------------- sheet database ----------------

var SHEET_CACHE_ = {};

function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

// Every call into SpreadsheetApp costs 70-200 ms on Google's side whatever the size of the tab,
// so the number of calls, not the data, decides how fast a request is.
var HEADER_OK_ = {};

function sheet_(name) {
  if (SHEET_CACHE_[name]) return SHEET_CACHE_[name];
  var ss = ss_();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, HEADERS[name].length).setValues([HEADERS[name]]);
    sh.setFrozenRows(1);
    HEADER_OK_[name] = true;
  }
  SHEET_CACHE_[name] = sh;
  return sh;
}

/** New columns added in code get their header written once, the first time the tab is touched. */
function ensureHeader_(name, sh, width) {
  if (HEADER_OK_[name]) return;
  if ((width === undefined ? sh.getLastColumn() : width) < HEADERS[name].length) sh.getRange(1, 1, 1, HEADERS[name].length).setValues([HEADERS[name]]);
  HEADER_OK_[name] = true;
}

// Each sheet is read once per request. Apps Script sheet reads cost 100-600 ms each,
// and one request used to read the same tab three or four times.
var READ_MEMO_ = {};
function forget_(name) { delete READ_MEMO_[name]; }

/*
 * Sign-in reads the employees and zones tabs but never writes them, and each tab read costs
 * 250-900 ms. Those two paths may use a copy in CacheService (about 50 ms) that is trusted only
 * while its version tag matches the tab's current version. Every write through the app and every
 * hand edit in the Sheet (onEdit) sets a new version, so a changed tab is read fresh at once;
 * the copy also lapses after 60 s whatever happens. Rows from the copy are marked and can never
 * be written back (update_ refuses), so the copy cannot overwrite the Sheet.
 */
// Every small tab can be served from the copy; punches and audit grow without end and are always read.
var CACHED_TABS_ = { employees: 1, zones: 1, credentials: 1, departments: 1, positions: 1, empPrivate: 1, compensation: 1,
  jobHistory: 1, documents: 1, requests: 1, holidays: 1, payrollRuns: 1, adjustments: 1, perfCycles: 1, kpis: 1, reviews: 1, feedback360: 1,
  onboarding: 1, surveys: 1, policies: 1, policyAcks: 1, devPlans: 1, delegations: 1, wpsLog: 1, salaryRecon: 1, shifts: 1, roster: 1, discCodes: 1, discCases: 1, injuries: 1, assets: 1, custody: 1, clearance: 1,
  govVisas: 1, iqamaRenewals: 1, govFees: 1, ticketRights: 1, ticketUses: 1, expenseClaims: 1, journalLog: 1,
  leaveCycles: 1, approvalFlows: 1,
  requisitions: 1, candidates: 1, interviews: 1, offers: 1, loans: 1, courses: 1, trainSessions: 1, trainEnrol: 1, insPolicies: 1, insMembers: 1, insMoves: 1,
  announcements: 1, annReads: 1, hdTickets: 1, exitSurveys: 1, kudos: 1, finalSettlements: 1, compCycles: 1, compProposals: 1 };
var USE_TAB_CACHE_ = false; // true: every cached tab; an object: only those tabs (sign-in writes credentials)
// Version tags make app writes and hand edits visible at once; the expiry only bounds what Sheets
// never reports to onEdit (deleting or sorting rows by hand).
var TAB_CACHE_SECONDS_ = 300;
var TAB_PART_ = 90000;
var TAB_PREFETCH_ = null;
function tabKeys_(name) { return { snap: 'tab:v2:' + name, ver: 'tabver:v1:' + name }; }
function bumpTab_(name) {
  if (!CACHED_TABS_[name]) return;
  if (TAB_PREFETCH_) delete TAB_PREFETCH_[name];
  try { CacheService.getScriptCache().put(tabKeys_(name).ver, bytesToB64u_(randomBytes_(9)), 21600); } catch (e) {}
}
/** One CacheService call for the version and copy of every cached tab (about 50 ms in all). */
function prefetchTabs_() {
  TAB_PREFETCH_ = {};
  var keys = [];
  Object.keys(CACHED_TABS_).forEach(function (n) { var k = tabKeys_(n); keys.push(k.snap, k.ver); });
  var got = {};
  try { got = CacheService.getScriptCache().getAll(keys) || {}; } catch (e) { got = {}; }
  Object.keys(CACHED_TABS_).forEach(function (n) {
    var k = tabKeys_(n), ver = got[k.ver] || '', meta = null;
    try { meta = got[k.snap] ? JSON.parse(got[k.snap]) : null; } catch (e) { meta = null; }
    TAB_PREFETCH_[n] = { ver: ver, meta: meta && meta.ver === ver ? meta : null };
  });
}
function cachedRows_(name) {
  if (!TAB_PREFETCH_) prefetchTabs_();
  var p = TAB_PREFETCH_[name];
  if (!p) return null;
  var rows = null;
  if (p.meta && p.meta.n === 0) rows = p.meta.d;
  else if (p.meta && p.meta.n > 0) { // a big tab is split into parts
    var keys = [];
    for (var i = 0; i < p.meta.n; i++) keys.push(tabKeys_(name).snap + ':' + i);
    try {
      var got = CacheService.getScriptCache().getAll(keys), s = '';
      for (var j = 0; j < keys.length; j++) { if (got[keys[j]] == null) { s = null; break; } s += got[keys[j]]; }
      if (s !== null) rows = JSON.parse(s);
    } catch (e) { rows = null; }
  }
  if (rows) { rows.forEach(function (r) { r._cached = true; }); return { rows: rows }; }
  return { ver: p.ver };
}
function storeTab_(name, ver, rows) {
  try {
    var json = JSON.stringify(rows), k = tabKeys_(name).snap, put = {};
    if (json.length < TAB_PART_) put[k] = JSON.stringify({ ver: ver, n: 0, d: rows });
    else {
      var n = Math.ceil(json.length / TAB_PART_);
      if (n > 20) return; // over 1.8 MB: not worth caching
      for (var i = 0; i < n; i++) put[k + ':' + i] = json.slice(i * TAB_PART_, (i + 1) * TAB_PART_);
      put[k] = JSON.stringify({ ver: ver, n: n });
    }
    CacheService.getScriptCache().putAll(put, TAB_CACHE_SECONDS_);
  } catch (e) {}
}

/** Simple trigger: a hand edit in the Sheet makes the app read that tab fresh on the next request. */
function onEdit(e) {
  try {
    var name = e && e.range ? e.range.getSheet().getName() : '';
    if (name) bumpTab_(name);
    if (name === SHEETS.SET) CacheService.getScriptCache().remove(SETTINGS_CACHE_KEY);
  } catch (err) {}
}

function readAll_(name) {
  if (READ_MEMO_[name]) return READ_MEMO_[name];
  var tag = null;
  if (USE_TAB_CACHE_ && CACHED_TABS_[name] && (USE_TAB_CACHE_ === true || USE_TAB_CACHE_[name])) {
    var c = cachedRows_(name);
    if (c && c.rows) return (READ_MEMO_[name] = c.rows);
    if (c) tag = c.ver;
  }
  var sh = sheet_(name);
  var cols = HEADERS[name];
  // One call for header and rows together (was three: last column, last row, values).
  var vals = sh.getDataRange().getValues();
  ensureHeader_(name, sh, vals.length ? vals[0].length : 0);
  var out = [];
  for (var i = 1; i < vals.length; i++) {
    var o = { _row: i + 1 }, blank = true;
    for (var c = 0; c < cols.length; c++) {
      var v = vals[i][c];
      if (v === undefined) v = '';
      if (v !== '') blank = false;
      o[cols[c]] = (v && typeof v === 'object' && typeof v.getTime === 'function') ? cellDate_(v) : v;
    }
    if (!blank) out.push(o);
  }
  if (tag !== null) storeTab_(name, tag, out);
  READ_MEMO_[name] = out;
  return out;
}

/**
 * Google Sheets reads text the way a person typing would: "2026-09-30" becomes a date,
 * "08:00" a time, "0501234567" the number 501234567, "=..." a formula. A leading apostrophe
 * tells it "this is text"; it is not stored as part of the value. Numbers and booleans stay typed.
 */
function toRow_(name, obj) {
  return HEADERS[name].map(function (k) {
    var v = obj[k];
    if (v === undefined || v === null) return '';
    if (typeof v === 'object') v = JSON.stringify(v);
    if (typeof v === 'string' && v !== '') return "'" + v;
    return v;
  });
}

/**
 * Rows written before toRow_ quoted its text may hold real dates and times. Hand them back
 * the way the code wrote them: 'YYYY-MM-DD' for a date, 'HH:MM' for a time, ISO otherwise.
 */
var TZS_ = null;
function cellDate_(v) {
  if (!TZS_) {
    TZS_ = ['UTC'];
    try { TZS_.push(ss_().getSpreadsheetTimeZone()); } catch (e) {}
    try { TZS_.push(Session.getScriptTimeZone()); } catch (e) {}
  }
  if (v.getUTCFullYear() <= 1900) return Utilities.formatDate(v, 'UTC', 'HH:mm'); // a time-of-day cell (the live probe showed cells come back on UTC)
  for (var i = 0; i < TZS_.length; i++) {
    if (Utilities.formatDate(v, TZS_[i], 'HH:mm:ss.SSS') === '00:00:00.000') return Utilities.formatDate(v, TZS_[i], 'yyyy-MM-dd');
  }
  return v.toISOString();
}

function append_(name, obj) {
  forget_(name);
  bumpTab_(name);
  var sh = sheet_(name);
  ensureHeader_(name, sh);
  sh.appendRow(toRow_(name, obj));
}

/** One write for many rows: appendRow per row is far too slow for an import. */
function appendMany_(name, objs) {
  if (!objs.length) return;
  forget_(name);
  bumpTab_(name);
  var sh = sheet_(name);
  ensureHeader_(name, sh);
  sh.getRange(sh.getLastRow() + 1, 1, objs.length, HEADERS[name].length).setValues(objs.map(function (o) { return toRow_(name, o); }));
}

function update_(name, obj) {
  if (!obj._row) throw new Error('update_ without _row');
  if (obj._cached) throw new Error('update_ from a cached copy of ' + name);
  bumpTab_(name);
  // The row object read this request is the one written, so the memo stays true; only a foreign copy forces a re-read.
  var memo = READ_MEMO_[name];
  if (!memo || memo.indexOf(obj) < 0) forget_(name);
  var sh = sheet_(name);
  ensureHeader_(name, sh);
  sh.getRange(obj._row, 1, 1, HEADERS[name].length).setValues([toRow_(name, obj)]);
}

function findBy_(name, key, value) {
  var rows = readAll_(name);
  for (var i = 0; i < rows.length; i++) if (String(rows[i][key]) === String(value)) return rows[i];
  return null;
}

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function audit_(actorId, action, targetId, detail) {
  try {
    append_(SHEETS.AUDIT, { ts: new Date().toISOString(), actorId: actorId || '', action: action,
      targetId: targetId || '', detail: detail ? JSON.stringify(detail).slice(0, 2000) : '' });
  } catch (e) { /* audit must never break the request */ }
}

// ---------------- settings ----------------

var DEFAULT_SETTINGS = {
  // Company profile (white-label: every letterhead, certificate, payslip and report header reads these)
  companyNameAr: 'شركة الناقل الأفضل للغاز', companyNameEn: 'Best Gas Carrier Co.', companyShortAr: 'الناقل الأفضل', companyShortEn: 'Best Gas',
  companyCr: '', companyVat: '', companyAddressAr: '', companyAddressEn: '',
  adminSeesPay: true,        // the system administrator also holds payroll; switch off to keep pay apart from administration
  wpsDueDay: 10,            // WPS / Mudad: salaries of month M uploaded by this day of month M+1 (check with the bank / Mudad)
  rostersEnabled: false,     // shifts and rosters (Shifts.gs); off = everyone keeps their own shift, nothing extra is read
  ramadanFrom: '', ramadanTo: '', ramadanHours: 6,   // Art. 98: at most 6 hours a day for Muslim staff in Ramadan
  summerBanFrom: '06-15', summerBanTo: '09-15', summerBanStart: '12:00', summerBanEnd: '15:00', // outdoor midday ban (verify yearly)
  leaveCountMode: 'working', // annual leave counts working days (rest days and holidays excluded) or 'calendar'
  allowNegativeLeave: 0,     // days of annual leave that may be taken ahead of accrual
  maxAdvanceSalaries: 1,     // a salary advance is at most this many monthly wages
  advanceMaxMonths: 12,
  deductAbsence: false,             // unexcused absent working days are not paid: switch on once everyone checks in with the app
  deductLateMinutes: false,         // pay for minutes late: only with an approved work regulation
  payOvertimeFromAttendance: false, // overtime hours from punches; off = HR enters approved hours
  saudizationTarget: '',           // the Nitaqat % the company must reach (from the Qiwa calculator), shown on the dashboard
  eosWageBasis: 'total',            // end of service on the total wage, or 'basic_housing'
  refPrefixes: '',           // JSON to rename prefixes, e.g. {"leave":"VAC"}; empty keeps the defaults
  shiftStart: '08:00',
  shiftEnd: '17:00',
  graceMin: 15,
  workdays: '0,1,2,3,4',          // Sun..Thu
  maxAccuracy: 100,               // metres; worse fixes are refused
  minPunchGapMin: 1,
  reviewRiskThreshold: 40,
  allowCheckoutOutside: false,
  allowDeviceKey: true,          // older phones without Face ID / fingerprint: tap with a device-bound key
  allowDesktop: true,            // laptops: device key + 6-digit PIN
  allowPasswordPunch: true,      // check-in from a password session (any device), flagged for HR
  maxAccuracyDesktop: 150,       // laptops locate by Wi-Fi, so they get a wider allowance
  // Leave cycle and approvals centre (Flows.gs), saved from their own screen (flowSettingsSave)
  leaveClearanceMinDays: 7,  // an approved leave of this many counted days or more opens a leave cycle (1 = every leave)
  approvalSlaHours: 48,      // target hours per approval step; overdue past it, escalated to the next level past twice it
  // Expenses (Expenses.gs), the Odoo journal and the bank salary files (Journal.gs): JSON text, saved by their own screens
  expenseLimits: '',         // {"fuel":1500,"meals":600}: SAR per category per calendar month; over it the approver must give a reason
  expenseReceiptOver: 100,   // a line above this amount needs a receipt reference
  glMap: '',                 // account mapping for the payroll journal (journalMapSave)
  bankFileSetup: '',         // establishment and bank identifiers for the salary files (bankSetupSave)
  permissionMaxHours: 4,     // hourly permission (Leave.gs 'permission'): hours per request
  permissionMonthHours: 8,   // and hours per month
  overtimeYearHours: 720,    // yearly overtime ceiling: a warning above it (Leave.gs 'overtime')
  perDiemInside: 300,        // business trip per diem a day inside the Kingdom (Leave.gs 'travel')
  perDiemAbroad: 600,        // and outside it
  loanPolicy: ''             // JSON {maxSalaries, maxMonths, minServiceMonths, oneActive}: employee loans (Loans.gs, loanPolicySave); empty = the defaults
};

var SETTINGS_CACHE_KEY = 'settings:v1';
var SETTING_MMDD_ = { summerBanFrom: 1, summerBanTo: 1 };

function settings_() {
  try { var hit = CacheService.getScriptCache().get(SETTINGS_CACHE_KEY); if (hit) return JSON.parse(hit); } catch (e) {}
  var s = {};
  for (var k in DEFAULT_SETTINGS) s[k] = DEFAULT_SETTINGS[k];
  readAll_(SHEETS.SET).forEach(function (r) {
    if (!(r.key in DEFAULT_SETTINGS)) return;
    var d = DEFAULT_SETTINGS[r.key];
    var v = r.value;
    if (typeof d === 'number') v = Number(v);
    else if (typeof d === 'boolean') v = (v === true || v === 'true' || v === 'TRUE');
    else v = String(v);
    // A month-day typed without the text mark ("06-15") may come back as a full date: keep only MM-DD.
    if (SETTING_MMDD_[r.key] && /^\d{4}-\d{2}-\d{2}/.test(v)) v = v.slice(5, 10);
    s[r.key] = v;
  });
  try { CacheService.getScriptCache().put(SETTINGS_CACHE_KEY, JSON.stringify(s), 120); } catch (e) {}
  return s;
}

// ---------------- time (Asia/Riyadh, fixed +03:00) ----------------

function localParts_(date) {
  var d = new Date(date.getTime() + CONFIG.TZ_OFFSET_MIN * 60000);
  var iso = d.toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16), minutes: d.getUTCHours() * 60 + d.getUTCMinutes(), dow: d.getUTCDay() };
}

function hmToMin_(hm) {
  var p = String(hm || '').split(':');
  return Number(p[0]) * 60 + Number(p[1] || 0);
}

function addDays_(dateStr, n) {
  var d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// ---------------- random, hashing ----------------

function randomBytes_(n) {
  var out = [];
  while (out.length < n) {
    var hex = Utilities.getUuid().replace(/-/g, '');
    for (var i = 0; i < hex.length && out.length < n; i += 2) out.push(parseInt(hex.substr(i, 2), 16));
  }
  // UUID v4 has fixed version/variant nibbles; mix with a digest so every byte is uniform.
  var mixed = sha256_(out.concat(utf8Bytes_(String(Date.now()) + Math.random())));
  return out.map(function (b, i) { return b ^ mixed[i % 32]; });
}

// ---------------- reference numbers (what people read, quote and search) ----------------

/**
 * Every record people deal with gets a readable number: PREFIX-YEAR-00001 for transactions
 * (restarting each year), PREFIX-001 for permanent codes. Counters live in script properties
 * and are only ever taken inside withLock_, so two requests can never get the same number.
 */
var REF_DEFAULTS = {
  leave: 'LV', letter: 'LT', advance: 'AD', correction: 'AC', data_change: 'DC', resignation: 'RS', permission: 'PM', overtime: 'OT', travel: 'TR',
  salary: 'SAL', document: 'DOC', import: 'IMP', department: 'DEP', position: 'POS',
  payroll: 'PR', payslip: 'PS', adjustment: 'ADJ', perf_cycle: 'PC', kpi: 'KPI', review: 'PE', feedback: 'FB', report: 'RPT',
  onboarding: 'ONB', survey: 'SRV', policy: 'POL', idp: 'IDP', pip: 'PIP', delegation: 'DLG', wps: 'WPS', recon: 'REC', shift: 'SH', disciplinary: 'DSC', injury: 'INJ', asset: 'AST', clearance: 'CLR',
  exit_reentry: 'ERV', final_exit: 'FEX', iqama_renewal: 'IQR', gov_fee: 'GF', ticket: 'TKT', expense: 'EXP', journal: 'JV',
  leavecycle: 'LC', flow: 'AF',
  requisition: 'RQ', candidate: 'CND', interview: 'INT', offer: 'OFR', loan: 'LN', course: 'CRS', training: 'TRS', certificate: 'CRT',
  ins_policy: 'INP', insurance: 'INS', announcement: 'ANN', helpdesk: 'HD', exit_survey: 'EXS', settlement: 'FS', comp_cycle: 'CR'
};
var REF_YEARLY = { department: false, position: false, shift: false, asset: false, flow: false, course: false, ins_policy: false };

function refPrefix_(kind) {
  var custom = {};
  try { custom = JSON.parse(settings_().refPrefixes || '{}') || {}; } catch (e) { custom = {}; }
  var p = String(custom[kind] || REF_DEFAULTS[kind] || 'REF').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  return p || REF_DEFAULTS[kind] || 'REF';
}

/**
 * Reserves n numbers for one kind in a single properties read and write. The number is padded to 5 digits
 * (yearly) or 3 (permanent codes) and grows past that (AST-999, AST-1000, ...): it never wraps back to 000,
 * so a number already taken is skipped once and the loop always ends.
 */
function nextRefs_(kind, n, taken) {
  if (n === 0) return [];
  n = n || 1;
  var yearly = REF_YEARLY[kind] !== false, prefix = refPrefix_(kind);
  var year = localParts_(new Date()).date.slice(0, 4);
  var key = 'seq:' + kind + (yearly ? ':' + year : '');
  var props = PropertiesService.getScriptProperties();
  var cur = Math.max(0, Math.floor(Number(props.getProperty(key)) || 0)), out = [];
  var guard = n + (taken ? Object.keys(taken).length : 0) + 1; // each taken number is skipped at most once
  while (out.length < n) {
    if (guard-- <= 0) fail_('ref_exhausted');
    cur++;
    var ref = prefix + '-' + (yearly ? year + '-' + String(cur).padStart(5, '0') : String(cur).padStart(3, '0'));
    if (taken && taken[ref]) continue; // a code typed by hand earlier is never handed out again
    out.push(ref);
  }
  props.setProperty(key, String(cur));
  return out;
}
function nextRef_(kind, taken) { return nextRefs_(kind, 1, taken)[0]; }

function newId_(prefix) {
  return (prefix || '') + bytesToB64u_(randomBytes_(9));
}

function sha256Hex_(str) {
  return sha256_(utf8Bytes_(str)).map(function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
}

// ---------------- signed session tokens ----------------

var TOKEN_SECRET_ = null; // one properties read per request, not one per token
function tokenSecret_() {
  if (TOKEN_SECRET_) return TOKEN_SECRET_;
  var p = PropertiesService.getScriptProperties();
  var s = p.getProperty('TOKEN_SECRET');
  if (!s) {
    s = bytesToB64u_(randomBytes_(32));
    p.setProperty('TOKEN_SECRET', s);
  }
  return (TOKEN_SECRET_ = s);
}

function hmac_(msg) {
  var sig = Utilities.computeHmacSha256Signature(msg, tokenSecret_());
  return bytesToB64u_(sig.map(function (b) { return b & 255; }));
}

/** method: 'dev' (a registered device: PIN or passkey) or 'pw' (password, any device). */
function issueToken_(emp, method) {
  var hours = ROLES[emp.role] >= ROLES.hr ? CONFIG.ADMIN_TOKEN_HOURS : CONFIG.EMP_TOKEN_HOURS;
  var body = bytesToB64u_(utf8Bytes_(JSON.stringify({ e: emp.id, v: Number(emp.tokenVer || 0), x: Date.now() + hours * 3600000, m: method === 'pw' ? 'pw' : 'dev' })));
  return body + '.' + hmac_(body);
}

function readToken_(token) {
  if (!token || typeof token !== 'string') return null;
  var parts = token.split('.');
  if (parts.length !== 2) return null;
  if (!safeEqual_(hmac_(parts[0]), parts[1])) return null;
  var p;
  try { p = JSON.parse(bytesToUtf8_(b64uToBytes_(parts[0]))); } catch (e) { return null; }
  if (!p || Date.now() > p.x) return null;
  var emp = findBy_(SHEETS.EMP, 'id', p.e);
  if (!emp || emp.status !== 'active' || Number(emp.tokenVer || 0) !== p.v) return null;
  emp._auth = p.m || 'dev';
  return emp;
}

function safeEqual_(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  var r = 0;
  for (var i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// ---------------- rate limiting ----------------

function rateLimit_(key, max, seconds) {
  var c = CacheService.getScriptCache();
  var k = 'rl:' + key;
  var n = Number(c.get(k) || 0);
  if (n >= max) return false;
  c.put(k, String(n + 1), seconds);
  return true;
}

// ---------------- HTTP ----------------

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return json_({ ok: true, service: 'bestgas-attendance', time: new Date().toISOString(), bigint: typeof BigInt === 'function' });
}

function doPost(e) {
  var req;
  try { req = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'bad_request' }); }
  return json_(handle_(req));
}

var PUBLIC_ACTIONS = {
  ping: 1, bootstrapStatus: 1, bootstrap: 1, enrollBegin: 1, enrollFinish: 1,
  authBegin: 1, authFinish: 1, punchBegin: 1, punchFinish: 1, adminRecover: 1, pwLogin: 1, pinChange: 1, diag: 1, demoData: 1
};
var EMP_ACTIONS = { me: 1, myHistory: 1, passwordSet: 1, punchPw: 1, compCycleSave: 1, compCycleList: 1, compPropose: 1, compCycleClose: 1, finalSettlementCreate: 1, finalSettlementDecide: 1, finalSettlementPaid: 1, finalSettlementList: 1, myFinalSettlement: 1, myExitSurvey: 1, exitSurveySubmit: 1, kudosSend: 1, kudosFeed: 1, exitSurveyResults: 1, kudosStats: 1,
  myFile: 1, hrEmpFile: 1, hrTeam: 1, hrCompList: 1, hrCompPropose: 1, hrCompDecide: 1,
  myRequests: 1, requestQuote: 1, requestCreate: 1, requestCancel: 1, reqInbox: 1, reqDecide: 1, holidayList: 1, leaveTeam: 1,
  mySlips: 1, payrollList: 1, payrollGet: 1, payrollCreate: 1, payrollRecalc: 1, payrollApprove: 1, payrollDelete: 1, payrollAdjSave: 1,
  payrollAdjDelete: 1, payrollExport: 1, payrollEmail: 1, eosQuote: 1,
  dashboard: 1, myPerformance: 1, perfTeam: 1, perfEmp: 1, kpiSave: 1, kpiMid: 1, reviewSelf: 1, reviewManager: 1, reviewAck: 1, feedbackSubmit: 1, feedbackResults: 1,
  reportCatalog: 1, reportRun: 1, reportExport: 1, reportLog: 1, reportReview: 1, reportVerify: 1,
  onboardList: 1, onboardTask: 1, mySurveys: 1, surveyAnswer: 1, surveyResults: 1, policyList: 1, policyAck: 1, planSave: 1, planList: 1, planCheckIn: 1, planAck: 1,
  myTasks: 1, delegationSave: 1, delegationList: 1, delegationRevoke: 1, wpsFile: 1, wpsStep: 1, reconUpload: 1, reconList: 1, reconResolve: 1, complianceCalendar: 1, shiftList: 1, rosterList: 1,
  discCodes: 1, discOpen: 1, discList: 1, discRespond: 1, discObject: 1, injuryReport: 1, injuryList: 1,
  assetList: 1, assetAck: 1, assetCharge: 1, clearanceList: 1, clearanceTask: 1,
  // government services, expenses, journal: each checks its own roles inside (payroll holders may be plain employees)
  myGov: 1, govOverview: 1, govVisaReturn: 1, iqamaRenew: 1, govFeeSave: 1, govFeeVerify: 1, govFeeVoid: 1, ticketUseApprove: 1,
  myExpenses: 1, expenseCheck: 1, expenseCreate: 1, expenseCancel: 1, expenseInbox: 1, expenseDecide: 1, expensePaid: 1, expenseReport: 1, expenseLimitsSave: 1,
  journalList: 1, journalBuild: 1, journalStep: 1, journalMapGet: 1, journalMapSave: 1, bankSetupSave: 1,
  // leave cycle and approvals centre (Flows.gs): each checks the owner or role inside
  approvalsInbox: 1, approvalsAct: 1, approvalHistory: 1, leaveCycleList: 1, myLeaveCycles: 1, leaveCycleTask: 1, leaveCycleDepart: 1, leaveCycleReturn: 1, leaveCycleConfirm: 1,
  // Wave 2 (2026-10-14): each checks its own roles inside (hiring managers, interview panels, payroll holders, executives)
  recruitReqList: 1, recruitReqSave: 1, recruitReqDecide: 1, recruitCandList: 1, recruitCandGet: 1, recruitInterviewFeedback: 1, recruitOfferDecide: 1, recruitBoard: 1,
  loanQuote: 1, loanCreate: 1, loanCancel: 1, loanDecide: 1, loanDisburse: 1, loanSettle: 1, loanSettleVerify: 1, myLoans: 1, loanList: 1, loanPolicySave: 1,
  myTraining: 1, trainRequest: 1, trainDecide: 1, trainSessionList: 1, trainMatrix: 1, courseList: 1, trainEnrol: 1,
  myInsurance: 1, insDependantRequest: 1, insList: 1, insCost: 1,
  myAnnouncements: 1, annRead: 1,
  hdCreate: 1, hdMine: 1, hdList: 1, hdGet: 1, hdReply: 1, hdAssign: 1, hdStatus: 1, hdRate: 1 };
var HR_ACTIONS = { resignationDefer: 1, recruitReqClose: 1, recruitCandSave: 1, recruitCandStage: 1, recruitInterviewSave: 1, recruitOfferSave: 1, recruitOfferSend: 1, recruitOfferRespond: 1,
  recruitOfferLetter: 1, recruitHire: 1, courseSave: 1, trainSessionSave: 1, trainMark: 1, certRecord: 1, insPolicySave: 1, insPolicyList: 1, insMemberAdd: 1,
  insMemberDelete: 1, insMoveStep: 1, annSave: 1, annPublish: 1, annArchive: 1, annList: 1, flowList: 1, flowSave: 1, flowSettingsSave: 1, leaveCycleOpen: 1, discNotice: 1, govVisaIssue: 1, govVisaCancel: 1, govFinalExit: 1, ticketSave: 1, ticketUse: 1, assetSave: 1, assetAssign: 1, assetReturn: 1, clearanceStart: 1, discCodesSave: 1, discHearing: 1, discDecide: 1, discObjectionDecide: 1, injuryUpdate: 1, shiftSave: 1, rosterSave: 1, rosterDelete: 1, onboardStart: 1, surveySave: 1, surveyClose: 1, policySave: 1, planClose: 1, perfCycleSave: 1, perfCycleList: 1, perfCycleStage: 1, perfOverview: 1, perfCalibrate: 1, feedbackLaunch: 1, hrBootstrap: 1, holidaySave: 1, holidayDelete: 1, leaveBalances: 1, leaveOpeningSave: 1, hrDirectory: 1, hrDeptList: 1, hrDeptSave: 1, hrPositionList: 1, hrPositionSave: 1, hrEmpSave: 1,
  hrPrivateSave: 1, hrImportValidate: 1, hrImportCommit: 1, hrDocList: 1, hrDocSave: 1, hrExpiring: 1, empPasswordReset: 1, board: 1, empList: 1, zoneList: 1, report: 1, reviewList: 1, reviewDecide: 1, manualPunch: 1, auditList: 1, settingsGet: 1, empSave: 1, empActivation: 1 };
/**
 * Actions that only read (plus the audit line of a salary view). They may use the cached tab copies;
 * update_ refuses a cached row, so a mistake here fails loudly instead of overwriting the Sheet.
 */
var READ_ONLY_ACTIONS = { myFinalSettlement: 1, myExitSurvey: 1, kudosFeed: 1, exitSurveyResults: 1, kudosStats: 1, me: 1, myHistory: 1, myFile: 1, hrEmpFile: 1, hrTeam: 1, hrCompList: 1, hrDirectory: 1, hrDeptList: 1,
  hrPositionList: 1, hrDocList: 1, hrExpiring: 1, hrBootstrap: 1, hrImportValidate: 1, board: 1, empList: 1, zoneList: 1, report: 1,
  reviewList: 1, auditList: 1, settingsGet: 1, myRequests: 1, requestQuote: 1, reqInbox: 1, holidayList: 1, leaveTeam: 1, leaveBalances: 1,
  dashboard: 1, mySlips: 1, payrollList: 1, payrollGet: 1, eosQuote: 1, myPerformance: 1, perfTeam: 1, perfEmp: 1, feedbackResults: 1, perfCycleList: 1, perfOverview: 1,
  reportCatalog: 1, reportRun: 1, reportLog: 1, onboardList: 1, mySurveys: 1, surveyResults: 1, policyList: 1, planList: 1, myTasks: 1, delegationList: 1, reconList: 1, complianceCalendar: 1, wpsFile: 1, shiftList: 1, rosterList: 1, discCodes: 1, discList: 1, injuryList: 1, assetList: 1, clearanceList: 1,
  myGov: 1, govOverview: 1, myExpenses: 1, expenseCheck: 1, expenseInbox: 1, expenseReport: 1, journalList: 1, journalBuild: 1, journalMapGet: 1,
  approvalsInbox: 1, approvalHistory: 1, leaveCycleList: 1, myLeaveCycles: 1, flowList: 1,
  recruitReqList: 1, recruitCandList: 1, recruitCandGet: 1, recruitBoard: 1, recruitOfferLetter: 1, loanQuote: 1, myLoans: 1, loanList: 1,
  myTraining: 1, trainSessionList: 1, trainMatrix: 1, courseList: 1, myInsurance: 1, insList: 1, insCost: 1, insPolicyList: 1,
  myAnnouncements: 1, annList: 1, hdMine: 1, hdList: 1, hdGet: 1 };

var ADMIN_ACTIONS = { hrRolesSave: 1, empResetDevice: 1, zoneSave: 1, zoneDelete: 1, settingsSave: 1 };

function handle_(req) {
  READ_MEMO_ = {};
  USE_TAB_CACHE_ = false;
  TAB_PREFETCH_ = null;
  var action = req && req.action;
  if (READ_ONLY_ACTIONS[action]) USE_TAB_CACHE_ = true;
  try {
    var fn = /^[a-zA-Z]+$/.test(String(action)) ? globalThis['api_' + action] : null;
    if (typeof fn !== 'function') return { ok: false, error: 'unknown_action' };
    if (PUBLIC_ACTIONS[action]) return fn(req, null);
    var me = readToken_(req.token);
    if (!me) return { ok: false, error: 'session_expired' };
    if (me._auth === 'pw' && (me.pwMustChange === true || me.pwMustChange === 'true' || me.pwMustChange === 'TRUE') && action !== 'passwordSet' && action !== 'me') {
      return { ok: false, error: 'password_change_required' };
    }
    var level = ROLES[me.role] || 0;
    if (!READ_ONLY_ACTIONS[action] && typeof resignationDeemedSweep_ === 'function') resignationDeemedSweep_(); // Leave.gs, at most hourly
    if (EMP_ACTIONS[action] && level >= 1) return fn(req, me);
    if (HR_ACTIONS[action] && level >= ROLES.hr) return fn(req, me);
    if (ADMIN_ACTIONS[action] && level >= ROLES.admin) return fn(req, me);
    return { ok: false, error: 'forbidden' };
  } catch (err) {
    var msg = String(err && err.message || err);
    if (msg.indexOf('E:') === 0) return { ok: false, error: msg.slice(2) };
    console.error(action + ': ' + msg + '\n' + (err && err.stack));
    return { ok: false, error: 'server_error' };
  }
}

function fail_(code) { throw new Error('E:' + code); }

/**
 * Hooks the Wave 2 modules register at load time (file order does not matter: the lists are read per request).
 * 'tasks': fn(me, ctx, add) adds bell items in myTasks; 'calendar': fn(add, ctx, today, me) adds compliance-calendar items.
 */
var HRIS_HOOKS_ = { tasks: [], calendar: [] };
function hrisHook_(kind, fn) { (HRIS_HOOKS_[kind] = HRIS_HOOKS_[kind] || []).push(fn); }
function hrisHooks_(kind) { return HRIS_HOOKS_[kind] || []; }

/** Run once from the Apps Script editor so Google asks the owner to approve the sheet access. */
function authorize() { ss_(); sheet_(SHEETS.EMP); return 'ok'; }

function api_ping() { return { ok: true, time: new Date().toISOString() }; }

function publicEmp_(e) {
  return {
    id: e.id, empNo: String(e.empNo), name: e.name, nameEn: e.nameEn, email: e.email, phone: String(e.phone || ''),
    department: e.department, title: e.title, role: e.role, status: e.status,
    zoneIds: String(e.zoneIds || ''), shiftStart: e.shiftStart, shiftEnd: e.shiftEnd, workdays: String(e.workdays || '')
  };
}
