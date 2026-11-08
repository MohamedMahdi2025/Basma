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
  RP_NAME: 'BASMA',
  RP_ID: 'besgasksa.github.io',
  ORIGINS: ['https://besgasksa.github.io', 'https://mohamedmahdi2025.github.io'], // the old and the new BASMA home (2026-11-04)
  NEW_HOME: 'https://mohamedmahdi2025.github.io/',
  TZ_OFFSET_MIN: 180, // Asia/Riyadh, no DST
  HOME_ORG_ID: '1001', // the organisation this script's own spreadsheet belongs to (Best Gas); script property HOME_ORG_ID overrides
  EMP_TOKEN_HOURS: 12,
  ADMIN_TOKEN_HOURS: 8,
  CHALLENGE_SECONDS: 180,
  ACTIVATION_HOURS: 72,
  ACTIVATION_MAX_TRIES: 5
};

var SHEETS = { BUDGET: 'payBudgets', SIGN: 'signRequests', AUTO: 'autoRules', AUTOT: 'autoTasks', GOSIS: 'gosiSync', CELEB: 'celebPrefs', ALUM: 'alumni', SVA: 'surveyActions', MPROF: 'mentorProfiles', MSHIP: 'mentorships', MSESS: 'mentorSessions', SKILL: 'skills', ESKILL: 'empSkills', PSKILL: 'positionSkills', CALF: 'calendarFeeds', LTPL: 'letterTemplates', QUIZ: 'quizzes', QATT: 'quizAttempts', CWINV: 'agencyInvoices', CWH: 'contractorHours', CWAG: 'agencies', CW: 'contractors', RETRO: 'retroLog', GRADE: 'salaryGrades', PUSH: 'pushSubs', PPE: 'ppeIssues', HSEA: 'hseActions', HSE: 'hseReports', PNOTE: 'presenceNotes', BRAND: 'branding', WHOUT: 'webhookOutbox', HOOK: 'webhooks', APIKEY: 'apiKeys', PGRP: 'payGroups', SNAP: 'snapshots', RSUB: 'reportSubs', KIOSK: 'kiosks', NLOG: 'notifyLog', PERK: 'perks', CPATH: 'careerPaths', SUCC: 'successionPlans', POT: 'potentialRatings', KB: 'kbArticles', GOAL: 'goals', OOO: 'oneOnOnes', WFP: 'workforcePlans', CPOST: 'careerPosts', OSH: 'shiftOffers', EMP: 'employees', CRED: 'credentials', ZONES: 'zones', PUNCH: 'punches', AUDIT: 'audit', SET: 'settings',
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
  EXS: 'exitSurveys', KUD: 'kudos', FSET: 'finalSettlements', CRC: 'compCycles', CRP: 'compProposals', TSH: 'timesheets', CFD: 'customFields', CFV: 'empCustom' }; // Wave 3 (Engage.gs): exit interview, recognition

var HEADERS = {
  agencyInvoices: ['id', 'ref', 'agencyId', 'month', 'number', 'amount', 'expected', 'diff', 'flagged', 'status', 'recordedBy', 'decidedBy', 'decidedAt', 'note', 'createdAt', 'updatedAt'],
  contractorHours: ['id', 'contractorId', 'month', 'hours', 'days', 'note', 'status', 'recordedBy', 'decidedBy', 'decidedAt', 'createdAt', 'updatedAt'],
  agencies: ['id', 'name', 'cr', 'contact', 'phone', 'email', 'contractEnd', 'status', 'createdAt', 'updatedAt'],
  contractors: ['id', 'ref', 'name', 'nameEn', 'kind', 'agencyId', 'title', 'departmentId', 'supervisorId', 'idNo', 'phone', 'email', 'startDate', 'endDate', 'rate', 'rateUnit', 'poNumber', 'note', 'status', 'createdBy', 'createdAt', 'updatedAt'],
  retroLog: ['id', 'ref', 'empId', 'month', 'paid', 'should', 'days', 'diff', 'adjId', 'payMonth', 'compRef', 'status', 'createdBy', 'createdAt'],
  salaryGrades: ['id', 'code', 'nameAr', 'nameEn', 'basis', 'min', 'mid', 'max', 'note', 'status', 'createdBy', 'createdAt', 'updatedBy', 'updatedAt'],
  pushSubs: ['id', 'empId', 'endpoint', 'endpointHash', 'ua', 'status', 'lastCount', 'lastCheckedAt', 'lastSentAt', 'createdAt', 'updatedAt'],
  ppeIssues: ['id', 'empId', 'item', 'itemName', 'size', 'qty', 'issuedOn', 'replaceBy', 'issuedBy', 'status', 'ackAt', 'note', 'createdAt', 'updatedAt'],
  hseActions: ['id', 'ref', 'reportId', 'title', 'ownerId', 'dueDate', 'status', 'doneNote', 'doneAt', 'verifiedBy', 'verifiedAt', 'createdBy', 'createdAt', 'updatedAt'],
  celebPrefs: ['empId', 'showBirthday', 'updatedAt'],
  alumni: ['empId', 'rehire', 'reason', 'decidedBy', 'updatedAt'],
  surveyActions: ['id', 'ref', 'surveyId', 'area', 'title', 'ownerId', 'dueDate', 'status', 'doneNote', 'doneAt', 'createdBy', 'createdAt'],
  mentorProfiles: ['empId', 'offer', 'topics', 'capacity', 'updatedAt'],
  mentorships: ['id', 'ref', 'mentorId', 'menteeId', 'goal', 'status', 'startDate', 'endDate', 'createdBy', 'createdAt'],
  mentorSessions: ['id', 'mentorshipId', 'date', 'notes', 'byId', 'createdAt'],
  skills: ['id', 'code', 'nameAr', 'nameEn', 'category', 'status', 'updatedAt'],
  empSkills: ['id', 'empId', 'skillId', 'level', 'evidence', 'verifiedBy', 'verifiedAt', 'updatedAt'],
  positionSkills: ['id', 'positionId', 'skillId', 'level'],
  calendarFeeds: ['empId', 'tokenHash', 'createdAt'],
  letterTemplates: ['id', 'kind', 'lang', 'title', 'body', 'version', 'status', 'updatedBy', 'updatedAt'],
  quizzes: ['id', 'ref', 'title', 'courseId', 'passMark', 'questionsJson', 'status', 'createdBy', 'updatedAt'],
  quizAttempts: ['id', 'quizId', 'empId', 'score', 'passed', 'answersJson', 'at', 'certNo'],
  gosiSync: ['id', 'empId', 'kind', 'wage', 'ref', 'date', 'doneBy', 'doneAt'],
  payBudgets: ['id', 'month', 'departmentId', 'amount', 'note', 'updatedBy', 'updatedAt'],
  signRequests: ['id', 'ref', 'kind', 'title', 'body', 'docHash', 'empId', 'status', 'requestedBy', 'requestedAt', 'dueDate', 'signedName', 'signedAt', 'seal', 'declineNote', 'declinedAt', 'v'],
  autoRules: ['id', 'ref', 'name', 'trigger', 'days', 'audience', 'message', 'status', 'createdBy', 'createdAt', 'updatedAt'],
  autoTasks: ['id', 'ruleId', 'empId', 'assigneeId', 'audience', 'key', 'title', 'eventDate', 'dueDate', 'status', 'doneBy', 'doneAt', 'createdAt'],
  hseReports: ['id', 'ref', 'kind', 'severity', 'occurredAt', 'place', 'zoneId', 'description', 'immediateAction', 'anonymous', 'reportedBy', 'status', 'investigatorId', 'rootCause', 'rootCategory', 'injuryId', 'closedNote', 'createdAt', 'updatedAt'],
  presenceNotes: ['id', 'empId', 'text', 'until', 'updatedAt'],
  branding: ['key', 'value', 'updatedAt', 'updatedBy'],
  webhookOutbox: ['id', 'hookId', 'event', 'dedupe', 'payloadJson', 'status', 'attempts', 'nextAt', 'lastCode', 'lastError', 'createdAt', 'sentAt'],
  webhooks: ['id', 'url', 'eventsJson', 'ver', 'status', 'createdBy', 'createdAt', 'lastStatus', 'lastAt', 'fails'],
  apiKeys: ['id', 'keyId', 'label', 'scopesJson', 'hash', 'status', 'createdBy', 'createdAt', 'lastUsedAt', 'uses'],
  payGroups: ['id', 'code', 'nameAr', 'nameEn', 'payDay', 'cutoffDay', 'costCenter', 'wpsEstablishment', 'managersJson', 'status', 'createdBy', 'createdAt', 'updatedAt'],
  snapshots: ['id', 'snapId', 'month', 'part', 'parts', 'kind', 'asOf', 'takenAt', 'takenBy', 'status', 'hash', 'data'],
  reportSubs: ['id', 'code', 'ownerId', 'reportId', 'label', 'lang', 'paramsJson', 'columnsJson', 'labelsJson', 'period', 'cadence', 'weekday', 'monthDay', 'hour', 'recipientsJson', 'status', 'nextRunAt', 'lastRunAt', 'lastStatus', 'lastRef', 'fails', 'createdAt', 'updatedAt'],
  kiosks: ['id', 'code', 'label', 'zoneId', 'ver', 'status', 'createdBy', 'createdAt', 'lastSeenAt'],
  notifyLog: ['id', 'empId', 'date', 'count', 'status', 'at'],
  perks: ['id', 'category', 'titleAr', 'titleEn', 'provider', 'descAr', 'descEn', 'howAr', 'howEn', 'link', 'validTo', 'status', 'views', 'createdBy', 'createdAt', 'updatedAt'],
  careerPaths: ['id', 'fromPositionId', 'toPositionId', 'years', 'requirementsAr', 'requirementsEn', 'status', 'createdBy', 'createdAt', 'updatedAt'],
  successionPlans: ['id', 'positionId', 'incumbentEmpId', 'flightRisk', 'successorsJson', 'note', 'status', 'updatedBy', 'updatedAt', 'createdAt'],
  potentialRatings: ['id', 'empId', 'potential', 'note', 'by', 'at'],
  kbArticles: ['id', 'ref', 'category', 'titleAr', 'titleEn', 'bodyAr', 'bodyEn', 'keywords', 'status', 'views', 'helpful', 'notHelpful', 'deflected', 'updatedBy', 'updatedAt', 'createdAt'],
  goals: ['id', 'empId', 'title', 'measure', 'dueDate', 'progress', 'status', 'checkinsJson', 'createdBy', 'createdAt', 'updatedAt'],
  oneOnOnes: ['id', 'empId', 'managerId', 'date', 'status', 'agendaJson', 'actionsJson', 'notesShared', 'notesPrivate', 'privateBy', 'createdAt', 'updatedAt'],
  workforcePlans: ['id', 'year', 'deptId', 'planned', 'note', 'updatedBy', 'updatedAt'],
  careerPosts: ['id', 'reqId', 'status', 'titleAr', 'titleEn', 'summaryAr', 'summaryEn', 'requirementsAr', 'requirementsEn', 'city', 'closesOn', 'applications', 'createdBy', 'createdAt', 'updatedAt', 'audience'],
  shiftOffers: ['id', 'ref', 'kind', 'shiftId', 'peerShiftId', 'date', 'deptId', 'note', 'status', 'postedBy', 'empId', 'peerId', 'warnings', 'decidedBy', 'decidedAt', 'decisionNote', 'createdAt', 'updatedAt'],
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
    'ramadanReduced', 'outdoor',
    // pay groups (2026-10-21): '' = the general group
    'payGroupId'],
  credentials: ['credId', 'empId', 'x', 'y', 'signCount', 'label', 'status', 'createdAt', 'lastUsedAt', 'aaguid', 'kind',
    'platform', 'pinHash', 'pinSalt', 'pinTries', 'pinLockUntil', 'devId', 'pinLoginTries'],
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
  documents: ['id', 'empId', 'type', 'number', 'issueDate', 'expiryDate', 'note', 'status', 'createdAt', 'updatedAt', 'ref', 'fileId', 'fileName', 'fileMime', 'fileSize', 'fileAt', 'fileBy'],
  requests: ['id', 'ref', 'empId', 'type', 'subtype', 'fromDate', 'toDate', 'days', 'amount', 'months', 'payloadJson', 'reason', 'docNo',
    'status', 'step', 'stepsJson', 'effectJson', 'createdAt', 'updatedAt', 'decidedAt',
    'flowJson'], // the approval flow fixed when the request was made (Flows.gs); empty = the built-in chain
  holidays: ['id', 'date', 'toDate', 'nameAr', 'nameEn', 'createdBy', 'createdAt', 'status'],
  payrollRuns: ['id', 'ref', 'month', 'status', 'preparedBy', 'preparedAt', 'approvedBy', 'approvedAt', 'totalsJson', 'note', 'emailedAt', 'createdAt', 'updatedAt',
    'scope', 'payGroupId'], // payGroupId: one run per pay group per month ('' the general group). scope '' = the company's payroll; 'demo' = a run over the demo company only (Demo.gs), never mixed with the real one
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
  // custom fields on the employee file (Hr.gs, Wave 3)
  customFields: ['id', 'key', 'labelAr', 'labelEn', 'type', 'optionsJson', 'visibleTo', 'status', 'order', 'createdAt', 'updatedAt'],
  empCustom: ['id', 'empId', 'fieldId', 'value', 'updatedBy', 'updatedAt'],
  // monthly timesheet approval (Attendance.gs, Wave 3)
  timesheets: ['id', 'empId', 'month', 'status', 'totalsJson', 'approvedBy', 'approvedAt', 'note'],
  // annual pay review CR (Payroll.gs, Wave 3)
  compCycles: ['id', 'ref', 'name', 'effectiveFrom', 'budgetPct', 'basis', 'status', 'note', 'createdBy', 'createdAt', 'closedAt'],
  compProposals: ['id', 'cycleId', 'empId', 'pct', 'note', 'proposedBy', 'status', 'updatedAt'],
  finalSettlements: ['id', 'ref', 'empId', 'lastDay', 'reason', 'quoteJson', 'net', 'status', 'preparedBy', 'preparedAt', 'approvedBy', 'approvedAt', 'paidOn', 'paidRef', 'paidBy', 'note', 'createdAt', 'updatedAt']
};

