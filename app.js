(() => {
  'use strict';

  const HEADER_ALIASES = {
    name: ['성명', '이름'],
    identity: ['생년월일 또는 주민번호', '생년월일 또는 주민등록번호', '생년월일', '주민번호', '주민등록번호', '주민번호앞자리', '생년'],
    department: ['근무부서', '부서', '근무 부서'],
    position: ['직급(위)', '직위(급)', '직급', '직위', '직종'],
    subject: ['과목', '담당과목', '표시과목'],
    payType: ['급제', '급여형태', '계약형태'],
    start: ['시작일', '근무시작일', '근무 시작일', '임용일'],
    end: ['종료일', '근무종료일', '근무 종료일', '퇴직일'],
    teacherStart: ['임용시작일', '임용 시작일', '계약시작일', '계약 시작일', '근무시작일', '근무 시작일'],
    teacherEnd: ['임용종료일', '임용 종료일', '계약종료일', '계약 종료일', '근무종료일', '근무 종료일'],
    period: ['기간', '근무기간'],
    retirement: ['퇴직사유', '퇴직 사유'],
    note: ['비고', '참고'],
    hours: ['소정근로시간', '소정 근로시간', '주당근로시간', '주당 근로시간', '근로시간', '주당수업시수', '주당 수업시수']
  };

  const DEFAULT_SETTINGS = {
    school: '대청중학교',
    department: '행정실',
    officer: '',
    phone: '',
    purpose: '제출용'
  };

  const GENERAL_DEMO_ROWS = [
    { name: '김가람', identity: '1982-03-14', department: '급식실', position: '조리실무사', payType: '교육공무직', start: '2018-03-01', end: '2021-02-28', retirement: '계약만료', note: '', hours: '주 40시간' },
    { name: '김가람', identity: '1982-03-14', department: '급식실', position: '조리실무사', payType: '교육공무직', start: '2021-03-01', end: '2024-08-31', retirement: '의원면직', note: '', hours: '주 40시간' },
    { name: '박나래', identity: '1975-11-02', department: '행정실', position: '행정대체', payType: '기간제', start: '2024-01-02', end: '2024-06-30', retirement: '계약만료', note: '', hours: '주 40시간' },
    { name: '최서윤', identity: '', department: '급식실', position: '배식원', payType: '시급', start: '2022-09-01', end: '', retirement: '', note: '종료일 확인 필요', hours: '' },
    { name: '정하준', identity: '1988-02-20', department: '시설관리실', position: '시설관리원', payType: '기간제', start: '2025-03-01', end: '2025-02-28', retirement: '계약만료', note: '종료일이 시작일보다 빠른 임의 오류', hours: '주 40시간' }
  ];

  const TEACHER_DEMO_ROWS = [
    { position: '기간제교사', subject: '국어', name: '가상교원', identity: '1990-01-01', start: '2024-03-01', end: '2025-02-28' },
    { position: '기간제교사', subject: '국어', name: '가상교원', identity: '900101-1234567', start: '2025-03-01', end: '2025-08-31' },
    { position: '기간제교사', subject: '', name: '예시교원', identity: '1992-05-15', start: '2023-03-01', end: '2024-02-29' },
    { position: '기간제교사', subject: '수학', name: '종료확인', identity: '1988-07-07', start: '2024-03-01', end: '' },
    { position: '기간제교사', subject: '영어', name: '기간오류', identity: '1991-09-09', start: '2025-03-01', end: '2025-02-28' }
  ];

  const state = {
    records: [],
    people: [],
    selectedPersonKey: null,
    selectedRecordIds: new Set(),
    fileName: '',
    ledgerType: 'none',
    certificateMode: 'general',
    rrnDisplay: false,
    settings: loadSettings()
  };

  const $ = id => document.getElementById(id);
  const qsa = selector => [...document.querySelectorAll(selector)];
  let xlsxPromise = null;
  let previewResizeObserver = null;
  let previewFitFrame = 0;
  let toastTimer;

  const els = {
    fileInput: $('file-input'),
    dropzone: $('dropzone'),
    fileState: $('file-state'),
    uploadSummary: $('upload-summary'),
    personSearch: $('person-search'),
    personList: $('person-list'),
    personCount: $('person-count'),
    careerTitle: $('career-title'),
    careerList: $('career-list'),
    careerAlert: $('career-alert'),
    selectedCount: $('selected-count'),
    ledgerBody: $('ledger-body'),
    ledgerSearch: $('ledger-search'),
    issueFilter: $('issue-filter'),
    editDialog: $('edit-dialog'),
    editForm: $('edit-form'),
    editIssues: $('edit-issues'),
    toast: $('toast')
  };

  init();

  function init() {
    bindTabs();
    bindUpload();
    bindFormFields();
    bindBirthInput();
    bindModeControls();
    bindCareerControls();
    bindSettings();
    bindLedger();
    bindEditDialog();
    bindPreviewFit();
    setToday();
    applySettingsToInputs();
    renderAll();
    ensureXlsx().catch(() => {});
  }

  function ensureXlsx() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (xlsxPromise) return xlsxPromise;
    xlsxPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      script.async = true;
      script.onload = () => window.XLSX ? resolve(window.XLSX) : reject(new Error('엑셀 읽기 기능을 확인할 수 없습니다.'));
      script.onerror = () => reject(new Error('엑셀 읽기 기능을 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.'));
      document.head.appendChild(script);
      window.setTimeout(() => {
        if (!window.XLSX) reject(new Error('엑셀 읽기 기능 연결 시간이 초과되었습니다.'));
      }, 15000);
    });
    return xlsxPromise;
  }

  function bindTabs() {
    qsa('.tab').forEach(button => button.addEventListener('click', () => {
      qsa('.tab').forEach(tab => tab.classList.toggle('is-active', tab === button));
      qsa('.tab-panel').forEach(panel => panel.classList.remove('is-active'));
      $(`tab-${button.dataset.tab}`).classList.add('is-active');
      if (button.dataset.tab === 'issue') schedulePreviewFit();
    }));
  }

  function bindPreviewFit() {
    const paper = $('print-area');
    if (!paper) return;
    if ('ResizeObserver' in window) {
      previewResizeObserver = new ResizeObserver(() => schedulePreviewFit());
      previewResizeObserver.observe(paper);
    }
    window.addEventListener('resize', schedulePreviewFit, { passive: true });
  }

  function schedulePreviewFit() {
    window.cancelAnimationFrame(previewFitFrame);
    previewFitFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(updatePreviewFit);
    });
  }

  function updatePreviewFit() {
    const paper = $('print-area');
    const stage = $('preview-stage');
    const pages = $('certificate-pages');
    const firstPage = pages?.querySelector('.certificate');
    if (!paper || !stage || !pages || !firstPage || !paper.clientWidth) return;

    const pageCount = pages.querySelectorAll('.certificate').length || 1;
    const styles = window.getComputedStyle(paper);
    const horizontalPadding = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
    const verticalPadding = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
    const availableWidth = Math.max(1, paper.clientWidth - horizontalPadding - 2);
    const availableHeight = Math.max(1, paper.clientHeight - verticalPadding - 2);
    const pageWidth = firstPage.offsetWidth;
    const pageHeight = firstPage.offsetHeight;
    const pagesStyle = window.getComputedStyle(pages);
    const gap = parseFloat(pagesStyle.rowGap || pagesStyle.gap) || 0;
    const unscaledHeight = pageCount * pageHeight + Math.max(0, pageCount - 1) * gap;
    const isStacked = window.matchMedia('(max-width: 1099px)').matches;

    let scale;
    if (!isStacked && pageCount === 1) {
      scale = Math.min(availableWidth / pageWidth, availableHeight / pageHeight, 1);
    } else {
      scale = Math.min(availableWidth / pageWidth, 1);
    }
    scale = Math.max(0.2, scale * 0.995);

    pages.style.setProperty('--preview-scale', scale.toFixed(4));
    stage.style.height = `${Math.ceil(unscaledHeight * scale)}px`;
    paper.classList.toggle('is-multipage', !isStacked && pageCount > 1);
    paper.dataset.pageCount = String(pageCount);
  }

  function bindUpload() {
    els.dropzone.addEventListener('click', () => els.fileInput.click());
    $('ledger-upload').addEventListener('click', () => els.fileInput.click());
    els.fileInput.addEventListener('change', event => {
      const file = event.target.files?.[0];
      if (file) readWorkbook(file);
      event.target.value = '';
    });

    ['dragenter', 'dragover'].forEach(type => els.dropzone.addEventListener(type, event => {
      event.preventDefault();
      els.dropzone.classList.add('is-dragging');
    }));
    ['dragleave', 'drop'].forEach(type => els.dropzone.addEventListener(type, event => {
      event.preventDefault();
      els.dropzone.classList.remove('is-dragging');
    }));
    els.dropzone.addEventListener('drop', event => {
      const file = event.dataTransfer.files?.[0];
      if (file) readWorkbook(file);
    });

    $('load-demo-general').addEventListener('click', () => {
      loadRows(GENERAL_DEMO_ROWS, '임의자료_일반경력대장.xlsx', 'general');
      toast('일반 경력대장 임의 자료를 불러왔습니다.');
    });
    $('load-demo-teacher').addEventListener('click', () => {
      loadRows(TEACHER_DEMO_ROWS, '임의자료_기간제교원대장.xlsx', 'teacher');
      toast('기간제교원 임의 자료를 불러왔습니다.');
    });
    $('clear-data').addEventListener('click', clearData);
  }

  function bindFormFields() {
    const fields = ['field-name', 'field-birth', 'field-address', 'field-purpose', 'field-issue-date', 'field-retirement', 'field-award', 'field-discipline', 'field-suspension'];
    fields.forEach(id => $(id).addEventListener('input', renderPreview));
    els.personSearch.addEventListener('input', renderPeople);
    $('reset-form').addEventListener('click', resetIssueForm);
    $('print-certificate').addEventListener('click', () => {
      const check = validateBeforePrint();
      if (!check.ok) return toast(check.message, true);
      printCertificateOnly();
    });
  }

  function bindBirthInput() {
    $('field-birth').addEventListener('input', event => {
      const formatted = formatBirthInput(event.target.value);
      if (event.target.value !== formatted) event.target.value = formatted;
      renderPreview();
    });
  }

  function bindModeControls() {
    $('certificate-mode-options').addEventListener('click', event => {
      const button = event.target.closest('[data-certificate-mode]');
      if (!button) return;
      const mode = button.dataset.certificateMode;
      if (state.ledgerType === 'teacher' && mode !== 'teacher') return;
      state.certificateMode = mode;
      renderCertificateModeOptions();
      renderCareers();
      renderPreview();
    });

    qsa('[data-rrn-display]').forEach(button => button.addEventListener('click', () => {
      state.rrnDisplay = button.dataset.rrnDisplay === 'yes';
      renderRrnControls();
      renderPreview();
    }));
  }

  function bindCareerControls() {
    $('select-all-careers').addEventListener('click', () => {
      const person = getSelectedPerson();
      if (!person) return;
      state.selectedRecordIds.clear();
      person.records.filter(record => !hasError(record)).forEach(record => state.selectedRecordIds.add(record.id));
      updateRetirementFromSelection();
      renderCareers();
      renderPreview();
    });
    $('clear-careers').addEventListener('click', () => {
      state.selectedRecordIds.clear();
      updateRetirementFromSelection();
      renderCareers();
      renderPreview();
    });
  }

  function bindSettings() {
    $('save-settings').addEventListener('click', () => {
      state.settings = {
        school: $('setting-school').value.trim() || DEFAULT_SETTINGS.school,
        department: $('setting-department').value.trim(),
        officer: $('setting-officer').value.trim(),
        phone: $('setting-phone').value.trim(),
        purpose: $('setting-purpose').value.trim() || '제출용'
      };
      localStorage.setItem('careerCertificateSettings', JSON.stringify(state.settings));
      $('field-purpose').value = state.settings.purpose;
      renderPreview();
      toast('학교 설정을 저장했습니다.');
    });
    $('reset-settings').addEventListener('click', () => {
      state.settings = { ...DEFAULT_SETTINGS };
      localStorage.removeItem('careerCertificateSettings');
      applySettingsToInputs();
      renderPreview();
      toast('학교 설정을 초기화했습니다.');
    });
  }

  function bindLedger() {
    els.ledgerSearch.addEventListener('input', renderLedger);
    els.issueFilter.addEventListener('change', renderLedger);
    $('export-ledger').addEventListener('click', exportLedger);
  }

  function bindEditDialog() {
    els.editForm.addEventListener('submit', event => {
      event.preventDefault();
      const index = Number($('edit-index').value);
      const current = state.records[index];
      if (!Number.isInteger(index) || !current) return;

      const identityRaw = $('edit-id-value').value.trim();
      const identity = parseIdentity(identityRaw);
      const updated = {
        ...current,
        name: $('edit-name').value.trim(),
        identityRaw,
        birth: identity.birth ? dateToInput(identity.birth) : '',
        rrn: identity.rrn || '',
        identityKind: identity.kind,
        position: $('edit-position').value.trim(),
        startRaw: $('edit-start').value,
        endRaw: $('edit-end').value,
        startDate: parseDateStrict($('edit-start').value),
        endDate: parseDateStrict($('edit-end').value),
        retirement: $('edit-retirement').value.trim(),
        note: $('edit-note').value.trim()
      };

      if (state.ledgerType === 'teacher') {
        updated.subject = $('edit-subject').value.trim();
        updated.department = '';
        updated.payType = '';
        updated.hours = '';
        if (!updated.retirement) updated.retirement = '계약기간 만료';
      } else {
        updated.department = $('edit-department').value.trim();
        updated.payType = $('edit-pay-type').value.trim();
        updated.hours = $('edit-hours').value.trim();
        updated.subject = '';
      }

      state.records[index] = updated;
      analyzeRecords();
      els.editDialog.close();
      renderAll();
      toast('경력 자료를 수정했습니다.');
    });
  }

  function loadSettings() {
    try {
      return { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem('careerCertificateSettings')) || {}) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function applySettingsToInputs() {
    $('setting-school').value = state.settings.school;
    $('setting-department').value = state.settings.department;
    $('setting-officer').value = state.settings.officer;
    $('setting-phone').value = state.settings.phone;
    $('setting-purpose').value = state.settings.purpose;
    $('field-purpose').value = state.settings.purpose;
  }

  function setToday() {
    $('field-issue-date').value = dateToInput(new Date());
  }

  async function readWorkbook(file) {
    try {
      await ensureXlsx();
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, raw: true });
      const detected = detectWorkbookLayout(workbook);
      if (!detected) throw new Error('지원하는 대장 형식을 확인할 수 없습니다. 엑셀의 열 제목을 확인해 주세요.');
      const rows = detected.rows.map(row => detected.type === 'teacher' ? mapTeacherRow(row) : mapGeneralRow(row));
      loadRows(rows, file.name, detected.type);
      toast(`${detected.type === 'teacher' ? '기간제교원' : '일반'} 경력대장으로 인식했습니다.`);
    } catch (error) {
      toast(error?.message || '엑셀을 읽지 못했습니다.', true);
    }
  }

  function detectWorkbookLayout(workbook) {
    let best = null;
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true, blankrows: false });
      const limit = Math.min(matrix.length, 12);
      for (let rowIndex = 0; rowIndex < limit; rowIndex += 1) {
        const headers = matrix[rowIndex].map(value => text(value));
        const normalized = headers.map(normalizeHeader);
        const teacherScore = scoreHeaders(normalized, 'teacher');
        const generalScore = scoreHeaders(normalized, 'general');
        const type = teacherScore > generalScore ? 'teacher' : 'general';
        const score = Math.max(teacherScore, generalScore);
        const threshold = type === 'teacher' ? 10 : 7;
        if (score < threshold || (best && score <= best.score)) continue;
        const rows = matrix.slice(rowIndex + 1)
          .filter(row => row.some(value => text(value) !== ''))
          .map(row => Object.fromEntries(headers.map((header, index) => [header || `열${index + 1}`, row[index] ?? ''])));
        best = { type, score, sheetName, headerRow: rowIndex, rows };
      }
    });
    return best;
  }

  function scoreHeaders(headers, type) {
    const has = field => HEADER_ALIASES[field].some(alias => headers.includes(normalizeHeader(alias)));
    if (type === 'teacher') {
      return (has('position') ? 2 : 0) + (has('name') ? 2 : 0) + (has('identity') ? 2 : 0) +
        (has('teacherStart') ? 2 : 0) + (has('teacherEnd') ? 2 : 0) + (has('subject') ? 1 : 0);
    }
    return (has('name') ? 2 : 0) + (has('identity') ? 1 : 0) + (has('start') ? 2 : 0) +
      (has('end') ? 2 : 0) + (has('position') ? 1 : 0) + (has('department') ? 1 : 0);
  }

  function mapGeneralRow(row) {
    const map = normalizedRowMap(row);
    return {
      name: valueFor(map, 'name'),
      identity: valueFor(map, 'identity'),
      department: valueFor(map, 'department'),
      position: valueFor(map, 'position'),
      payType: valueFor(map, 'payType'),
      start: valueFor(map, 'start'),
      end: valueFor(map, 'end'),
      period: valueFor(map, 'period'),
      retirement: valueFor(map, 'retirement'),
      note: valueFor(map, 'note'),
      hours: valueFor(map, 'hours')
    };
  }

  function mapTeacherRow(row) {
    const map = normalizedRowMap(row);
    return {
      position: valueFor(map, 'position'),
      subject: valueFor(map, 'subject'),
      name: valueFor(map, 'name'),
      identity: valueFor(map, 'identity'),
      start: valueFor(map, 'teacherStart'),
      end: valueFor(map, 'teacherEnd'),
      retirement: valueFor(map, 'retirement') || '계약기간 만료',
      note: valueFor(map, 'note')
    };
  }

  function normalizedRowMap(row) {
    const map = {};
    Object.entries(row).forEach(([key, value]) => { map[normalizeHeader(key)] = value; });
    return map;
  }

  function valueFor(map, field) {
    const key = HEADER_ALIASES[field].map(normalizeHeader).find(alias => Object.hasOwn(map, alias));
    return key ? map[key] : '';
  }

  function loadRows(rows, fileName, ledgerType) {
    state.fileName = fileName;
    state.ledgerType = ledgerType;
    state.certificateMode = ledgerType === 'teacher' ? 'teacher' : 'general';
    state.rrnDisplay = false;
    state.selectedPersonKey = null;
    state.selectedRecordIds.clear();
    state.records = rows
      .map((row, index) => normalizeRecord(row, index, ledgerType))
      .filter(record => record.name || record.identityRaw || record.startRaw || record.endRaw || record.position);
    analyzeRecords();
    clearIssueFields(true);
    renderAll();
  }

  function normalizeRecord(row, index, ledgerType) {
    const identityRaw = row.identity ?? row.birth ?? '';
    const identity = parseIdentity(identityRaw);
    const startRaw = row.start ?? row.startRaw ?? '';
    const endRaw = row.end ?? row.endRaw ?? '';
    return {
      id: `record-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
      sourceIndex: index + 2,
      ledgerType,
      name: text(row.name),
      identityRaw: identityRaw instanceof Date ? dateToInput(identityRaw) : text(identityRaw),
      identityKind: identity.kind,
      birth: identity.birth ? dateToInput(identity.birth) : '',
      rrn: identity.rrn || '',
      department: ledgerType === 'general' ? text(row.department) : '',
      subject: ledgerType === 'teacher' ? text(row.subject) : '',
      position: text(row.position),
      payType: ledgerType === 'general' ? text(row.payType) : '',
      startRaw,
      endRaw,
      startDate: parseDateStrict(startRaw),
      endDate: parseDateStrict(endRaw),
      period: text(row.period),
      retirement: ledgerType === 'teacher' ? (text(row.retirement) || '계약기간 만료') : text(row.retirement),
      note: text(row.note),
      hours: ledgerType === 'general' ? text(row.hours) : '',
      issues: []
    };
  }

  function analyzeRecords() {
    state.records.forEach(record => {
      const issues = [];
      if (!record.name) issues.push(issue('error', '성명이 비어 있습니다.'));
      if (!record.identityRaw) {
        issues.push(issue('error', state.ledgerType === 'teacher' ? '생년월일 또는 주민등록번호가 비어 있습니다.' : '생년월일이 비어 있습니다.'));
      } else if (!record.birth) {
        issues.push(issue('error', state.ledgerType === 'teacher' ? '생년월일 또는 주민등록번호 형식을 확인해 주세요.' : '생년월일 형식을 확인해 주세요.'));
      }
      if (!record.startDate) issues.push(issue('error', record.startRaw ? '시작일을 날짜로 읽을 수 없습니다.' : '시작일이 비어 있습니다.'));
      if (!record.endDate) issues.push(issue('error', record.endRaw ? '종료일을 날짜로 읽을 수 없습니다.' : '종료일이 비어 있습니다.'));
      if (record.startDate && record.endDate && record.endDate < record.startDate) issues.push(issue('error', '종료일이 시작일보다 빠릅니다.'));
      if (!record.position) issues.push(issue(state.ledgerType === 'teacher' ? 'error' : 'warning', '직급(위)이 비어 있습니다.'));
      if (state.ledgerType === 'teacher' && !record.subject) issues.push(issue('warning', '과목이 비어 있습니다.'));
      if (state.ledgerType === 'general' && !record.department) issues.push(issue('warning', '근무부서가 비어 있습니다.'));
      record.issues = issues;
    });

    const groups = groupBy(state.records.filter(record => record.name), personKey);
    Object.values(groups).forEach(records => {
      const valid = records.filter(record => record.startDate && record.endDate).sort((a, b) => a.startDate - b.startDate || a.endDate - b.endDate);
      valid.forEach((record, index) => {
        const previous = valid[index - 1];
        if (previous && record.startDate <= previous.endDate) record.issues.push(issue('warning', '앞 경력과 근무기간이 겹칩니다.'));
      });

      const seen = new Map();
      records.forEach(record => {
        const key = [record.name, record.birth, dateToInput(record.startDate), dateToInput(record.endDate), record.position, record.department, record.subject].join('|');
        if (seen.has(key)) record.issues.push(issue('warning', `대장 ${seen.get(key).sourceIndex}행과 같은 경력으로 보입니다.`));
        else seen.set(key, record);
      });

      const rrns = new Set(records.map(record => record.rrn).filter(Boolean));
      if (rrns.size > 1) records.forEach(record => record.issues.push(issue('error', '같은 성명과 생년월일에 서로 다른 주민등록번호가 입력되어 있습니다.')));
    });

    buildPeople();
    pruneSelections();
  }

  function buildPeople() {
    const groups = groupBy(state.records.filter(record => record.name), personKey);
    state.people = Object.entries(groups).map(([key, records]) => ({
      key,
      name: records[0].name,
      birth: records[0].birth,
      rrn: records.find(record => record.rrn)?.rrn || '',
      records: records.sort((a, b) => dateValue(a.startDate) - dateValue(b.startDate)),
      errorCount: records.reduce((sum, record) => sum + record.issues.filter(item => item.level === 'error').length, 0),
      warningCount: records.reduce((sum, record) => sum + record.issues.filter(item => item.level === 'warning').length, 0)
    })).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }

  function pruneSelections() {
    const validIds = new Set(state.records.map(record => record.id));
    [...state.selectedRecordIds].forEach(id => { if (!validIds.has(id)) state.selectedRecordIds.delete(id); });
    if (state.selectedPersonKey && !state.people.some(person => person.key === state.selectedPersonKey)) state.selectedPersonKey = null;
  }

  function renderAll() {
    renderUploadState();
    renderCertificateModeOptions();
    renderRrnControls();
    renderPeople();
    renderCareers();
    renderLedger();
    renderStats();
    renderPreview();
  }

  function renderUploadState() {
    if (!state.records.length) {
      els.fileState.textContent = '대장 없음';
      els.fileState.className = 'state-chip';
      els.uploadSummary.hidden = true;
      return;
    }
    const errors = countIssues('error');
    const warnings = countIssues('warning');
    const typeName = state.ledgerType === 'teacher' ? '기간제교원 대장' : '일반 경력대장';
    els.fileState.textContent = '불러옴';
    els.fileState.className = 'state-chip ready';
    els.uploadSummary.hidden = false;
    els.uploadSummary.innerHTML = `<div class="summary-line"><strong>${escapeHtml(state.fileName)}</strong><span class="type-badge ${state.ledgerType === 'teacher' ? 'teacher' : ''}">${typeName}</span></div>${state.people.length}명 · 경력 ${state.records.length}건 · 오류 ${errors}건 · 확인 필요 ${warnings}건`;
  }

  function renderCertificateModeOptions() {
    const container = $('certificate-mode-options');
    const options = state.ledgerType === 'teacher'
      ? [{ value: 'teacher', label: '기간제교원 경력증명서' }]
      : [{ value: 'general', label: '일반 경력증명서' }, { value: 'hours', label: '소정근로시간 포함' }];
    container.innerHTML = options.map(option => `<button class="segment-btn ${state.certificateMode === option.value ? 'is-active' : ''}" data-certificate-mode="${option.value}" type="button">${option.label}</button>`).join('');
  }

  function renderRrnControls() {
    const section = $('rrn-display-section');
    section.hidden = state.ledgerType !== 'teacher';
    qsa('[data-rrn-display]').forEach(button => button.classList.toggle('is-active', (button.dataset.rrnDisplay === 'yes') === state.rrnDisplay));
  }

  function renderPeople() {
    els.personCount.textContent = `${state.people.length}명`;
    if (!state.people.length) {
      els.personList.className = 'person-list empty-state small';
      els.personList.innerHTML = '<p>대장을 불러오면 대상자가 표시됩니다.</p>';
      return;
    }
    const term = normalizeSearch(els.personSearch.value);
    const people = state.people.filter(person => normalizeSearch(`${person.name} ${person.birth}`).includes(term));
    els.personList.className = 'person-list';
    els.personList.innerHTML = people.length ? people.map(person => `
      <button class="person-card ${person.key === state.selectedPersonKey ? 'is-active' : ''}" data-person-key="${escapeAttr(person.key)}" type="button">
        <span class="person-main"><strong>${escapeHtml(person.name)}</strong><small>${person.birth ? formatDate(parseDateStrict(person.birth)) : '생년월일 확인 필요'}</small></span>
        <span class="person-meta">경력 ${person.records.length}건<br>${person.errorCount ? `<span class="has-error">오류 ${person.errorCount}</span>` : person.warningCount ? `확인 ${person.warningCount}` : '정상'}</span>
      </button>`).join('') : '<div class="empty-state small"><p>검색 결과가 없습니다.</p></div>';
    els.personList.querySelectorAll('[data-person-key]').forEach(button => button.addEventListener('click', () => selectPerson(button.dataset.personKey)));
  }

  function selectPerson(key) {
    state.selectedPersonKey = key;
    state.selectedRecordIds.clear();
    state.rrnDisplay = false;
    const person = getSelectedPerson();
    if (person) {
      person.records.filter(record => !hasError(record)).forEach(record => state.selectedRecordIds.add(record.id));
      $('field-name').value = person.name;
      $('field-birth').value = person.birth || '';
      updateRetirementFromSelection();
    }
    renderPeople();
    renderRrnControls();
    renderCareers();
    renderPreview();
  }

  function renderCareers() {
    const person = getSelectedPerson();
    const selectedRecords = getSelectedRecords();
    els.selectedCount.textContent = person ? `${selectedRecords.length}건 선택 / 전체 ${person.records.length}건` : '0건 선택';
    $('select-all-careers').disabled = !person;
    $('clear-careers').disabled = !person || !state.selectedRecordIds.size;

    if (!person) {
      els.careerTitle.textContent = '대상자를 먼저 선택해주세요';
      els.careerList.className = 'career-list empty-state small';
      els.careerList.innerHTML = '<p>선택한 사람의 경력이 이곳에 표시됩니다.</p>';
      els.careerAlert.hidden = true;
      return;
    }

    els.careerTitle.textContent = `${person.name}님의 등록 경력 ${person.records.length}건`;
    els.careerList.className = 'career-list';
    els.careerList.innerHTML = person.records.map(record => {
      const blocked = hasError(record);
      const status = blocked ? ['error', '오류'] : hasWarning(record) ? ['warning', '확인 필요'] : ['clean', '정상'];
      const detail = state.ledgerType === 'teacher'
        ? `${record.position || '직위 미기재'} · ${record.subject || '과목 미기재'}`
        : `${record.position || '직급 미기재'} · ${record.department || '부서 미기재'}`;
      return `<label class="career-card ${state.selectedRecordIds.has(record.id) ? 'is-selected' : ''} ${blocked ? 'is-blocked' : ''}">
        <input class="career-check" type="checkbox" data-record-id="${record.id}" ${state.selectedRecordIds.has(record.id) ? 'checked' : ''} ${blocked ? 'disabled' : ''} />
        <span class="career-info"><strong>${formatDate(record.startDate)} ~ ${formatDate(record.endDate)}</strong><span>${escapeHtml(detail)}</span></span>
        <span class="career-badges"><span class="status-pill ${status[0]}">${status[1]}</span>${record.startDate && record.endDate && !blocked ? `<span>${formatDuration(calculateDuration(record.startDate, record.endDate))}</span>` : ''}</span>
      </label>`;
    }).join('');
    els.careerList.querySelectorAll('[data-record-id]').forEach(input => input.addEventListener('change', () => toggleRecord(input.dataset.recordId, input.checked)));

    const messages = person.records.flatMap(record => record.issues.map(item => item.message));
    if (state.certificateMode === 'hours') {
      const missingHours = selectedRecords.filter(record => !record.hours).length;
      if (missingHours) messages.unshift(`선택한 경력 중 소정근로시간이 입력되지 않은 자료가 ${missingHours}건 있습니다.`);
    }
    els.careerAlert.hidden = !messages.length;
    if (messages.length) {
      const hasErrors = person.records.some(hasError);
      els.careerAlert.className = `inline-alert ${hasErrors ? 'error' : ''}`;
      els.careerAlert.innerHTML = messages.slice(0, 6).map(message => `• ${escapeHtml(message)}`).join('<br>') + (messages.length > 6 ? '<br>• 대장 점검 화면에서 나머지 내용을 확인하세요.' : '');
    }
  }

  function toggleRecord(id, checked) {
    checked ? state.selectedRecordIds.add(id) : state.selectedRecordIds.delete(id);
    updateRetirementFromSelection();
    renderCareers();
    renderPreview();
  }

  function updateRetirementFromSelection() {
    const latest = [...getSelectedRecords()].sort(compareLatest).at(-1);
    $('field-retirement').value = latest?.retirement || (state.ledgerType === 'teacher' && latest ? '계약기간 만료' : '');
  }

  function renderLedger() {
    $('ledger-extra-heading').textContent = state.ledgerType === 'teacher' ? '과목' : '근무부서';
    if (!state.records.length) {
      els.ledgerBody.innerHTML = '<tr><td colspan="9" class="empty-cell">대장을 불러오면 점검 결과가 표시됩니다.</td></tr>';
      return;
    }
    const term = normalizeSearch(els.ledgerSearch.value);
    const filter = els.issueFilter.value;
    const rows = state.records.filter(record => {
      const status = hasError(record) ? 'error' : hasWarning(record) ? 'warning' : 'clean';
      const searchable = normalizeSearch([record.name, record.birth, record.position, record.department, record.subject, record.retirement, record.note, record.issues.map(item => item.message).join(' ')].join(' '));
      return (!term || searchable.includes(term)) && (filter === 'all' || filter === status);
    });
    els.ledgerBody.innerHTML = rows.length ? rows.map(record => {
      const actualIndex = state.records.indexOf(record);
      const status = hasError(record) ? ['error', '오류'] : hasWarning(record) ? ['warning', '확인 필요'] : ['clean', '정상'];
      const issueHtml = record.issues.length ? record.issues.map(item => `<div class="${item.level === 'error' ? 'error-text' : 'warning-text'}">• ${escapeHtml(item.message)}</div>`).join('') : '점검 결과 이상 없음';
      return `<tr>
        <td><span class="status-pill ${status[0]}">${status[1]}</span></td>
        <td><strong>${escapeHtml(record.name || '(미기재)')}</strong></td>
        <td>${record.birth ? escapeHtml(formatDate(parseDateStrict(record.birth))) : '-'}</td>
        <td>${formatDate(record.startDate)}<br>~ ${formatDate(record.endDate)}</td>
        <td>${escapeHtml(record.position || '-')}</td>
        <td>${escapeHtml((state.ledgerType === 'teacher' ? record.subject : record.department) || '-')}</td>
        <td>${escapeHtml(record.retirement || '-')}</td>
        <td class="issue-text">${issueHtml}</td>
        <td><button class="edit-row" data-edit-index="${actualIndex}" type="button">수정</button></td>
      </tr>`;
    }).join('') : '<tr><td colspan="9" class="empty-cell">조건에 맞는 자료가 없습니다.</td></tr>';
    els.ledgerBody.querySelectorAll('[data-edit-index]').forEach(button => button.addEventListener('click', () => openEditDialog(Number(button.dataset.editIndex))));
  }

  function renderStats() {
    $('stat-people').textContent = state.people.length;
    $('stat-records').textContent = state.records.length;
    $('stat-errors').textContent = countIssues('error');
    $('stat-warnings').textContent = countIssues('warning');
  }

  function renderPreview() {
    const selected = getSelectedRecords().sort((a, b) => dateValue(a.startDate) - dateValue(b.startDate));
    const capacity = selected.length > 5 ? 10 : 5;
    const appendixCount = selected.length > 10 ? Math.ceil((selected.length - 10) / 15) : 0;
    $('template-state').textContent = appendixCount ? `10줄 서식 + 별지 ${appendixCount}장` : `${capacity}줄 서식`;

    const total = sumDurations(selected.map(record => calculateDuration(record.startDate, record.endDate)));
    const pages = [buildMainCertificate(selected, capacity, total)];
    if (appendixCount) {
      const appendixRecords = selected.slice(10);
      const chunks = chunk(appendixRecords, 15);
      chunks.forEach((records, index) => pages.push(buildAppendixPage(records, index + 1, chunks.length)));
    }
    $('certificate-pages').innerHTML = pages.join('');
    $('print-certificate').disabled = !selected.length;
    schedulePreviewFit();
  }

  function buildMainCertificate(selected, capacity, total) {
    const person = getSelectedPerson();
    const issueDate = parseDateStrict($('field-issue-date').value);
    const identifier = getPreviewIdentifier(person);
    const latest = [...selected].sort(compareLatest).at(-1);
    const finalPosition = latest ? (state.ledgerType === 'teacher' && latest.subject ? `${latest.position}(${latest.subject})` : latest.position) : '';
    const firstPageRecords = selected.slice(0, capacity);
    return `<article class="certificate" aria-label="경력증명서">
      <h1>경 력 증 명 서</h1>
      <table class="certificate-table identity-table"><tbody>
        <tr><th rowspan="2" class="section-label">인적<br />사항</th><th>성명</th><td colspan="3">${escapeHtml($('field-name').value.trim())}</td><th>${identifier.label}</th><td colspan="2">${escapeHtml(identifier.value)}</td></tr>
        <tr><th>주소</th><td colspan="6">${escapeHtml($('field-address').value.trim())}</td></tr>
      </tbody></table>
      ${buildMainCareerTable(firstPageRecords, capacity, total, selected.length)}
      <table class="certificate-table summary-table"><tbody>
        <tr><th class="section-label">근무연한</th><td colspan="3">${selected.length ? escapeHtml(formatDuration(total)) : ''}</td><th>최종직위 또는 직급</th><td colspan="3">${escapeHtml(finalPosition || '')}</td></tr>
        <tr><th class="section-label">퇴직사유</th><td colspan="7">${escapeHtml($('field-retirement').value.trim())}</td></tr>
      </tbody></table>
      <table class="certificate-table history-table"><tbody>
        <tr><th rowspan="3" class="section-label">상벌<br />사항</th><th colspan="3">포 상</th><th colspan="4">징 계</th></tr>
        <tr><th>연월일</th><th>종류</th><th>시행청</th><th>연월일</th><th colspan="2">종류</th><th>시행청</th></tr>
        <tr><td></td><td>${escapeHtml($('field-award').value.trim())}</td><td></td><td></td><td colspan="2">${escapeHtml($('field-discipline').value.trim())}</td><td></td></tr>
        <tr><th rowspan="2" class="section-label">직위<br />해제</th><th>연월일</th><th colspan="5">사 유</th><th>처분청</th></tr>
        <tr><td></td><td colspan="5">${escapeHtml($('field-suspension').value.trim())}</td><td></td></tr>
        <tr><th class="section-label">용도</th><td colspan="7">${escapeHtml($('field-purpose').value.trim())}</td></tr>
      </tbody></table>
      <div class="certificate-footer">
        <p class="certify-text">위와 같이 경력을 증명합니다.</p>
        <p class="issue-date">${formatIssueDate(issueDate)}</p>
        <p class="school-name">${escapeHtml(spacedSchoolName(state.settings.school))} 장</p>
        <div class="contact-box">
          <div><span>담당부서</span><strong>${escapeHtml(state.settings.department)}</strong></div>
          <div><span>담 당 자</span><strong>${escapeHtml(state.settings.officer)}</strong></div>
          <div><span>전화번호</span><strong>${escapeHtml(state.settings.phone)}</strong></div>
        </div>
      </div>
    </article>`;
  }

  function buildMainCareerTable(records, capacity, total, selectedCount) {
    const isHours = state.certificateMode === 'hours';
    const isTeacher = state.certificateMode === 'teacher';
    const totalRowspan = capacity + 3;
    const colgroup = isHours
      ? `<col class="col-section"><col class="col-date"><col class="col-date"><col class="col-ymd"><col class="col-ymd"><col class="col-ymd"><col class="col-position"><col class="col-department"><col class="col-hours">`
      : `<col class="col-section"><col class="col-date"><col class="col-date"><col class="col-ymd"><col class="col-ymd"><col class="col-ymd"><col class="col-position"><col class="col-department">`;
    const header = isHours
      ? `<tr><th rowspan="${totalRowspan}" class="section-label section-label-career">경력<br />사항</th><th colspan="2">근무 기간</th><th colspan="3">근무연수</th><th rowspan="2">직급(위)</th><th rowspan="2">근무부서</th><th rowspan="2">소정근로시간</th></tr>`
      : `<tr><th rowspan="${totalRowspan}" class="section-label section-label-career">경력<br />사항</th><th colspan="2">근무 기간</th><th colspan="3">근무연수</th><th rowspan="2">직급(위)</th><th rowspan="2">${isTeacher ? '과목' : '근무부서'}</th></tr>`;
    const rows = [header, '<tr><th>부터</th><th>까지</th><th>연</th><th>월</th><th>일</th></tr>'];
    for (let index = 0; index < capacity; index += 1) {
      const record = records[index];
      if (record) rows.push(buildCareerRow(record, isHours, isTeacher));
      else {
        const blanks = isHours ? 8 : 7;
        const cells = Array.from({ length: blanks }, (_, cellIndex) => `<td>${index === records.length && cellIndex === 5 ? '이하여백' : ''}</td>`).join('');
        rows.push(`<tr>${cells}</tr>`);
      }
    }
    rows.push(isHours
      ? `<tr><th colspan="2">계</th><td>${selectedCount ? total.years : ''}</td><td>${selectedCount ? total.months : ''}</td><td>${selectedCount ? total.days : ''}</td><td colspan="3"></td></tr>`
      : `<tr><th colspan="2">계</th><td>${selectedCount ? total.years : ''}</td><td>${selectedCount ? total.months : ''}</td><td>${selectedCount ? total.days : ''}</td><td colspan="2"></td></tr>`);
    return `<table class="certificate-table career-table ${isHours ? 'hours-table' : ''}"><colgroup>${colgroup}</colgroup><tbody>${rows.join('')}</tbody></table>`;
  }

  function buildCareerRow(record, isHours, isTeacher) {
    const duration = calculateDuration(record.startDate, record.endDate);
    const extra = isTeacher ? record.subject : record.department;
    return `<tr><td>${formatDate(record.startDate)}</td><td>${formatDate(record.endDate)}</td><td>${duration.years}</td><td>${duration.months}</td><td>${duration.days}</td><td>${escapeHtml(record.position)}</td><td>${escapeHtml(extra)}</td>${isHours ? `<td>${escapeHtml(record.hours)}</td>` : ''}</tr>`;
  }

  function buildAppendixPage(records, pageNo, totalPages) {
    const person = getSelectedPerson();
    const identifier = getPreviewIdentifier(person);
    const issueDate = parseDateStrict($('field-issue-date').value);
    const isHours = state.certificateMode === 'hours';
    const isTeacher = state.certificateMode === 'teacher';
    const colgroup = isHours
      ? `<col class="col-date"><col class="col-date"><col class="col-ymd"><col class="col-ymd"><col class="col-ymd"><col class="col-position"><col class="col-department"><col class="col-hours">`
      : `<col class="col-date"><col class="col-date"><col class="col-ymd"><col class="col-ymd"><col class="col-ymd"><col class="col-position"><col class="col-department">`;
    const header = isHours
      ? '<tr><th colspan="2">근무 기간</th><th colspan="3">근무연수</th><th rowspan="2">직급(위)</th><th rowspan="2">근무부서</th><th rowspan="2">소정근로시간</th></tr>'
      : `<tr><th colspan="2">근무 기간</th><th colspan="3">근무연수</th><th rowspan="2">직급(위)</th><th rowspan="2">${isTeacher ? '과목' : '근무부서'}</th></tr>`;
    const rows = [header, '<tr><th>부터</th><th>까지</th><th>연</th><th>월</th><th>일</th></tr>'];
    for (let index = 0; index < 15; index += 1) {
      const record = records[index];
      if (record) rows.push(buildCareerRow(record, isHours, isTeacher));
      else rows.push(`<tr>${Array.from({ length: isHours ? 8 : 7 }, () => '<td></td>').join('')}</tr>`);
    }
    return `<article class="certificate appendix-page" aria-label="경력사항 별지">
      <h1>경 력 사 항 별 지</h1>
      <table class="certificate-table appendix-meta"><tbody><tr><th>성명</th><td>${escapeHtml($('field-name').value.trim())}</td><th>${identifier.label}</th><td>${escapeHtml(identifier.value)}</td></tr></tbody></table>
      <table class="certificate-table career-table appendix-table ${isHours ? 'hours-table' : ''}"><colgroup>${colgroup}</colgroup><tbody>${rows.join('')}</tbody></table>
      <div class="appendix-footer"><span class="appendix-date">${formatIssueDate(issueDate)}</span><span class="appendix-school">${escapeHtml(state.settings.school)}</span><span class="appendix-page-no">별지 ${pageNo} / ${totalPages}</span></div>
    </article>`;
  }

  function getPreviewIdentifier(person) {
    if (state.ledgerType === 'teacher' && state.rrnDisplay) return { label: '주민등록번호', value: person?.rrn || '' };
    return { label: '생년월일', value: formatDate(parseDateStrict($('field-birth').value)) };
  }

  function resetIssueForm() {
    $('field-address').value = '';
    $('field-purpose').value = state.settings.purpose;
    $('field-award').value = '해당없음';
    $('field-discipline').value = '해당없음';
    $('field-suspension').value = '해당없음';
    state.rrnDisplay = false;
    setToday();
    updateRetirementFromSelection();
    renderRrnControls();
    renderPreview();
    toast('발급 입력값을 초기화했습니다.');
  }

  function validateBeforePrint() {
    const selected = getSelectedRecords();
    if (!selected.length) return { ok: false, message: '발급할 경력을 한 건 이상 선택해 주세요.' };
    if (!$('field-name').value.trim()) return { ok: false, message: '성명을 입력해 주세요.' };
    if (!parseDateStrict($('field-birth').value)) return { ok: false, message: '생년월일을 확인해 주세요.' };
    if (!parseDateStrict($('field-issue-date').value)) return { ok: false, message: '발급일을 확인해 주세요.' };
    if (state.ledgerType === 'teacher' && state.rrnDisplay && !getSelectedPerson()?.rrn) return { ok: false, message: '이 대상자에게는 주민등록번호가 입력되어 있지 않습니다.' };
    if (state.certificateMode === 'hours' && selected.some(record => !record.hours)) return { ok: false, message: '선택한 경력 중 소정근로시간이 입력되지 않은 자료가 있습니다.' };
    return { ok: true };
  }

  function printCertificateOnly() {
    const pages = $('certificate-pages');
    if (!pages?.children.length) return toast('인쇄할 증명서를 찾지 못했습니다.', true);

    const printFrame = document.createElement('iframe');
    printFrame.setAttribute('title', '경력증명서 인쇄');
    printFrame.setAttribute('aria-hidden', 'true');
    Object.assign(printFrame.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0', visibility: 'hidden' });
    document.body.appendChild(printFrame);

    const printDocument = printFrame.contentDocument || printFrame.contentWindow?.document;
    if (!printDocument) {
      printFrame.remove();
      return toast('인쇄 화면을 열지 못했습니다.', true);
    }

    const stylesheetUrl = new URL('styles.css', document.baseURI).href;
    printDocument.open();
    printDocument.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title></title><link rel="stylesheet" href="${stylesheetUrl}"><style>
      @page{size:A4 portrait;margin:0}html,body{width:210mm!important;min-width:0!important;margin:0!important;padding:0!important;background:#fff!important;overflow:visible!important}.certificate-pages{display:block!important;position:static!important;left:auto!important;top:auto!important;width:210mm!important;height:auto!important;transform:none!important}.certificate{display:block!important;width:210mm!important;height:297mm!important;min-height:297mm!important;margin:0!important;box-shadow:none!important;break-after:page!important;page-break-after:always!important}.certificate:last-child{break-after:auto!important;page-break-after:auto!important}
    </style></head><body>${pages.outerHTML}</body></html>`);
    printDocument.close();

    const cleanUp = () => window.setTimeout(() => printFrame.remove(), 300);
    printFrame.onload = () => window.setTimeout(() => {
      const printWindow = printFrame.contentWindow;
      if (!printWindow) return cleanUp();
      printWindow.addEventListener('afterprint', cleanUp, { once: true });
      printWindow.focus();
      printWindow.print();
      window.setTimeout(cleanUp, 3000);
    }, 300);
  }

  function openEditDialog(index) {
    const record = state.records[index];
    if (!record) return;
    const teacher = state.ledgerType === 'teacher';
    $('edit-index').value = index;
    $('edit-title').textContent = teacher ? '기간제교원 경력 수정' : '일반 경력 수정';
    $('edit-name').value = record.name;
    $('edit-id-label').textContent = teacher ? '생년월일 또는 주민번호' : '생년월일';
    $('edit-id-value').value = record.rrn || record.birth || record.identityRaw;
    $('edit-position').value = record.position;
    $('edit-department-group').hidden = teacher;
    $('edit-pay-type-group').hidden = teacher;
    $('edit-hours-group').hidden = teacher;
    $('edit-subject-group').hidden = !teacher;
    $('edit-department').value = record.department;
    $('edit-subject').value = record.subject;
    $('edit-pay-type').value = record.payType;
    $('edit-hours').value = record.hours;
    $('edit-start').value = record.startDate ? dateToInput(record.startDate) : safeInputDate(record.startRaw);
    $('edit-end').value = record.endDate ? dateToInput(record.endDate) : safeInputDate(record.endRaw);
    $('edit-retirement').value = record.retirement;
    $('edit-note').value = record.note;
    els.editIssues.hidden = !record.issues.length;
    els.editIssues.className = `inline-alert ${hasError(record) ? 'error' : ''}`;
    els.editIssues.innerHTML = record.issues.map(item => `• ${escapeHtml(item.message)}`).join('<br>');
    els.editDialog.showModal();
  }

  async function exportLedger() {
    if (!state.records.length) return toast('내려받을 대장이 없습니다.', true);
    try { await ensureXlsx(); } catch (error) { return toast(error.message, true); }
    let rows;
    let filePrefix;
    if (state.ledgerType === 'teacher') {
      rows = state.records.map(record => ({
        '직위(급)': record.position,
        '과목': record.subject,
        '성명': record.name,
        '생년월일 또는 주민번호': record.rrn || record.birth,
        '임용시작일': record.startDate ? formatDate(record.startDate) : displayRaw(record.startRaw),
        '임용종료일': record.endDate ? formatDate(record.endDate) : displayRaw(record.endRaw)
      }));
      filePrefix = '기간제교원_경력대장_점검수정';
    } else {
      rows = state.records.map(record => ({
        '성명': record.name,
        '생년월일': record.birth ? formatDate(parseDateStrict(record.birth)) : '',
        '근무부서': record.department,
        '직급(위)': record.position,
        '급제': record.payType,
        '시작일': record.startDate ? formatDate(record.startDate) : displayRaw(record.startRaw),
        '종료일': record.endDate ? formatDate(record.endDate) : displayRaw(record.endRaw),
        '기간': record.startDate && record.endDate && record.endDate >= record.startDate ? formatDuration(calculateDuration(record.startDate, record.endDate)) : '',
        '퇴직사유': record.retirement,
        '비고': record.note,
        '소정근로시간': record.hours,
        '점검결과': record.issues.map(item => `${item.level === 'error' ? '오류' : '확인'}: ${item.message}`).join(' / ')
      }));
      filePrefix = '경력대장_점검수정';
    }
    const sheet = XLSX.utils.json_to_sheet(rows);
    sheet['!cols'] = state.ledgerType === 'teacher'
      ? [18, 14, 14, 24, 15, 15].map(wch => ({ wch }))
      : [12, 14, 14, 22, 13, 14, 14, 15, 16, 38, 16, 50].map(wch => ({ wch }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, state.ledgerType === 'teacher' ? '기간제교원_대장' : '대장');
    XLSX.writeFile(workbook, `${filePrefix}_${dateToInput(new Date()).replaceAll('-', '')}.xlsx`);
    toast('수정 대장을 내려받았습니다.');
  }

  function clearData() {
    state.records = [];
    state.people = [];
    state.fileName = '';
    state.ledgerType = 'none';
    state.certificateMode = 'general';
    state.rrnDisplay = false;
    state.selectedPersonKey = null;
    state.selectedRecordIds.clear();
    clearIssueFields(true);
    renderAll();
    toast('불러온 대장을 비웠습니다.');
  }

  function clearIssueFields(clearName) {
    if (clearName) {
      $('field-name').value = '';
      $('field-birth').value = '';
    }
    $('field-address').value = '';
    $('field-retirement').value = '';
    $('field-purpose').value = state.settings.purpose;
    $('field-award').value = '해당없음';
    $('field-discipline').value = '해당없음';
    $('field-suspension').value = '해당없음';
    setToday();
  }

  function getSelectedPerson() {
    return state.people.find(person => person.key === state.selectedPersonKey) || null;
  }

  function getSelectedRecords() {
    return state.records.filter(record => state.selectedRecordIds.has(record.id) && !hasError(record));
  }

  function personKey(record) {
    return `${record.name.trim()}|${record.birth || `미확인-${record.sourceIndex}`}`;
  }

  function hasError(record) { return record.issues.some(item => item.level === 'error'); }
  function hasWarning(record) { return record.issues.some(item => item.level === 'warning'); }
  function issue(level, message) { return { level, message }; }
  function countIssues(level) { return state.records.reduce((sum, record) => sum + record.issues.filter(item => item.level === level).length, 0); }
  function compareLatest(a, b) { return dateValue(a.endDate || a.startDate) - dateValue(b.endDate || b.startDate); }
  function dateValue(date) { return date instanceof Date && !Number.isNaN(date.valueOf()) ? date.valueOf() : 0; }

  function parseIdentity(value) {
    if (value === null || value === undefined || value === '') return { kind: 'empty', birth: null, rrn: '' };
    if (value instanceof Date || typeof value === 'number') {
      const birth = parseDateStrict(value);
      return { kind: birth ? 'birth' : 'invalid', birth, rrn: '' };
    }
    const raw = String(value).trim();
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 13) {
      const yearPart = Number(digits.slice(0, 2));
      const month = Number(digits.slice(2, 4));
      const day = Number(digits.slice(4, 6));
      const code = digits[6];
      const century = ['1', '2', '5', '6'].includes(code) ? 1900 : ['3', '4', '7', '8'].includes(code) ? 2000 : ['9', '0'].includes(code) ? 1800 : null;
      const birth = century === null ? null : strictDate(century + yearPart, month, day);
      return { kind: birth ? 'rrn' : 'invalid', birth, rrn: birth ? `${digits.slice(0, 6)}-${digits.slice(6)}` : '' };
    }
    const birth = parseDateStrict(raw);
    return { kind: birth ? 'birth' : 'invalid', birth, rrn: '' };
  }

  function formatBirthInput(value) {
    const digits = String(value ?? '').replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  }

  function parseDateStrict(value) {
    if (value === null || value === undefined || value === '') return null;
    if (value instanceof Date && !Number.isNaN(value.valueOf())) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    if (typeof value === 'number' && Number.isFinite(value)) {
      if (window.XLSX?.SSF?.parse_date_code) {
        const parsed = XLSX.SSF.parse_date_code(value);
        if (parsed) return strictDate(parsed.y, parsed.m, parsed.d);
      }
      const epoch = new Date(Date.UTC(1899, 11, 30));
      const date = new Date(epoch.getTime() + Math.round(value) * 86400000);
      return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    }
    const textValue = String(value).trim();
    if (!textValue || /^#/.test(textValue)) return null;
    const digits = textValue.match(/^(\d{4})\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})\s*일?\.?$/);
    if (digits) return strictDate(Number(digits[1]), Number(digits[2]), Number(digits[3]));
    const compact = textValue.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (compact) return strictDate(Number(compact[1]), Number(compact[2]), Number(compact[3]));
    return null;
  }

  function strictDate(year, month, day) {
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
  }

  function calculateDuration(start, end) {
    if (!start || !end || end < start) return { years: 0, months: 0, days: 0 };
    const endExclusive = addDays(end, 1);
    let years = endExclusive.getFullYear() - start.getFullYear();
    if (addYearsClamped(start, years) > endExclusive) years -= 1;
    let cursor = addYearsClamped(start, years);
    let months = 0;
    while (months < 11 && addMonthsClamped(cursor, 1) <= endExclusive) {
      cursor = addMonthsClamped(cursor, 1);
      months += 1;
    }
    const days = diffDays(cursor, endExclusive);
    return { years, months, days };
  }

  function sumDurations(durations) {
    let years = 0, months = 0, days = 0;
    durations.forEach(duration => { years += duration.years; months += duration.months; days += duration.days; });
    months += Math.floor(days / 30);
    days %= 30;
    years += Math.floor(months / 12);
    months %= 12;
    return { years, months, days };
  }

  function addYearsClamped(date, years) {
    const result = new Date(date.getFullYear() + years, date.getMonth(), 1);
    result.setDate(Math.min(date.getDate(), daysInMonth(result.getFullYear(), result.getMonth())));
    return result;
  }

  function addMonthsClamped(date, months) {
    const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
    target.setDate(Math.min(date.getDate(), daysInMonth(target.getFullYear(), target.getMonth())));
    return target;
  }

  function addDays(date, days) { return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days); }
  function daysInMonth(year, monthIndex) { return new Date(year, monthIndex + 1, 0).getDate(); }
  function diffDays(a, b) { return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000); }
  function formatDuration(duration) { return `${duration.years}년 ${duration.months}월 ${duration.days}일`; }
  function formatDate(date) { return date ? `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}.` : '-'; }
  function formatIssueDate(date) { return date ? `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일` : ''; }
  function dateToInput(date) { return date ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` : ''; }
  function safeInputDate(value) { const date = parseDateStrict(value); return date ? dateToInput(date) : ''; }
  function pad(value) { return String(value).padStart(2, '0'); }
  function displayRaw(value) { return value instanceof Date ? formatDate(value) : String(value ?? ''); }
  function text(value) { return value === null || value === undefined ? '' : String(value).trim(); }
  function normalizeHeader(value) { return text(value).replace(/[\s\n\r_()（）·.\-\/]/g, '').toLowerCase(); }
  function normalizeSearch(value) { return text(value).replace(/\s/g, '').toLowerCase(); }
  function groupBy(items, keyFn) { return items.reduce((groups, item) => { const key = keyFn(item); (groups[key] ||= []).push(item); return groups; }, {}); }
  function spacedSchoolName(name) { return [...text(name)].join('   '); }
  function chunk(items, size) { return Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, index * size + size)); }
  function escapeHtml(value) { return text(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]); }
  function escapeAttr(value) { return escapeHtml(value); }

  function toast(message, isError = false) {
    els.toast.textContent = message;
    els.toast.style.background = isError ? '#991b1b' : '#111827';
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => els.toast.classList.remove('show'), 2800);
  }
})();