var ROLES = { employee: 1, hr: 2, admin: 3 };

var REQ_HOST_ = ''; // the domain the request comes from, when it is one of ours: passkeys are made for that domain
function cfg_() {
  var p = PropertiesService.getScriptProperties();
  var rp = p.getProperty('RP_ID');
  var or = p.getProperty('ORIGINS'), origins = CONFIG.ORIGINS.slice();
  if (or) or.split(',').forEach(function (s) { s = s.trim(); if (s && origins.indexOf(s) < 0) origins.push(s); });
  var hosts = origins.map(function (o) { return String(o).replace(/^https?:\/\//, '').replace(/[:\/].*$/, ''); });
  if (rp && hosts.indexOf(rp) < 0) hosts.push(rp);
  return { rpId: REQ_HOST_ && hosts.indexOf(REQ_HOST_) >= 0 ? REQ_HOST_ : (rp || CONFIG.RP_ID), origins: origins, hosts: hosts };
}

// ---------------- sheet database ----------------

var SHEET_CACHE_ = {};

/** The current organisation's own spreadsheet: the bound one for the home organisation, its own book for every other. */
function ss_() {
  if (!ORG_ || ORG_.home) return SpreadsheetApp.getActiveSpreadsheet();
  return ORG_SS_ || (ORG_SS_ = restBook_(ORG_.sheetId)); // its own book, over the Sheets API (no new scope)
}

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
  var hk = 'hdr:v1:' + name, len = String(HEADERS[name].length);
  if (width === undefined) { try { if (cache_().get(hk) === len) { HEADER_OK_[name] = true; return; } } catch (e) {} }
  if ((width === undefined ? sh.getLastColumn() : width) < HEADERS[name].length) sh.getRange(1, 1, 1, HEADERS[name].length).setValues([HEADERS[name]]);
  HEADER_OK_[name] = true;
  try { cache_().put(hk, len, 21600); } catch (e) {}
}

// Each sheet is read once per request. Apps Script sheet reads cost 100-600 ms each,
// and one request used to read the same tab three or four times.
var READ_MEMO_ = {}, READ_LEN_ = {}; // READ_LEN_: rows in the sheet when it was read (header included), so an append knows its row number
function forget_(name) { delete READ_MEMO_[name]; delete READ_LEN_[name]; if (typeof TAIL_MEMO_ !== 'undefined') delete TAIL_MEMO_[name]; }
/** After appendRow: the memo gets the new row instead of being dropped, so the same request does not read the tab again. */
function memoAppend_(name, obj) {
  var m = READ_MEMO_[name];
  if (!m || READ_LEN_[name] == null || (m[0] && m[0]._cached)) { forget_(name); return; }
  var o = {}; HEADERS[name].forEach(function (k) { o[k] = obj[k] == null ? '' : obj[k]; });
  READ_LEN_[name] += 1; o._row = READ_LEN_[name]; m.push(o);
}

/*
 * Sign-in reads the employees and zones tabs but never writes them, and each tab read costs
 * 250-900 ms. Those two paths may use a copy in CacheService (about 50 ms) that is trusted only
 * while its version tag matches the tab's current version. Every write through the app and every
 * hand edit in the Sheet (onEdit) sets a new version, so a changed tab is read fresh at once;
 * the copy also lapses after 60 s whatever happens. Rows from the copy are marked and can never
 * be written back (update_ refuses), so the copy cannot overwrite the Sheet.
 */
// Every small tab can be served from the copy; punches and audit grow without end and are always read.
var CACHED_TABS_ = { payBudgets: 1, autoRules: 1, celebPrefs: 1, alumni: 1, surveyActions: 1, mentorProfiles: 1, mentorships: 1, mentorSessions: 1, skills: 1, empSkills: 1, positionSkills: 1, letterTemplates: 1, quizzes: 1, agencyInvoices: 1, contractorHours: 1, agencies: 1, contractors: 1, retroLog: 1, salaryGrades: 1, pushSubs: 1, ppeIssues: 1, hseActions: 1, hseReports: 1, presenceNotes: 1, branding: 1, webhookOutbox: 1, webhooks: 1, apiKeys: 1, payGroups: 1, snapshots: 1, reportSubs: 1, kiosks: 1, notifyLog: 1, perks: 1, careerPaths: 1, successionPlans: 1, potentialRatings: 1, kbArticles: 1, goals: 1, oneOnOnes: 1, workforcePlans: 1, careerPosts: 1, shiftOffers: 1, employees: 1, zones: 1, credentials: 1, departments: 1, positions: 1, empPrivate: 1, compensation: 1,
  jobHistory: 1, documents: 1, requests: 1, holidays: 1, payrollRuns: 1, adjustments: 1, perfCycles: 1, kpis: 1, reviews: 1, feedback360: 1,
  onboarding: 1, surveys: 1, policies: 1, policyAcks: 1, devPlans: 1, delegations: 1, wpsLog: 1, salaryRecon: 1, shifts: 1, roster: 1, discCodes: 1, discCases: 1, injuries: 1, assets: 1, custody: 1, clearance: 1,
  govVisas: 1, iqamaRenewals: 1, govFees: 1, ticketRights: 1, ticketUses: 1, expenseClaims: 1, journalLog: 1,
  leaveCycles: 1, approvalFlows: 1,
  requisitions: 1, candidates: 1, interviews: 1, offers: 1, loans: 1, courses: 1, trainSessions: 1, trainEnrol: 1, insPolicies: 1, insMembers: 1, insMoves: 1,
  announcements: 1, annReads: 1, hdTickets: 1, exitSurveys: 1, kudos: 1, finalSettlements: 1, compCycles: 1, compProposals: 1, timesheets: 1, customFields: 1, empCustom: 1 };
var USE_TAB_CACHE_ = false; // true: every cached tab; an object: only those tabs (sign-in writes credentials)
// Version tags make app writes and hand edits visible at once; the expiry only bounds what Sheets
// never reports to onEdit (deleting or sorting rows by hand).
var TAB_CACHE_SECONDS_ = 7200; // every app write and hand edit makes a new version at once; only hand row deletes / sorts wait for this
var READ_SHEET_ = []; // tabs this request read from the sheet itself (not memo, not cache): what to fetch together next time
var TAB_PART_ = 90000;
var TAB_PREFETCH_ = null;
function tabKeys_(name) { return { snap: 'tab:v2:' + name, ver: 'tabver:v1:' + name }; }
function bumpTab_(name) {
  if (name === SHEETS.SET) SETTINGS_MEMO_ = null; // a settings write is seen by the rest of the same request
  if (!CACHED_TABS_[name]) return;
  if (TAB_PREFETCH_) delete TAB_PREFETCH_[name];
  try { cache_().put(tabKeys_(name).ver, bytesToB64u_(randomBytes_(9)), 21600); } catch (e) {}
}
/** One CacheService call for the version and copy of every cached tab (about 50 ms in all). */
function prefetchTabs_() {
  TAB_PREFETCH_ = {};
  var keys = [];
  Object.keys(CACHED_TABS_).forEach(function (n) { var k = tabKeys_(n); keys.push(k.snap, k.ver); });
  var got = {};
  try { got = cache_().getAll(keys) || {}; } catch (e) { got = {}; }
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
      var got = cache_().getAll(keys), s = '';
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
    // gathered: one putAll for every tab copied in this request (was one per tab, ~40 ms each)
    if (!STORE_Q_) STORE_Q_ = {};
    Object.keys(put).forEach(function (x) { STORE_Q_[x] = put[x]; });
  } catch (e) {}
}
var STORE_Q_ = null;
function flushStore_() {
  var q = STORE_Q_; STORE_Q_ = null; if (!q) return;
  try { var ks = Object.keys(q); for (var i = 0; i < ks.length; i += 200) { var part = {}; ks.slice(i, i + 200).forEach(function (k) { part[k] = q[k]; }); cache_().putAll(part, TAB_CACHE_SECONDS_); } } catch (e) {}
}

/** Simple trigger: a hand edit in the Sheet makes the app read that tab fresh on the next request. */
function onEdit(e) {
  try {
    var name = e && e.range ? e.range.getSheet().getName() : '';
    if (name) bumpTab_(name);
    if (name === SHEETS.SET) settingsForget_();
  } catch (err) {}
}

/** Sheet values to row objects: vals[from..] are sheet rows firstRow, firstRow + 1, ... (blank rows skipped). */
function rowsOf_(cols, vals, from, firstRow) {
  var out = [];
  for (var i = from; i < vals.length; i++) {
    var o = { _row: firstRow + i - from }, blank = true;
    for (var c = 0; c < cols.length; c++) {
      var v = vals[i][c];
      if (v === undefined) v = '';
      if (v !== '') blank = false;
      o[cols[c]] = (v && typeof v === 'object' && typeof v.getTime === 'function') ? cellDate_(v) : v;
    }
    if (!blank) out.push(o);
  }
  return out;
}

/*
 * The newest rows of a tab that only grows at the bottom (punches): the last row number seen is kept in the organisation's
 * cache, and the read starts n rows above it and runs open-ended to the last row with data, so rows appended since are
 * always included. Answers { rows, start } or null when the tab is small (a full read is as cheap) or the size is unknown.
 * The rows carry their real _row, so they can be updated like any other.
 */
var TAIL_MEMO_ = {}, SINCE_MEMO_ = {};
function readTail_(name, n) {
  var last = 0; try { last = Number(cache_().get('lastrow:v1:' + name)) || 0; } catch (e) {}
  if (!last || last <= n + 1) return null;
  var sh = sheet_(name), cols = HEADERS[name], start = Math.max(2, last - n + 1), vals;
  if (typeof sh.tail === 'function') vals = sh.tail(start, cols.length); // REST book: one open-ended range
  else { var lr = sh.getLastRow(); if (lr < start) return null; vals = sh.getRange(start, 1, lr - start + 1, cols.length).getValues(); }
  try { cache_().put('lastrow:v1:' + name, String(start + vals.length - 1), 21600); } catch (e) {}
  READ_SHEET_.push(name);
  return { rows: rowsOf_(cols, vals, 0, start), start: start };
}

function readAll_(name) {
  if (READ_MEMO_[name]) return READ_MEMO_[name];
  var tag = null;
  if (USE_TAB_CACHE_ && CACHED_TABS_[name] && (USE_TAB_CACHE_ === true || USE_TAB_CACHE_[name])) {
    var c = cachedRows_(name);
    if (c && c.rows) return (READ_MEMO_[name] = c.rows);
    if (c) tag = c.ver;
  }
  READ_SHEET_.push(name);
  var sh = sheet_(name);
  var cols = HEADERS[name];
  // One call for header and rows together (was three: last column, last row, values).
  var vals = sh.getDataRange().getValues();
  ensureHeader_(name, sh, vals.length ? vals[0].length : 0);
  READ_LEN_[name] = vals.length;
  var out = rowsOf_(cols, vals, 1, 2);
  if (tag !== null) storeTab_(name, tag, out);
  READ_MEMO_[name] = out;
  try { cache_().put('lastrow:v1:' + name, String(vals.length), 21600); } catch (e) {}
  return out;
}

/**
 * A read-only look at a small tab from the versioned cache copy, even on actions that also write (sign-in, check-in):
 * ~50 ms instead of a 250-900 ms sheet read. The rows are not kept in the request memo, so nothing read here can be
 * written back. A missing or outdated copy is read from the sheet once and stored for the next request.
 */
function readQuick_(name) {
  if (READ_MEMO_[name]) return READ_MEMO_[name];
  if (!CACHED_TABS_[name]) return readAll_(name);
  var c = cachedRows_(name);
  if (c && c.rows) return c.rows;
  var rows = readAll_(name);
  if (c && c.ver != null) storeTab_(name, c.ver, rows);
  return rows;
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
  bumpTab_(name);
  var sh = sheet_(name);
  ensureHeader_(name, sh);
  sh.appendRow(toRow_(name, obj));
  bumpTab_(name); // again AFTER the write: a copy read between the first bump and the write is stale and must not be trusted
  memoAppend_(name, obj);
  SINCE_MEMO_ = {}; // a row written now belongs in any window read afterwards
  if (TAIL_MEMO_[name]) { var to = {}; HEADERS[name].forEach(function (k) { to[k] = obj[k] == null ? '' : obj[k]; }); TAIL_MEMO_[name].rows.push(to); }
  if (typeof whTap_ === 'function') whTap_(name, obj, true); // webhooks (Admin.gs)
}

/** One write for many rows: appendRow per row is far too slow for an import. */
function appendMany_(name, objs) {
  if (!objs.length) return;
  forget_(name);
  bumpTab_(name);
  var sh = sheet_(name);
  ensureHeader_(name, sh);
  sh.getRange(sh.getLastRow() + 1, 1, objs.length, HEADERS[name].length).setValues(objs.map(function (o) { return toRow_(name, o); }));
  bumpTab_(name);
  if (typeof whTap_ === 'function') objs.forEach(function (o) { whTap_(name, o, true); });
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
  bumpTab_(name); // again AFTER the write (see append_): no stale copy may outlive this change, e.g. a revoked session
  if (typeof whTap_ === 'function') whTap_(name, obj, false);
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

/**
 * Suspicious-activity log. One audit line (action 'sec_<kind>') for things an honest user does not do: calling an action the
 * role may not use, hitting a rate limit, calling an action that does not exist. Written at most once per kind, person (or
 * device) and detail every 10 minutes, so an attack cannot flood the sheet. Never records tokens, codes or request bodies:
 * only the kind, the action name and the device kind. HR and admin read it in the audit list and api_securityEvents.
 */
function secEvent_(kind, actorId, detail) {
  try {
    var who = String(actorId || REQ_DEV_ || 'anon'), d = String(detail || '').slice(0, 60);
    var k = 'secd:v1:' + kind + ':' + who + ':' + d, c = cache_();
    var n = Number(c.get(k) || 0);
    c.put(k, String(n + 1), 600);
    if (n > 0) return; // already logged in this window
    append_(SHEETS.AUDIT, { ts: new Date().toISOString(), actorId: actorId || '', action: 'sec_' + kind, targetId: '',
      detail: JSON.stringify({ what: d, device: REQ_DEV_ ? REQ_DEV_.slice(0, 2) + '..' + REQ_DEV_.slice(-4) : '' }) });
  } catch (e) { /* logging must never break the request */ }
}

// ---------------- settings ----------------

var DEFAULT_SETTINGS = {
  // Company profile (white-label: every letterhead, certificate, payslip and report header reads these)
  companyNameAr: 'شركة الناقل الأفضل للغاز', companyNameEn: 'Best Gas Carrier Co.', companyShortAr: 'الناقل الأفضل', companyShortEn: 'Best Gas',
  companyCr: '', companyVat: '', companyAddressAr: '', companyAddressEn: '',
  maxDevices: 3,             // devices one employee may have at once (phone, tablet, laptop); the oldest is retired past it
  sharedDevices: false,      // true: one device may hold several employees (a shared office tablet); off = one device, one employee
  compSelfApprove: false,    // HR may approve a salary change they entered (no second approver); off = four-eyes rule
  adminSeesPay: true,        // the system administrator also holds payroll; switch off to keep pay apart from administration
  wpsDueDay: 10,            // WPS / Mudad: salaries of month M uploaded by this day of month M+1 (check with the bank / Mudad)
  attachmentsEnabled: false, // document scans in Drive (Hr.gs api_docUpload): needs the drive.file and external_request scopes
  notifyDigest: false, notifyHour: 7, appUrl: '', aiAssistant: false, whatsappDigest: false, // daily e-mail digest (Payroll.gs notifySweep_): needs M365 properties and the external_request scope
  welcomeAr: '', welcomeEn: '', preboardDocs: '', // pre-boarding welcome text and documents to bring (Engage.gs api_welcome)
  internalMinMonths: 6,      // internal mobility: months of service before applying internally (Recruitment.gs)
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
  empNoPrefix: '',           // employee numbers: letters/digits before the number (e.g. WNS-), empty = digits only
  empNoDigits: 4,            // the number is padded to this many digits (0042); it grows past them when needed
  empNoStart: 1001,          // the first number handed out; later ones follow the highest already used with the prefix
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
  timesheetRequired: false,  // payroll lock waits for every approved monthly timesheet (Attendance.gs)
  loanPolicy: ''             // JSON {maxSalaries, maxMonths, minServiceMonths, oneActive}: employee loans (Loans.gs, loanPolicySave); empty = the defaults
};

var SETTINGS_CACHE_KEY = 'settings:v1';
var SETTING_MMDD_ = { summerBanFrom: 1, summerBanTo: 1 };

// One settings read per request (2026-10-26): settings_() is called 10-20 times in one request and each cache get costs ~50 ms.
var SETTINGS_MEMO_ = null;
function settingsForget_() { SETTINGS_MEMO_ = null; try { cache_().remove(SETTINGS_CACHE_KEY); } catch (e) {} }
function settings_() {
  if (SETTINGS_MEMO_) return Object.assign({}, SETTINGS_MEMO_); // a copy: a caller changing it must not change the next caller's
  var got = settingsLoad_(); SETTINGS_MEMO_ = got; return Object.assign({}, got);
}
function settingsLoad_() {
  try { var hit = cache_().get(SETTINGS_CACHE_KEY); if (hit) return JSON.parse(hit); } catch (e) {}
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
  try { cache_().put(SETTINGS_CACHE_KEY, JSON.stringify(s), 120); } catch (e) {}
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
  esign: 'ESG',
  autoRule: 'AUT',
  surveyAction: 'SVA',
  mentorship: 'MNT',
  skill: 'SKL',
  quiz: 'QZ',
  quizCert: 'QCRT',
  agencyInvoice: 'AINV',
  contractor: 'CWK',
  retro: 'RTR',
  hseAction: 'CAPA',
  hse: 'HSE',
  payGroup: 'PGR',
  reportSub: 'RSB',
  kiosk: 'KSK',
  kb: 'KB',
  open_shift: 'OSH',
  leave: 'LV', letter: 'LT', advance: 'AD', correction: 'AC', data_change: 'DC', resignation: 'RS', permission: 'PM', overtime: 'OT', travel: 'TR', remote: 'RW',
  salary: 'SAL', document: 'DOC', import: 'IMP', department: 'DEP', position: 'POS',
  payroll: 'PR', payslip: 'PS', adjustment: 'ADJ', perf_cycle: 'PC', kpi: 'KPI', review: 'PE', feedback: 'FB', report: 'RPT',
  onboarding: 'ONB', survey: 'SRV', policy: 'POL', idp: 'IDP', pip: 'PIP', delegation: 'DLG', wps: 'WPS', recon: 'REC', shift: 'SH', disciplinary: 'DSC', injury: 'INJ', asset: 'AST', clearance: 'CLR',
  exit_reentry: 'ERV', final_exit: 'FEX', iqama_renewal: 'IQR', gov_fee: 'GF', ticket: 'TKT', expense: 'EXP', journal: 'JV',
  leavecycle: 'LC', flow: 'AF',
  requisition: 'RQ', candidate: 'CND', interview: 'INT', offer: 'OFR', loan: 'LN', course: 'CRS', training: 'TRS', certificate: 'CRT',
  ins_policy: 'INP', insurance: 'INS', announcement: 'ANN', helpdesk: 'HD', exit_survey: 'EXS', settlement: 'FS', comp_cycle: 'CR'
};
var REF_YEARLY = { autoRule: false, skill: false, quiz: false, payGroup: false, reportSub: false, kiosk: false, kb: false, department: false, position: false, shift: false, asset: false, flow: false, course: false, ins_policy: false };

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
  var key = orgKey_('seq:' + kind + (yearly ? ':' + year : '')); // each organisation numbers its own documents
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

/** The next n employee numbers of this organisation: empNoPrefix + a number padded to empNoDigits, one above the highest
 *  number already used with that prefix and never below empNoStart. Read from the employees themselves under the lock,
 *  so a number typed by hand or imported is never handed out again and nothing drifts. */
function nextEmpNos_(n, emps) {
  var s = settings_(), prefix = String(s.empNoPrefix || '').trim(), digits = Math.min(8, Math.max(1, Math.round(Number(s.empNoDigits) || 4)));
  var start = Math.max(1, Math.round(Number(s.empNoStart) || 1001)), quoted = prefix.replace(/[.*+?^${}()|[\]\\]/g, function (c) { return '\\' + c; });
  var re = new RegExp('^' + quoted + '(\\d+)$'), max = start - 1, taken = {}, out = [];
  (emps || readAll_(SHEETS.EMP)).forEach(function (e) { var v = String(e.empNo == null ? '' : e.empNo).trim(); if (!v) return; taken[v] = 1; var m = v.match(re); if (m) max = Math.max(max, Number(m[1])); });
  while (out.length < (n || 1)) { max++; var no = prefix + String(max).padStart(digits, '0'); if (!taken[no]) { taken[no] = 1; out.push(no); } }
  return out;
}

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
  var body = bytesToB64u_(utf8Bytes_(JSON.stringify({ e: emp.id, v: Number(emp.tokenVer || 0), x: Date.now() + hours * 3600000, m: method === 'pw' ? 'pw' : 'dev', o: orgId_() })));
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
  if (String(p.o || homeOrgId_()) !== orgId_()) return null; // a session belongs to one organisation only
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
  var c = cache_();
  var k = 'rl:' + key;
  var n = Number(c.get(k) || 0);
  if (n >= max) { if (!/^sec/.test(String(key))) secEvent_('rate_limited', '', String(key).split(':')[0]); return false; }
  c.put(k, String(n + 1), seconds);
  return true;
}


// ---------------- organisations: one Org ID, one separate spreadsheet (SaaS tenancy, 2026-10-22) ----------------
// docs/research/2026-10-22-saas-tenancy-design.md. Every company (every CR) is an organisation with a numeric Org ID.
// Each organisation's data lives in its OWN Google spreadsheet: separate books, never rows of a shared table. Every
// request names its organisation (orgId, or the claim inside its session token); the backend then opens only that
// spreadsheet, prefixes every cache key, document-number counter and per-org setting with it, and refuses a token
// issued by another organisation. The spreadsheet this script is bound to is the home organisation (HOME_ORG_ID,
// Best Gas): its keys are unprefixed, so nothing of the live system moved.
var ORG_ = null, ORG_SS_ = null;
var ORG_REQUIRED_ = { pinLogin: 1, ssoLogin: 1, authBegin: 1, enrollBegin: 1, pwLogin: 1, adminRecover: 1, bootstrap: 1, orgCheck: 1 };
var PLATFORM_ACTIONS_ = { orgActivation: 1, orgRenumber: 1, orgBrandSet: 1, orgImport: 1, platformHealth: 1, orgCreate: 1, orgList: 1, orgSetStatus: 1, orgSetGroup: 1, orgOverview: 1 };
function homeOrgId_() { return PropertiesService.getScriptProperties().getProperty('HOME_ORG_ID') || CONFIG.HOME_ORG_ID; }
function orgRec_(id) {
  id = String(id || '');
  if (!/^\d{4,8}$/.test(id)) return null;
  if (id === homeOrgId_()) return { id: id, home: true, status: 'active', sheetId: '' };
  var raw = PropertiesService.getScriptProperties().getProperty('ORG:' + id);
  var o = raw ? parseJson_(raw, null) : null;
  if (!o) return null;
  o.id = id; o.home = false;
  return o;
}
/** Switches the request to one organisation: its spreadsheet, its cache and counters. Everything per request is reset. */
function setOrg_(o) {
  // Every per-request copy is dropped, so nothing read for one organisation can ever answer for another (orgOverview and
  // the platform actions switch organisation inside one request).
  var same = ORG_ && o && ORG_.id === o.id;
  if (typeof flushStore_ === 'function' && ORG_) flushStore_(); // copies made so far belong to the organisation they were read for
  ORG_ = o; ORG_SS_ = null; SHEET_CACHE_ = {}; HEADER_OK_ = {}; READ_MEMO_ = {}; READ_LEN_ = {}; TAIL_MEMO_ = {}; SINCE_MEMO_ = {};
  if (!same) { TAB_PREFETCH_ = null; READ_SHEET_ = []; }
  if (typeof SETTINGS_MEMO_ !== 'undefined') SETTINGS_MEMO_ = null;
}
function orgId_() { return ORG_ ? ORG_.id : homeOrgId_(); }
/** A key in a shared store (cache, script properties) for the current organisation; the home organisation keeps the old keys. */
function orgKey_(k) { return ORG_ && !ORG_.home ? 'o' + ORG_.id + ':' + k : k; }
/** The script cache seen through the current organisation: every key is prefixed, so no two organisations share a copy. */
function cache_() {
  var c = CacheService.getScriptCache();
  return {
    get: function (k) { return c.get(orgKey_(k)); },
    put: function (k, v, s) { return s === undefined ? c.put(orgKey_(k), v) : c.put(orgKey_(k), v, s); },
    remove: function (k) { return c.remove(orgKey_(k)); },
    putAll: function (o, s) { var m = {}; Object.keys(o).forEach(function (k) { m[orgKey_(k)] = o[k]; }); return s === undefined ? c.putAll(m) : c.putAll(m, s); },
    getAll: function (ks) { var r = c.getAll(ks.map(orgKey_)) || {}, out = {}; ks.forEach(function (k) { var v = r[orgKey_(k)]; if (v != null) out[k] = v; }); return out; },
    removeAll: function (ks) { return c.removeAll(ks.map(orgKey_)); }
  };
}
/** The organisation a request belongs to: its orgId, or the claim in its token, or (old sessions only) the home one. */
function resolveOrg_(req, action) {
  var id = String(req && req.orgId != null ? req.orgId : '').trim();
  var claim = tokenOrg_(req && req.token);
  if (!id && claim) id = claim;
  if (!id) {
    if (ORG_REQUIRED_[action]) fail_('org_required');
    id = homeOrgId_(); // pages and sessions from before Org IDs: the home organisation
  }
  if (!/^\d{4,8}$/.test(id)) fail_('bad_org');
  var o = orgRec_(id);
  if (!o) {
    if (!rateLimit_('orgmiss', 60, 600)) fail_('too_many_attempts');
    fail_('org_not_found');
  }
  if (o.status !== 'active') fail_('org_suspended');
  return o;
}
/** The orgId inside a token's payload, read without trusting it (readToken_ checks the signature and the match). */
function tokenOrg_(token) {
  if (!token || typeof token !== 'string') return '';
  try { var p = JSON.parse(bytesToUtf8_(b64uToBytes_(token.split('.')[0]))); return p && p.o ? String(p.o) : ''; } catch (e) { return ''; }
}


/*
 * Another organisation's spreadsheet, through the Google Sheets REST API with the script's own token. The web app may
 * only use the bound spreadsheet through SpreadsheetApp (scope spreadsheets.currentonly); the drive.file scope the owner
 * already granted lets the app create spreadsheets and use the ones it created, over REST. This object offers the few
 * Sheet calls the data layer makes (getDataRange/getRange values, setValues, clearContent, appendRow, getLastRow,
 * getLastColumn, setFrozenRows), so every module works unchanged on either kind of book.
 */
var SHEETS_API_ = 'https://sheets.googleapis.com/v4/spreadsheets/';
function sheetsFetch_(method, url, body) {
  var o = { method: method, muteHttpExceptions: true, headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() } };
  if (body !== undefined) { o.contentType = 'application/json'; o.payload = JSON.stringify(body); }
  var r = UrlFetchApp.fetch(url, o), code = r.getResponseCode(), txt = r.getContentText();
  if (code >= 300) { console.error('sheets api ' + code + ': ' + String(txt).slice(0, 300)); var gm = ''; try { gm = (JSON.parse(txt).error || {}).message || ''; } catch (e) { } FAIL_DETAIL_ = code + ' ' + String(gm || txt).slice(0, 240); fail_(code === 404 ? 'org_book_missing' : 'org_book_error'); }
  return txt ? JSON.parse(txt) : {};
}
function colA1_(n) { var s = ''; while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
function a1_(title, r, c, nr, nc) { return "'" + String(title).replace(/'/g, "''") + "'!" + colA1_(c) + r + ':' + colA1_(c + nc - 1) + (r + nr - 1); }
function restBook_(id) {
  var meta = null, tabs = {}, CK = 'bookmeta:v1:' + id;
  // The layout (tab ids, grid sizes) is kept in the cache: grids only grow, and every grow or new tab here saves it again,
  // so a cached size is never larger than the real one (a stale smaller one only adds rows a little early).
  var saveMeta = function () { try { cache_().put(CK, JSON.stringify(meta), 21600); } catch (e) {} };
  // Google refused a call: the cached layout may be out of date (a tab grown, removed or renamed by hand). Reload it;
  // a tab that is really gone is created again, as on first use.
  var hooks = { save: saveMeta, stale: function (title) { try { cache_().remove(CK); } catch (e) {} meta = null; var m = load(); if (m[title]) return m[title]; book.insertSheet(title); return load()[title] || null; } };
  var load = function () {
    if (meta) return meta;
    try { var c = cache_().get(CK); if (c) { meta = JSON.parse(c); return meta; } } catch (e) { meta = null; }
    meta = {};
    (sheetsFetch_('get', SHEETS_API_ + id + '?fields=' + encodeURIComponent('sheets.properties(sheetId,title,gridProperties)')).sheets || []).forEach(function (s) { meta[s.properties.title] = s.properties; });
    saveMeta();
    return meta;
  };
  var book = {
    getId: function () { return id; },
    getSheetByName: function (n) { return load()[n] ? tabs[n] || (tabs[n] = restSheet_(id, load()[n], null, hooks)) : null; },
    /** Many tabs in one values:batchGet (one round trip instead of one per tab). Returns how many were fetched. */
    preload: function (names) {
      var m = load(), want = names.filter(function (n, i) { return m[n] && !tabs[n] && names.indexOf(n) === i; }).slice(0, 80);
      if (!want.length) return 0;
      var q = want.map(function (n) { return 'ranges=' + encodeURIComponent("'" + String(n).replace(/'/g, "''") + "'"); }).join('&');
      var r = sheetsFetch_('get', SHEETS_API_ + id + '/values:batchGet?' + q + '&valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING');
      (r.valueRanges || []).forEach(function (vr, i) { if (want[i]) tabs[want[i]] = restSheet_(id, m[want[i]], vr.values || [], hooks); });
      return want.length;
    },
    insertSheet: function (n) {
      var cols = Math.max(26, ((HEADERS[n] || []).length || 0) + 4);
      var rep = sheetsFetch_('post', SHEETS_API_ + id + ':batchUpdate', { requests: [{ addSheet: { properties: { title: n, gridProperties: { rowCount: 1000, columnCount: cols, frozenRowCount: 1 } } } }] });
      var p = rep.replies[0].addSheet.properties; load()[n] = p; saveMeta();
      return (tabs[n] = restSheet_(id, p, null, hooks));
    },
    getSheets: function () { return Object.keys(load()).map(function (n) { return book.getSheetByName(n); }); }
  };
  return book;
}
function restSheet_(bookId, props, pre, hooks) {
  var title = props.title, grid = props.gridProperties || (props.gridProperties = { rowCount: 1000, columnCount: 26 }), vals = pre || null;
  var url = function (rng, rest) { return SHEETS_API_ + bookId + '/values/' + encodeURIComponent(rng) + (rest || ''); };
  var refresh = function () { // once per sheet object: reload the layout and try again
    if (!hooks || refresh.done) return false; refresh.done = true;
    var p = hooks.stale(title); if (!p) return false;
    props = p; grid = p.gridProperties || (p.gridProperties = { rowCount: 1000, columnCount: 26 }); vals = null; return true;
  };
  var read = function () { // the whole tab, once per request (readAll_ memoises above this too)
    if (vals) return vals;
    var get = function () { return sheetsFetch_('get', url("'" + String(title).replace(/'/g, "''") + "'", '?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING')); };
    var r; try { r = get(); } catch (e) { if (!refresh()) throw e; r = get(); }
    vals = r.values || [];
    return vals;
  };
  var width = function () { return read().reduce(function (m, row) { return Math.max(m, row.length); }, 0); };
  var grow = function (lastRow, lastCol) { // the API refuses writes outside the grid: add rows / columns first
    var req = [];
    if (lastRow > grid.rowCount) { req.push({ appendDimension: { sheetId: props.sheetId, dimension: 'ROWS', length: Math.max(lastRow - grid.rowCount, 500) } }); grid.rowCount += Math.max(lastRow - grid.rowCount, 500); }
    if (lastCol > grid.columnCount) { req.push({ appendDimension: { sheetId: props.sheetId, dimension: 'COLUMNS', length: lastCol - grid.columnCount } }); grid.columnCount = lastCol; }
    if (req.length) { sheetsFetch_('post', SHEETS_API_ + bookId + ':batchUpdate', { requests: req }); if (hooks) hooks.save(); }
  };
  var range = function (r, c, nr, nc) {
    return {
      getValues: function () {
        var all = read(), out = [];
        for (var i = 0; i < nr; i++) { var row = [], src = all[r - 1 + i] || []; for (var j = 0; j < nc; j++) { var v = src[c - 1 + j]; row.push(v === undefined || v === null ? '' : v); } out.push(row); }
        return out;
      },
      setValues: function (v) {
        var put = function () { grow(r + nr - 1, c + nc - 1); sheetsFetch_('put', url(a1_(title, r, c, nr, nc), '?valueInputOption=USER_ENTERED'), { majorDimension: 'ROWS', values: v }); };
        try { put(); } catch (e) { if (!refresh()) throw e; put(); }
        vals = null;
      },
      clearContent: function () { sheetsFetch_('post', url(a1_(title, r, c, nr, nc), ':clear'), {}); vals = null; }
    };
  };
  return {
    getName: function () { return title; },
    /** Rows from 'start' to the last row with data, one call (the range has no end row). */
    tail: function (start, ncols) {
      var get = function () { return sheetsFetch_('get', url("'" + String(title).replace(/'/g, "''") + "'!A" + start + ':' + colA1_(ncols), '?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING')); };
      var r; try { r = get(); } catch (e) { if (!refresh()) throw e; r = get(); }
      return r.values || [];
    },
    getLastRow: function () { return read().length; },
    getLastColumn: function () { return width(); },
    getDataRange: function () { return range(1, 1, Math.max(1, read().length), Math.max(1, width())); },
    getRange: range,
    appendRow: function (v) {
      if (vals) { range(vals.length + 1, 1, 1, v.length).setValues([v]); return; } // already read this request: the row is known
      // not read: let Google place the row after the last one (values:append), so a growing tab (audit, punches) is never
      // downloaded just to write one line
      var go = function () { sheetsFetch_('post', url("'" + String(title).replace(/'/g, "''") + "'!A1:" + colA1_(Math.max(1, v.length)) + '1', ':append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS'), { majorDimension: 'ROWS', values: [v] }); };
      try { go(); } catch (e) { if (!refresh()) throw e; go(); }
      vals = null;
    },
    setFrozenRows: function () {}
  };
}
/** A new, empty spreadsheet for an organisation, every tab with its header row, in the platform's folder on Drive. */
function restCreateBook_(title) {
  var tabs = Object.keys(HEADERS).map(function (n) {
    var h = HEADERS[n];
    return { properties: { title: n, gridProperties: { rowCount: 1000, columnCount: Math.max(26, h.length + 4), frozenRowCount: 1 } },
      data: [{ startRow: 0, startColumn: 0, rowData: [{ values: h.map(function (x) { return { userEnteredValue: { stringValue: x } }; }) }] }] };
  });
  var r = sheetsFetch_('post', 'https://sheets.googleapis.com/v4/spreadsheets', { properties: { title: title, locale: 'ar', timeZone: 'Asia/Riyadh' }, sheets: tabs });
  return r.spreadsheetId;
}

// ---------------- platform (the owner of the platform, with the setup key) ----------------

/** Public, no secrets: can this script call Google APIs (the owner approved script.external_request), and does the Sheets
 *  API answer for this project? Creating an organisation needs both. Answers yes/no and Google's status word only. */
function api_platformHealth() {
  var out = { ok: true, fetch: false, sheetsApi: '' };
  if (!rateLimit_('health', 30, 600)) fail_('too_many_attempts');
  try { UrlFetchApp.fetch('https://sheets.googleapis.com/$discovery/rest?version=v4', { muteHttpExceptions: true }); out.fetch = true; }
  catch (e) { out.fetchError = /external_request|UrlFetchApp/.test(String(e && e.message)) ? 'needs_owner_authorization' : 'fetch_failed'; return out; }
  try {
    var r = UrlFetchApp.fetch('https://sheets.googleapis.com/v4/spreadsheets/health-check-not-a-real-id?fields=spreadsheetId', { muteHttpExceptions: true, headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() } });
    var err = {}; try { err = JSON.parse(r.getContentText()).error || {}; } catch (x) { }
    out.sheetsApi = r.getResponseCode() + ' ' + String(err.status || ''); // 404 NOT_FOUND: the API answers; 403: switched off for the project
    if (r.getResponseCode() === 403) out.sheetsApiMsg = String(err.message || '').slice(0, 200);
    var ti = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?access_token=' + encodeURIComponent(ScriptApp.getOAuthToken()), { muteHttpExceptions: true });
    try { out.scopes = String(JSON.parse(ti.getContentText()).scope || '').split(' ').map(function (x) { return x.replace('https://www.googleapis.com/auth/', ''); }); } catch (x) { } // the names of the granted permissions only, never the token
  } catch (e) { out.sheetsApi = 'error'; }
  return out;
}
function platformKeyOk_(req) {
  var expected = (typeof SETUP_KEY_HASH === 'string') ? SETUP_KEY_HASH : '';
  if (!rateLimit_('platform', 20, 900)) fail_('too_many_attempts');
  if (!expected || !safeEqual_(sha256Hex_(String(req.setupKey || '').trim()), expected)) fail_('bad_setup_key');
  PLATFORM_OK_ = true;
}
var FAIL_DETAIL_ = ''; // what Google said, for the platform owner only
var PLATFORM_OK_ = false; // set once the setup key matched: then a server error carries its message (owner only)
/** A new organisation: a new spreadsheet of its own, a new Org ID, and a one-time code for its first administrator. */
function api_orgCreate(req) {
  platformKeyOk_(req);
  var nameAr = str_(req.nameAr, 120), nameEn = str_(req.nameEn, 120), cr = String(req.cr || '').replace(/\D/g, ''), unn = String(req.unn || '').replace(/\D/g, '');
  if (!nameAr || !unn || !str_(req.adminName, 80)) fail_('missing_fields');
  if (!/^7\d{9}$/.test(unn)) fail_('bad_unn'); // the unified national number of a Saudi establishment: 10 digits, starts with 7
  if (cr && cr.length !== 10) fail_('bad_cr');
  var brand = brandFromReq_(req); // the logo is required: the organisation's whole theme is built from it
  var p = PropertiesService.getScriptProperties(), lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var all = orgAll_().filter(function (o) { return o.status !== 'deleted' && o.status !== 'failed'; }); // a failed attempt does not block its retry
    if (unn && all.some(function (o) { return o.unn === unn; })) fail_('unn_exists');
    if (cr && all.some(function (o) { return o.cr === cr; })) fail_('cr_exists');
    var next = Math.max(Number(p.getProperty('ORG_SEQ')) || Number(homeOrgId_()), Number(homeOrgId_())) + 1;
    var id = String(next), bookId = restCreateBook_((nameEn || nameAr) + ' · HRIS · ' + id);
    var rec = { sheetId: bookId, nameAr: nameAr, nameEn: nameEn, unn: unn, cr: cr, group: str_(req.group, 60), status: 'active', createdAt: new Date().toISOString() };
    p.setProperty('ORG:' + id, JSON.stringify(rec)); p.setProperty('ORG_SEQ', String(next));
  } finally { lock.releaseLock(); }
  // the new organisation's own first steps run inside it; if one fails the organisation is marked failed (its book stays on Drive)
  var b;
  try {
    setOrg_(orgRec_(id));
    withLock_(function () {
      // its own names everywhere: the short names too, or the defaults (the home company's) would show
      [['companyNameAr', nameAr], ['companyNameEn', nameEn || nameAr], ['companyShortAr', nameAr.slice(0, 30)], ['companyShortEn', (nameEn || nameAr).slice(0, 30)], ['companyUnn', unn], ['companyCr', cr]].forEach(function (kv) { if (kv[1]) append_(SHEETS.SET, { key: kv[0], value: kv[1] }); });
      brandSet_(brand, 'platform'); // its logo and the two colours read from it
    });
    b = api_bootstrap({ setupKey: req.setupKey, name: req.adminName, empNo: req.adminEmpNo, nameEn: req.adminNameEn, email: req.adminEmail });
  } catch (e) {
    try { var fr = parseJson_(p.getProperty('ORG:' + id), {}); fr.status = 'failed'; fr.error = String(e && e.message || e).slice(0, 200); p.setProperty('ORG:' + id, JSON.stringify(fr)); } catch (x) { }
    throw e;
  }
  return { ok: true, orgId: id, nameAr: nameAr, activationCode: b.activationCode, adminEmpNo: String(b.empNo) };
}
function orgAll_() {
  var p = PropertiesService.getScriptProperties().getProperties(), out = [];
  Object.keys(p).forEach(function (k) { if (k.indexOf('ORG:') === 0) { var o = parseJson_(p[k], null); if (o) { o.id = k.slice(4); out.push(o); } } });
  return out.sort(function (a, b) { return Number(a.id) - Number(b.id); });
}
function api_orgList(req) {
  platformKeyOk_(req);
  var hs = settings_(); // the first company (this script's own spreadsheet) is listed by its name, like every other customer
  return { ok: true, home: homeOrgId_(), homeGroup: PropertiesService.getScriptProperties().getProperty('HOME_GROUP') || '', homeNameAr: hs.companyNameAr || '', homeNameEn: hs.companyNameEn || '', orgs: orgAll_().map(function (o) { return { id: o.id, nameAr: o.nameAr, nameEn: o.nameEn, unn: o.unn || '', cr: o.cr, group: o.group || '', status: o.status, createdAt: o.createdAt }; }) };
}
/** Suspend or re-open an organisation (its data stays; every request is refused while suspended). */
function api_orgSetStatus(req) {
  platformKeyOk_(req);
  var id = String(req.id || ''), p = PropertiesService.getScriptProperties(), raw = p.getProperty('ORG:' + id);
  if (!raw) fail_('org_not_found');
  if (['active', 'suspended'].indexOf(req.status) < 0) fail_('bad_value');
  var o = parseJson_(raw, {}); o.status = req.status; o.updatedAt = new Date().toISOString();
  p.setProperty('ORG:' + id, JSON.stringify(o));
  return { ok: true };
}
/** Platform: put a company in a group (several CRs of one owner are listed together); '' takes it out. */
function api_orgSetGroup(req) {
  platformKeyOk_(req);
  var id = String(req.id || ''), p = PropertiesService.getScriptProperties(), g = str_(req.group, 60);
  if (id === homeOrgId_()) { p.setProperty('HOME_GROUP', g); return { ok: true }; }
  var raw = p.getProperty('ORG:' + id); if (!raw) fail_('org_not_found');
  var o = parseJson_(raw, {}); o.group = g; o.updatedAt = new Date().toISOString(); p.setProperty('ORG:' + id, JSON.stringify(o));
  return { ok: true };
}
/** One organisation's usage, read inside it: counts only. */
function orgUsage_() {
  var t = today_(), emps = readAll_(SHEETS.EMP), act = emps.filter(function (e) { return e.status === 'active'; }), seen = {}, last = '';
  readAll_(SHEETS.PUNCH).forEach(function (p) { var d = String(p.date).slice(0, 10); if (d > last) last = d; if (d === t && isCounted_(p)) seen[p.empId] = 1; });
  var creds = readAll_(SHEETS.CRED).filter(function (c) { return c.status === 'active'; }), withDevice = {};
  creds.forEach(function (c) { withDevice[c.empId] = 1; });
  return { employees: act.length, enrolled: act.filter(function (e) { return withDevice[e.id]; }).length, activeToday: Object.keys(seen).length,
    pendingRequests: readAll_(SHEETS.REQ).filter(function (r) { return r.status === 'pending'; }).length, lastActivity: last };
}
/** Platform: every organisation's usage, by group. Each is read in its own book; one failing never hides the others. */
function api_orgOverview(req) {
  platformKeyOk_(req);
  var p = PropertiesService.getScriptProperties(), list = [{ id: homeOrgId_(), group: p.getProperty('HOME_GROUP') || '', status: 'active' }].concat(orgAll_());
  var rows = list.map(function (o) {
    var row = { id: o.id, group: o.group || '', status: o.status, cr: o.cr || '' };
    try {
      setOrg_(orgRec_(o.id)); var s = settings_();
      row.nameAr = s.companyNameAr || o.nameAr || ''; row.nameEn = s.companyNameEn || o.nameEn || '';
      var u = orgUsage_(); for (var k in u) row[k] = u[k];
    } catch (e) { row.error = String(e && e.message || e).replace(/^E:/, '').slice(0, 60); }
    return row;
  });
  setOrg_(orgRec_(homeOrgId_()));
  return { ok: true, rows: rows, at: new Date().toISOString() };
}
/** The sign-in screen: is this Org ID real, and whose is it? (name only; rate-limited against guessing) */
function api_orgCheck(req) {
  if (!rateLimit_('orgcheck', 120, 600)) fail_('too_many_attempts');
  var s = settings_();
  return { ok: true, orgId: orgId_(), nameAr: s.companyNameAr || '', nameEn: s.companyNameEn || '', home: !!(ORG_ && ORG_.home), logoVer: logoVer_(), brandColor: brandColor_(), brandAccent: brandAccent_(), sso: ssoPublic_() };
}

// ---------------- HTTP ----------------

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * GET is the public API for tools that cannot POST or send headers (Power BI, Excel "From Web"):
 * ?org=<Org ID>&key=<API key>&resource=<name>[&from=&to=&page=&updatedSince=&runId=][&format=csv]. Without resource: a status line.
 */
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.ical) {
    try { setOrg_(resolveOrg_({ orgId: p.org }, 'calendar')); var ics = calFeedIcs_(String(p.ical)); if (ics) return ContentService.createTextOutput(ics).setMimeType(ContentService.MimeType.ICAL); }
    catch (err) { /* an unknown link answers the same as a bad one */ }
    return ContentService.createTextOutput('BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//BASMA//HR//AR\r\nEND:VCALENDAR\r\n').setMimeType(ContentService.MimeType.ICAL);
  }
  if (p.resource) {
    var res = handle_({ action: 'apiQuery', orgId: p.org, apiKey: p.key, resource: p.resource, from: p.from, to: p.to, page: p.page, updatedSince: p.updatedSince, runId: p.runId });
    if (p.format === 'csv' && res.ok) return ContentService.createTextOutput(apiCsv_(res.rows)).setMimeType(ContentService.MimeType.CSV);
    return json_(res);
  }
  return json_({ ok: true, service: 'bestgas-attendance', time: new Date().toISOString(), bigint: typeof BigInt === 'function' });
}

function apiCsv_(rows) {
  var keys = []; rows.forEach(function (r) { Object.keys(r).forEach(function (k) { if (keys.indexOf(k) < 0) keys.push(k); }); });
  var q = function (v) { var s = v == null ? '' : String(v); if (/^[=+@\t\r]/.test(s) || (/^-/.test(s) && !/^-\d+(\.\d+)?$/.test(s))) s = "'" + s; /* only a plain negative number stays bare: "-1+2" would run as a formula */ return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  return '\uFEFF' + [keys.join(',')].concat(rows.map(function (r) { return keys.map(function (k) { return q(r[k]); }).join(','); })).join('\r\n');
}
function doPost(e) {
  var req;
  try { req = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'bad_request' }); }
  return json_(handle_(req));
}

var PUBLIC_ACTIONS = { orgActivation: 1, orgRenumber: 1, orgBrandSet: 1, orgImport: 1, platformHealth: 1, ssoLogin: 1, devicePunch: 1, orgLogo: 1, apiQuery: 1, orgCreate: 1, orgList: 1, orgSetStatus: 1, orgSetGroup: 1, orgOverview: 1, orgCheck: 1, kioskPing: 1, careersList: 1, careersApply: 1,
  ping: 1, bootstrapStatus: 1, bootstrap: 1, enrollBegin: 1, enrollFinish: 1,
  pinLogin: 1, authBegin: 1, authFinish: 1, punchBegin: 1, punchFinish: 1, adminRecover: 1, pwLogin: 1, pinChange: 1, diag: 1, demoData: 1
};
var EMP_ACTIONS = { clientLog: 1, budgetSave: 1, budgetView: 1, nitaqatSim: 1, signRequest: 1, signList: 1, signDoc: 1, signDecline: 1, signCancel: 1, signVerify: 1, autoRuleSave: 1, autoRunNow: 1, autoHub: 1, autoTaskStep: 1, wpsCompliance: 1, gosiQueue: 1, gosiMark: 1, celebrations: 1, celebOptSave: 1, svActList: 1, svActStep: 1, mentorHub: 1, mentorProfileSave: 1, mentorRequest: 1, mentorStep: 1, skillHub: 1, mySkillSave: 1, skillVerify: 1, skillGap: 1, calFeedLink: 1, letterTplList: 1, quizList: 1, quizTake: 1, quizSubmit: 1, svActSave: 1, payrollVariance: 1, moveCode: 1, cwList: 1, cwSave: 1, cwEnd: 1, cwAgencySave: 1, cwHoursSave: 1, cwHoursDecide: 1, cwInvoiceSave: 1, cwInvoiceDecide: 1, cwInvoices: 1, retroScan: 1, retroApply: 1, retroCancel: 1, retroLog: 1, gradeList: 1, gradeSave: 1, gradeDelete: 1, bandReport: 1, pushKey: 1, pushSubscribe: 1, pushUnsubscribe: 1, pushTest: 1, hseReport: 1, hseList: 1, hseUpdate: 1, hseActionSave: 1, hseActionStep: 1, ppeIssue: 1, ppeStep: 1, ppeList: 1, hseStats: 1, aiStatus: 1, aiAsk: 1, officeMap: 1, presenceSet: 1, myTotalRewards: 1, brandSave: 1, logoSave: 1, apiKeyList: 1, apiKeySave: 1, webhookSave: 1, webhookDeliveries: 1, payGroupList: 1, payGroupSave: 1, payGroupAssign: 1, snapshotList: 1, snapshotView: 1, snapshotPeople: 1, snapshotTake: 1, reportSubList: 1, reportSubSave: 1, reportSubSend: 1, kioskList: 1, kioskSave: 1, docUpload: 1, docFile: 1, notifyStatus: 1, notifyTest: 1, perkList: 1, perkView: 1, welcome: 1, dataExport: 1, internalJobs: 1, internalApply: 1, careerPathList: 1, nineBox: 1, potentialSave: 1, successionList: 1, successionSave: 1, kbSearch: 1, kbList: 1, kbGet: 1, kbFeedback: 1, oneOnOneList: 1, oneOnOneSave: 1, oneOnOneUpdate: 1, goalList: 1, goalSave: 1, goalCheckIn: 1, workforcePlan: 1, workforcePlanSave: 1, pinEnrollBegin: 1, pinEnrollFinish: 1, shiftOfferList: 1, openShiftPost: 1, openShiftClaim: 1, shiftSwapAsk: 1, shiftSwapAnswer: 1, shiftOfferDecide: 1, shiftOfferCancel: 1, me: 1, myHistory: 1, passwordSet: 1, punchPw: 1, searchAll: 1, customFieldList: 1, customFieldSave: 1, customValuesGet: 1, customValuesSave: 1, customValuesAll: 1, timesheetList: 1, timesheetApprove: 1, compCycleSave: 1, compCycleList: 1, compPropose: 1, compCycleClose: 1, finalSettlementCreate: 1, finalSettlementDecide: 1, finalSettlementPaid: 1, finalSettlementList: 1, myFinalSettlement: 1, myExitSurvey: 1, exitSurveySubmit: 1, kudosSend: 1, kudosFeed: 1, exitSurveyResults: 1, kudosStats: 1,
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
var HR_ACTIONS = { alumniList: 1, alumniSave: 1, rehireCheck: 1, skillSave: 1, posSkillSave: 1, massChange: 1, letterTplSave: 1, quizSave: 1, leaveOpeningImport: 1, empNoNext: 1, flowPreview: 1, perkSave: 1, welcomeSave: 1, careerPathSave: 1, rolesOverview: 1, kbSave: 1, kbSeed: 1, careerPostList: 1, careerPostSave: 1, resignationDefer: 1, recruitReqClose: 1, recruitCandSave: 1, recruitCandStage: 1, recruitInterviewSave: 1, recruitOfferSave: 1, recruitOfferSend: 1, recruitOfferRespond: 1,
  recruitOfferLetter: 1, recruitHire: 1, courseSave: 1, trainSessionSave: 1, trainMark: 1, certRecord: 1, insPolicySave: 1, insPolicyList: 1, insMemberAdd: 1,
  insMemberDelete: 1, insMoveStep: 1, annSave: 1, annPublish: 1, annArchive: 1, annList: 1, flowList: 1, flowSave: 1, flowSettingsSave: 1, leaveCycleOpen: 1, discNotice: 1, govVisaIssue: 1, govVisaCancel: 1, govFinalExit: 1, ticketSave: 1, ticketUse: 1, assetSave: 1, assetAssign: 1, assetReturn: 1, clearanceStart: 1, discCodesSave: 1, discHearing: 1, discDecide: 1, discObjectionDecide: 1, injuryUpdate: 1, shiftSave: 1, rosterSave: 1, rosterDelete: 1, onboardStart: 1, surveySave: 1, surveyClose: 1, policySave: 1, planClose: 1, perfCycleSave: 1, perfCycleList: 1, perfCycleStage: 1, perfOverview: 1, perfCalibrate: 1, feedbackLaunch: 1, hrBootstrap: 1, holidaySave: 1, holidayDelete: 1, leaveBalances: 1, leaveOpeningSave: 1, hrDirectory: 1, hrDeptList: 1, hrDeptSave: 1, hrPositionList: 1, hrPositionSave: 1, hrEmpSave: 1,
  hrPrivateSave: 1, hrImportValidate: 1, hrImportCommit: 1, hrDocList: 1, hrDocSave: 1, hrExpiring: 1, empPasswordReset: 1, board: 1, empList: 1, zoneList: 1, report: 1, reviewList: 1, reviewDecide: 1, manualPunch: 1, auditList: 1, securityEvents: 1, settingsGet: 1, empSave: 1, empActivation: 1 };
/**
 * Actions that only read (plus the audit line of a salary view). They may use the cached tab copies;
 * update_ refuses a cached row, so a mistake here fails loudly instead of overwriting the Sheet.
 */
var READ_ONLY_ACTIONS = { budgetView: 1, nitaqatSim: 1, signList: 1, signVerify: 1, autoHub: 1, wpsCompliance: 1, gosiQueue: 1, celebrations: 1, svActList: 1, mentorHub: 1, skillHub: 1, skillGap: 1, letterTplList: 1, quizList: 1, quizTake: 1, alumniList: 1, rehireCheck: 1, cwList: 1, cwInvoices: 1, retroScan: 1, retroLog: 1, gradeList: 1, bandReport: 1, pushKey: 1, hseList: 1, ppeList: 1, hseStats: 1, aiStatus: 1, flowPreview: 1, officeMap: 1, myTotalRewards: 1, apiKeyList: 1, webhookDeliveries: 1, payGroupList: 1, snapshotList: 1, snapshotView: 1, reportSubList: 1, kioskList: 1, notifyStatus: 1, perkList: 1, welcome: 1, internalJobs: 1, careerPathList: 1, rolesOverview: 1, nineBox: 1, successionList: 1, kbSearch: 1, kbList: 1, oneOnOneList: 1, goalList: 1, workforcePlan: 1, careersList: 1, careerPostList: 1, shiftOfferList: 1, searchAll: 1, customFieldList: 1, customValuesGet: 1, customValuesAll: 1, myFinalSettlement: 1, myExitSurvey: 1, kudosFeed: 1, exitSurveyResults: 1, kudosStats: 1, me: 1, myHistory: 1, myFile: 1, hrEmpFile: 1, hrTeam: 1, hrCompList: 1, hrDirectory: 1, hrDeptList: 1,
  hrPositionList: 1, hrDocList: 1, hrExpiring: 1, hrBootstrap: 1, hrImportValidate: 1, board: 1, empList: 1, zoneList: 1, report: 1,
  reviewList: 1, auditList: 1, securityEvents: 1, settingsGet: 1, myRequests: 1, requestQuote: 1, reqInbox: 1, holidayList: 1, leaveTeam: 1, leaveBalances: 1,
  dashboard: 1, mySlips: 1, payrollList: 1, payrollGet: 1, eosQuote: 1, myPerformance: 1, perfTeam: 1, perfEmp: 1, feedbackResults: 1, perfCycleList: 1, perfOverview: 1,
  reportCatalog: 1, reportRun: 1, reportLog: 1, onboardList: 1, mySurveys: 1, surveyResults: 1, policyList: 1, planList: 1, myTasks: 1, delegationList: 1, reconList: 1, complianceCalendar: 1, wpsFile: 1, shiftList: 1, rosterList: 1, discCodes: 1, discList: 1, injuryList: 1, assetList: 1, clearanceList: 1,
  myGov: 1, govOverview: 1, myExpenses: 1, expenseCheck: 1, expenseInbox: 1, expenseReport: 1, journalList: 1, journalBuild: 1, journalMapGet: 1,
  approvalsInbox: 1, approvalHistory: 1, leaveCycleList: 1, myLeaveCycles: 1, flowList: 1,
  recruitReqList: 1, recruitCandList: 1, recruitCandGet: 1, recruitBoard: 1, recruitOfferLetter: 1, loanQuote: 1, myLoans: 1, loanList: 1,
  myTraining: 1, trainSessionList: 1, trainMatrix: 1, courseList: 1, myInsurance: 1, insList: 1, insCost: 1, insPolicyList: 1,
  myAnnouncements: 1, annList: 1, hdMine: 1, hdList: 1, hdGet: 1 };

/** Organisations on their own book: fetch together every tab this screen read from the sheet last time and the cache lacks. */
var GROWING_TABS_ = { punches: 1, audit: 1 }; // never downloaded whole by the batch preload; punches go through readTail_
function preloadFor_(action) {
  try {
    var book = ss_(); if (!book || typeof book.preload !== 'function') return;
    var list = JSON.parse(cache_().get('acttabs:v1:' + orgKey_('') + action) || '[]');
    if (!list.length) list = Object.keys(CACHED_TABS_); // first time for this action: every small tab, two batches at most
    var need = list.filter(function (n) { if (GROWING_TABS_[n]) return false; if (READ_MEMO_[n]) return false; if (!CACHED_TABS_[n]) return true; var c = cachedRows_(n); return !(c && c.rows); });
    for (var i = 0; i < need.length && i < 160; i += 80) if (need.length > 1) book.preload(need.slice(i, i + 80));
  } catch (e) { /* only a speed-up: reading tab by tab still works */ }
}
function learnTabs_(action) {
  try {
    if (!READ_SHEET_.length || typeof ss_().preload !== 'function') return;
    var k = 'acttabs:v1:' + orgKey_('') + action, have = JSON.parse(cache_().get(k) || '[]');
    var all = have.concat(READ_SHEET_).filter(function (n, i, a) { return a.indexOf(n) === i; }).slice(0, 80);
    if (all.length !== have.length) cache_().put(k, JSON.stringify(all), 21600);
  } catch (e) {}
}
var REQ_DEV_ = ''; // the device sending this request (see bindDevice_)
var ADMIN_ACTIONS = { waTest: 1, hrRolesSave: 1, empResetDevice: 1, zoneSave: 1, zoneDelete: 1, settingsSave: 1 };

function handle_(req) {
  READ_MEMO_ = {}; READ_LEN_ = {}; SETTINGS_MEMO_ = null; READ_SHEET_ = []; TAIL_MEMO_ = {}; SINCE_MEMO_ = {};
  REQ_HOST_ = req && typeof req.host === 'string' ? req.host.toLowerCase().slice(0, 80) : '';
  REQ_DEV_ = req && typeof req.devId === 'string' && /^[aw]:[A-Za-z0-9_-]{16,64}$/.test(req.devId) ? req.devId : '';
  USE_TAB_CACHE_ = false;
  TAB_PREFETCH_ = null; STORE_Q_ = null;
  var action = req && req.action;
  if (READ_ONLY_ACTIONS[action]) USE_TAB_CACHE_ = true;
  try {
    var fn = /^[a-zA-Z]+$/.test(String(action)) ? globalThis['api_' + action] : null;
    if (typeof fn !== 'function') { secEvent_('unknown_action', '', String(action).replace(/[^A-Za-z0-9_]/g, '').slice(0, 40)); return { ok: false, error: 'unknown_action' }; }
    setOrg_(PLATFORM_ACTIONS_[action] ? orgRec_(homeOrgId_()) : resolveOrg_(req, action));
    if (READ_ONLY_ACTIONS[action]) { USE_TAB_CACHE_ = true; preloadFor_(action); }
    if (PUBLIC_ACTIONS[action]) return fn(req, null);
    var me = readToken_(req.token);
    if (!me) return { ok: false, error: 'session_expired' };
    if (me._auth === 'pw' && (me.pwMustChange === true || me.pwMustChange === 'true' || me.pwMustChange === 'TRUE') && action !== 'passwordSet' && action !== 'me') {
      return { ok: false, error: 'password_change_required' };
    }
    var level = ROLES[me.role] || 0;
    if (!READ_ONLY_ACTIONS[action] && typeof resignationDeemedSweep_ === 'function') resignationDeemedSweep_(); // Leave.gs, at most hourly
    var allowed = (EMP_ACTIONS[action] && level >= 1) || (HR_ACTIONS[action] && level >= ROLES.hr) || (ADMIN_ACTIONS[action] && level >= ROLES.admin);
    if (allowed) { var res = fn(req, me); if (READ_ONLY_ACTIONS[action]) learnTabs_(action); if (!READ_ONLY_ACTIONS[action]) { if (typeof notifySweep_ === 'function') notifySweep_(); if (typeof reportSubsSweep_ === 'function') reportSubsSweep_(); if (typeof snapSweep_ === 'function') snapSweep_(); if (typeof whSweep_ === 'function') whSweep_(); if (typeof pushSweep_ === 'function') pushSweep_(); if (typeof autoSweep_ === 'function') autoSweep_(); } return res; } // the daily digest, lazily (off by default)
    secEvent_('forbidden_action', me.id, String(action));
    return { ok: false, error: 'forbidden' };
  } catch (err) {
    var msg = String(err && err.message || err);
    if (msg.indexOf('E:') === 0) return PLATFORM_OK_ && FAIL_DETAIL_ ? { ok: false, error: msg.slice(2), detail: FAIL_DETAIL_ } : { ok: false, error: msg.slice(2) };
    console.error(action + ': ' + msg + '\n' + (err && err.stack));
    if (/UrlFetchApp|script\.external_request/.test(msg)) return PLATFORM_OK_ ? { ok: false, error: 'needs_owner_authorization', detail: msg.slice(0, 300) } : { ok: false, error: 'server_error' };
    return PLATFORM_OK_ ? { ok: false, error: 'server_error', detail: msg.slice(0, 300) } : { ok: false, error: 'server_error' };
  } finally {
    flushStore_(); // the tab copies read in this request, saved in one call whichever way it ended (sign-in returns early)
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
function authorize() { if (ScriptApp.requireAllScopes) ScriptApp.requireAllScopes(ScriptApp.AuthMode.FULL); ss_(); sheet_(SHEETS.EMP); DriveApp_touch_(); UrlFetchApp.fetch("https://sheets.googleapis.com/$discovery/rest?version=v4", { muteHttpExceptions: true }); return "ok"; }

/** Nothing to do: a reference that keeps drive.file on the consent screen. */
function DriveApp_touch_() { return 'drive.file'; }

function api_ping() { return { ok: true, time: new Date().toISOString() }; }

function publicEmp_(e) {
  return {
    id: e.id, empNo: String(e.empNo), name: e.name, nameEn: e.nameEn, email: e.email, phone: String(e.phone || ''),
    department: e.department, title: e.title, role: e.role, status: e.status,
    zoneIds: String(e.zoneIds || ''), shiftStart: e.shiftStart, shiftEnd: e.shiftEnd, workdays: String(e.workdays || '')
  };
}
