(() => {
  'use strict';

  const HEADER_ALIASES = {
    name: ['성명', '이름'],
    birth: ['생년월일', '생년 월일', '주민번호앞자리', '생년'],
    department: ['근무부서', '부서', '근무 부서'],
    position: ['직급(위)', '직급', '직위', '직종'],
    payType: ['급제', '급여형태', '계약형태'],
    start: ['시작일', '근무시작일', '임용일', '근무 시작일'],
    end: ['종료일', '근무종료일', '퇴직일', '근무 종료일'],
    period: ['기간', '근무기간'],
    retirement: ['퇴직사유', '퇴직 사유'],
    note: ['비고', '참고'],
    hours: ['소정근로시간', '주당근로시간', '주당 근로시간', '근로시간']
  };

  const DEFAULT_SETTINGS = {
    school: '대청중학교',
    department: '행정실',
    officer: '',
    phone: '',
    purpose: '제출용'
  };

  const DEMO_ROWS = [
    { name: '김가람', birth: '1982-03-14', department: '급식실', position: '조리실무사', payType: '교육공무직', start: '2018-03-01', end: '2021-02-28', retirement: '계약만료', note: '' },
    { name: '김가람', birth: '1982-03-14', department: '급식실', position: '조리실무사', payType: '교육공무직', start: '2021-03-01', end: '2024-08-31', retirement: '의원면직', note: '' },
    { name: '박나래', birth: '1975-11-02', department: '행정실', position: '행정대체', payType: '기간제', start: '2024-01-02', end: '2024-06-30', retirement: '계약만료', note: '' },
    { name: '이도윤', birth: '1990-06-18', department: '교무실', position: '시간강사', payType: '시간제', start: '2023-03-02', end: '2023-07-18', retirement: '계약만료', note: '', hours: '주 8시간' },
    { name: '이도윤', birth: '1990-06-18', department: '교무실', position: '시간강사', payType: '시간제', start: '2023-08-17', end: '2023-12-29', retirement: '계약만료', note: '', hours: '주 8시간' },
    { name: '최서윤', birth: '', department: '급식실', position: '배식원', payType: '시급', start: '2022-09-01', end: '', retirement: '', note: '종료일 확인 필요' },
    { name: '정하준', birth: '1988-02-20', department: '시설관리실', position: '시설관리원', payType: '기간제', start: '2025-03-01', end: '2025-02-28', retirement: '계약만료', note: '종료일이 시작일보다 빠른 임의 오류' }
  ];

  const state = {
    records: [],
    people: [],
    selectedPersonKey: null,
    selectedRecordIds: new Set(),
    fileName: '',
    settings: loadSettings()
  };

  const $ = (id) => document.getElementById(id);
  const qsa = (selector) => [...document.querySelectorAll(selector)];

  let xlsxPromise = null;

  const els = {
    fileInput: $('file-input'), dropzone: $('dropzone'), fileState: $('file-state'), uploadSummary: $('upload-summary'),
    personSearch: $('person-search'), personList: $('person-list'), personCount: $('person-count'),
    careerTitle: $('career-title'), careerList: $('career-list'), careerAlert: $('career-alert'), selectedCount: $('selected-count'),
    ledgerBody: $('ledger-body'), ledgerSearch: $('ledger-search'), issueFilter: $('issue-filter'),
    editDialog: $('edit-dialog'), editForm: $('edit-form'), editIssues: $('edit-issues'), toast: $('toast')
  };

  init();

  function init() {
    bindTabs();
    bindUpload();
    bindFormFields();
    bindBirthInputs();
    bindSettings();
    bindLedger();
    bindEditDialog();
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
      script.onload = () => window.XLSX ? resolve(window.XLSX) : reject(new Error('엑셀 라이브러리를 확인할 수 없습니다.'));
      script.onerror = () => reject(new Error('엑셀 라이브러리를 불러오지 못했습니다.'));
      document.head.appendChild(script);
      setTimeout(() => {
        if (!window.XLSX) reject(new Error('엑셀 라이브러리 연결 시간이 초과되었습니다.'));
      }, 15000);
    });
    return xlsxPromise;
  }

  function bindTabs() {
    qsa('.tab').forEach(button => button.addEventListener('click', () => {
      qsa('.tab').forEach(tab => tab.classList.toggle('is-active', tab === button));
      qsa('.tab-panel').forEach(panel => panel.classList.remove('is-active'));
      $(`tab-${button.dataset.tab}`).classList.add('is-active');
    }));
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

    $('load-demo').addEventListener('click', () => {
      loadRows(DEMO_ROWS, '임의자료_체험대장.xlsx');
      toast('임의 자료를 불러왔습니다. 오류 경고도 함께 확인해보세요.');
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

  function bindBirthInputs() {
    ['field-birth', 'edit-birth'].forEach(id => {
      const input = $(id);
      if (!input) return;
      input.addEventListener('input', () => {
        const formatted = formatBirthInput(input.value);
        if (input.value !== formatted) input.value = formatted;
        if (id === 'field-birth') renderPreview();
      });
      input.addEventListener('blur', () => {
        const formatted = formatBirthInput(input.value);
        if (input.value !== formatted) input.value = formatted;
      });
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
      if (!Number.isInteger(index) || !state.records[index]) return;
      const updated = {
        ...state.records[index],
        name: $('edit-name').value.trim(), birth: $('edit-birth').value,
        department: $('edit-department').value.trim(), position: $('edit-position').value.trim(),
        payType: $('edit-pay-type').value.trim(), hours: $('edit-hours').value.trim(),
        startRaw: $('edit-start').value, endRaw: $('edit-end').value,
        startDate: parseDateStrict($('edit-start').value), endDate: parseDateStrict($('edit-end').value),
        retirement: $('edit-retirement').value.trim(), note: $('edit-note').value.trim()
      };
      state.records[index] = updated;
      analyzeRecords();
      els.editDialog.close();
      renderAll();
      toast('경력 자료를 수정했습니다.');
    });
  }

  function loadSettings() {
    try { return { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem('careerCertificateSettings')) || {}) }; }
    catch { return { ...DEFAULT_SETTINGS }; }
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
    const today = dateToInput(new Date());
    $('field-issue-date').value = today;
  }

  async function readWorkbook(file) {
    try {
      await ensureXlsx();
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, raw: true });
      const targetName = workbook.SheetNames.find(name => normalizeHeader(name) === '대장') || workbook.SheetNames[0];
      const sheet = workbook.Sheets[targetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: true });
      if (!rows.length) throw new Error('대장에 읽을 수 있는 데이터가 없습니다.');
      const mapped = rows.map(row => mapWorkbookRow(row));
      loadRows(mapped, file.name);
      toast(`${file.name}의 '${targetName}' 시트를 불러왔습니다.`);
    } catch (error) {
      console.error(error);
      toast(`엑셀을 읽지 못했습니다. ${error.message || ''}`, true);
    }
  }

  function mapWorkbookRow(row) {
    const normalizedMap = {};
    Object.entries(row).forEach(([key, value]) => { normalizedMap[normalizeHeader(key)] = value; });
    const valueFor = field => {
      const alias = HEADER_ALIASES[field].map(normalizeHeader).find(name => Object.hasOwn(normalizedMap, name));
      return alias ? normalizedMap[alias] : '';
    };
    return {
      name: text(valueFor('name')),
      birth: valueFor('birth'),
      department: text(valueFor('department')),
      position: text(valueFor('position')),
      payType: text(valueFor('payType')),
      start: valueFor('start'),
      end: valueFor('end'),
      period: text(valueFor('period')),
      retirement: text(valueFor('retirement')),
      note: text(valueFor('note')),
      hours: text(valueFor('hours'))
    };
  }

  function loadRows(rows, fileName) {
    state.fileName = fileName;
    state.selectedPersonKey = null;
    state.selectedRecordIds.clear();
    state.records = rows.map((row, index) => normalizeRecord(row, index));
    analyzeRecords();
    renderAll();
  }

  function normalizeRecord(row, index) {
    const startRaw = row.start ?? row.startRaw ?? '';
    const endRaw = row.end ?? row.endRaw ?? '';
    const birthDate = parseDateStrict(row.birth);
    return {
      id: `record-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
      sourceIndex: index + 2,
      name: text(row.name),
      birth: birthDate ? dateToInput(birthDate) : text(row.birth),
      department: text(row.department),
      position: text(row.position),
      payType: text(row.payType),
      startRaw,
      endRaw,
      startDate: parseDateStrict(startRaw),
      endDate: parseDateStrict(endRaw),
      period: text(row.period),
      retirement: text(row.retirement),
      note: text(row.note),
      hours: text(row.hours),
      issues: []
    };
  }

  function analyzeRecords() {
    state.records.forEach(record => {
      const issues = [];
      if (!record.name) issues.push(issue('error', '성명이 비어 있습니다.'));
      if (!record.birth || !parseDateStrict(record.birth)) issues.push(issue('warning', '생년월일이 없거나 날짜 형식이 아닙니다.'));
      if (!record.startDate) issues.push(issue('error', record.startRaw ? `시작일 '${displayRaw(record.startRaw)}'을 날짜로 읽을 수 없습니다.` : '시작일이 비어 있습니다.'));
      if (!record.endDate) issues.push(issue('error', record.endRaw ? `종료일 '${displayRaw(record.endRaw)}'을 날짜로 읽을 수 없습니다.` : '종료일이 비어 있습니다.'));
      if (record.startDate && record.endDate && record.endDate < record.startDate) issues.push(issue('error', '종료일이 시작일보다 빠릅니다.'));
      if (!record.position) issues.push(issue('warning', '직급(위)이 비어 있습니다.'));
      if (!record.department) issues.push(issue('warning', '근무부서가 비어 있습니다.'));
      record.issues = issues;
    });

    const groups = groupBy(state.records.filter(r => r.name), r => personKey(r));
    Object.values(groups).forEach(records => {
      const valid = records.filter(r => r.startDate && r.endDate).sort((a, b) => a.startDate - b.startDate || a.endDate - b.endDate);
      valid.forEach((record, index) => {
        const previous = valid[index - 1];
        if (previous && record.startDate <= previous.endDate) {
          record.issues.push(issue('warning', `${formatDate(record.startDate)} 시작 경력이 앞 경력과 겹칩니다.`));
        }
      });
      const seen = new Map();
      records.forEach(record => {
        const key = [record.name, record.birth, dateToInput(record.startDate), dateToInput(record.endDate), record.position, record.department].join('|');
        if (seen.has(key)) {
          record.issues.push(issue('warning', `대장 ${seen.get(key).sourceIndex}행과 같은 경력으로 보입니다.`));
        } else seen.set(key, record);
      });
    });

    buildPeople();
    pruneSelections();
  }

  function buildPeople() {
    const groups = groupBy(state.records.filter(r => r.name), r => personKey(r));
    state.people = Object.entries(groups).map(([key, records]) => ({
      key,
      name: records[0].name,
      birth: records[0].birth,
      records: records.sort((a, b) => dateValue(a.startDate) - dateValue(b.startDate)),
      errorCount: records.reduce((sum, r) => sum + r.issues.filter(i => i.level === 'error').length, 0),
      warningCount: records.reduce((sum, r) => sum + r.issues.filter(i => i.level === 'warning').length, 0)
    })).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }

  function pruneSelections() {
    const validIds = new Set(state.records.map(r => r.id));
    [...state.selectedRecordIds].forEach(id => { if (!validIds.has(id)) state.selectedRecordIds.delete(id); });
    if (state.selectedPersonKey && !state.people.some(p => p.key === state.selectedPersonKey)) state.selectedPersonKey = null;
  }

  function renderAll() {
    renderUploadState();
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
    els.fileState.textContent = '불러옴';
    els.fileState.className = 'state-chip ready';
    els.uploadSummary.hidden = false;
    els.uploadSummary.innerHTML = `<strong>${escapeHtml(state.fileName)}</strong><br>${state.people.length}명 · 경력 ${state.records.length}건 · 오류 ${errors}건 · 확인 필요 ${warnings}건`;
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
        <span class="person-main"><strong>${escapeHtml(person.name)}</strong><small>${person.birth ? formatDate(parseDateStrict(person.birth)) : '생년월일 미기재'}</small></span>
        <span class="person-meta">경력 ${person.records.length}건<br>${person.errorCount ? `<span class="has-error">오류 ${person.errorCount}</span>` : person.warningCount ? `확인 ${person.warningCount}` : '정상'}</span>
      </button>`).join('') : '<div class="empty-state small"><p>검색 결과가 없습니다.</p></div>';
    els.personList.querySelectorAll('[data-person-key]').forEach(button => button.addEventListener('click', () => selectPerson(button.dataset.personKey)));
  }

  function selectPerson(key) {
    state.selectedPersonKey = key;
    state.selectedRecordIds.clear();
    const person = getSelectedPerson();
    if (person) {
      person.records.filter(record => !hasError(record)).slice(0, 10).forEach(record => state.selectedRecordIds.add(record.id));
      $('field-name').value = person.name;
      $('field-birth').value = parseDateStrict(person.birth) ? dateToInput(parseDateStrict(person.birth)) : '';
      updateRetirementFromSelection();
    }
    renderPeople();
    renderCareers();
    renderPreview();
  }

  function renderCareers() {
    const person = getSelectedPerson();
    const selectedRecords = getSelectedRecords();
    els.selectedCount.textContent = `${selectedRecords.length}건 선택`;
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
      return `<label class="career-card ${state.selectedRecordIds.has(record.id) ? 'is-selected' : ''} ${blocked ? 'is-blocked' : ''}">
        <input class="career-check" type="checkbox" data-record-id="${record.id}" ${state.selectedRecordIds.has(record.id) ? 'checked' : ''} ${blocked ? 'disabled' : ''} />
        <span class="career-info"><strong>${formatDate(record.startDate)} ~ ${formatDate(record.endDate)}</strong><span>${escapeHtml(record.position || '직급 미기재')} · ${escapeHtml(record.department || '부서 미기재')}</span></span>
        <span class="career-badges"><span class="status-pill ${status[0]}">${status[1]}</span>${record.startDate && record.endDate && !blocked ? `<span>${formatDuration(calculateDuration(record.startDate, record.endDate))}</span>` : ''}</span>
      </label>`;
    }).join('');

    els.careerList.querySelectorAll('[data-record-id]').forEach(input => input.addEventListener('change', () => toggleRecord(input.dataset.recordId, input.checked)));
    const issueMessages = person.records.flatMap(r => r.issues).slice(0, 5);
    els.careerAlert.hidden = !issueMessages.length;
    if (issueMessages.length) {
      els.careerAlert.className = `inline-alert ${issueMessages.some(i => i.level === 'error') ? 'error' : ''}`;
      els.careerAlert.innerHTML = issueMessages.map(i => `• ${escapeHtml(i.message)}`).join('<br>') + (person.records.flatMap(r => r.issues).length > 5 ? '<br>• 대장 점검 화면에서 나머지 내용을 확인하세요.' : '');
    }
  }

  function toggleRecord(id, checked) {
    if (checked && state.selectedRecordIds.size >= 10) {
      renderCareers();
      return toast('v0.1에서는 한 증명서에 최대 10건까지 선택할 수 있습니다.', true);
    }
    checked ? state.selectedRecordIds.add(id) : state.selectedRecordIds.delete(id);
    updateRetirementFromSelection();
    renderCareers();
    renderPreview();
  }

  function updateRetirementFromSelection() {
    const latest = getSelectedRecords().sort(compareLatest).at(-1);
    $('field-retirement').value = latest?.retirement || '';
  }

  function renderLedger() {
    if (!state.records.length) {
      els.ledgerBody.innerHTML = '<tr><td colspan="9" class="empty-cell">대장을 불러오면 점검 결과가 표시됩니다.</td></tr>';
      return;
    }
    const term = normalizeSearch(els.ledgerSearch.value);
    const filter = els.issueFilter.value;
    const rows = state.records.filter(record => {
      const status = hasError(record) ? 'error' : hasWarning(record) ? 'warning' : 'clean';
      const searchable = normalizeSearch([record.name, record.birth, record.position, record.department, record.retirement, record.note, record.issues.map(i => i.message).join(' ')].join(' '));
      return (!term || searchable.includes(term)) && (filter === 'all' || filter === status);
    });
    els.ledgerBody.innerHTML = rows.length ? rows.map(record => {
      const actualIndex = state.records.indexOf(record);
      const status = hasError(record) ? ['error', '오류'] : hasWarning(record) ? ['warning', '확인 필요'] : ['clean', '정상'];
      const issueHtml = record.issues.length ? record.issues.map(i => `<div class="${i.level === 'error' ? 'error-text' : 'warning-text'}">• ${escapeHtml(i.message)}</div>`).join('') : '점검 결과 이상 없음';
      return `<tr>
        <td><span class="status-pill ${status[0]}">${status[1]}</span></td>
        <td><strong>${escapeHtml(record.name || '(미기재)')}</strong></td>
        <td>${record.birth ? escapeHtml(formatDate(parseDateStrict(record.birth))) : '-'}</td>
        <td>${formatDate(record.startDate)}<br>~ ${formatDate(record.endDate)}</td>
        <td>${escapeHtml(record.position || '-')}</td>
        <td>${escapeHtml(record.department || '-')}</td>
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
    $('template-state').textContent = `${capacity}줄 서식`;
    $('preview-name').textContent = $('field-name').value.trim();
    $('preview-birth').textContent = formatDate(parseDateStrict($('field-birth').value));
    $('preview-address').textContent = $('field-address').value.trim();
    $('preview-purpose').textContent = $('field-purpose').value.trim();
    $('preview-retirement').textContent = $('field-retirement').value.trim();
    $('preview-award').textContent = $('field-award').value.trim();
    $('preview-discipline').textContent = $('field-discipline').value.trim();
    $('preview-suspension').textContent = $('field-suspension').value.trim();

    const total = sumDurations(selected.map(r => calculateDuration(r.startDate, r.endDate)));
    $('preview-total-text').textContent = selected.length ? formatDuration(total) : '';
    const latest = [...selected].sort(compareLatest).at(-1);
    $('preview-final-position').textContent = latest?.position || '';

    const totalRowspan = capacity + 3;
    const rows = [
      `<tr>` +
        `<th rowspan="${totalRowspan}" class="section-label section-label-career">경력<br />사항</th>` +
        `<th colspan="2">근무 기간</th>` +
        `<th colspan="3">근무연수</th>` +
        `<th rowspan="2">직급(위)</th>` +
        `<th rowspan="2">근무부서</th>` +
      `</tr>`,
      `<tr><th>부터</th><th>까지</th><th>연</th><th>월</th><th>일</th></tr>`
    ];
    for (let i = 0; i < capacity; i += 1) {
      const record = selected[i];
      if (record) {
        const duration = calculateDuration(record.startDate, record.endDate);
        rows.push(`<tr><td>${formatDate(record.startDate)}</td><td>${formatDate(record.endDate)}</td><td>${duration.years}</td><td>${duration.months}</td><td>${duration.days}</td><td>${escapeHtml(record.position)}</td><td>${escapeHtml(record.department)}</td></tr>`);
      } else {
        rows.push(`<tr><td></td><td></td><td></td><td></td><td></td><td>${i === selected.length ? '이하여백' : ''}</td><td></td></tr>`);
      }
    }
    rows.push(`<tr><th colspan="2">계</th><td id="preview-total-y">${selected.length ? total.years : ''}</td><td id="preview-total-m">${selected.length ? total.months : ''}</td><td id="preview-total-d">${selected.length ? total.days : ''}</td><td colspan="2"></td></tr>`);
    $('preview-career-table').innerHTML = rows.join('');

    const issueDate = parseDateStrict($('field-issue-date').value);
    $('preview-issue-date').textContent = issueDate ? `${issueDate.getFullYear()}년 ${issueDate.getMonth() + 1}월 ${issueDate.getDate()}일` : '';
    $('preview-school').textContent = spacedSchoolName(state.settings.school) + ' 장';
    $('preview-department').textContent = state.settings.department;
    $('preview-officer').textContent = state.settings.officer;
    $('preview-phone').textContent = state.settings.phone;
    $('print-certificate').disabled = !selected.length;
  }

  function resetIssueForm() {
    $('field-address').value = '';
    $('field-purpose').value = state.settings.purpose;
    $('field-award').value = '해당없음';
    $('field-discipline').value = '해당없음';
    $('field-suspension').value = '해당없음';
    setToday();
    updateRetirementFromSelection();
    renderPreview();
    toast('발급 입력값을 초기화했습니다.');
  }

  function validateBeforePrint() {
    if (!getSelectedRecords().length) return { ok: false, message: '발급할 경력을 한 건 이상 선택해주세요.' };
    if (!$('field-name').value.trim()) return { ok: false, message: '성명을 입력해주세요.' };
    if (!parseDateStrict($('field-birth').value)) return { ok: false, message: '생년월일을 확인해주세요.' };
    if (!parseDateStrict($('field-issue-date').value)) return { ok: false, message: '발급일을 확인해주세요.' };
    return { ok: true };
  }


  function printCertificateOnly() {
    const certificate = $('certificate');
    if (!certificate) return toast('인쇄할 증명서를 찾지 못했습니다.', true);

    const printFrame = document.createElement('iframe');
    printFrame.setAttribute('title', '경력증명서 인쇄');
    printFrame.setAttribute('aria-hidden', 'true');
    Object.assign(printFrame.style, {
      position: 'fixed',
      right: '0',
      bottom: '0',
      width: '0',
      height: '0',
      border: '0',
      visibility: 'hidden'
    });
    document.body.appendChild(printFrame);

    const printDocument = printFrame.contentDocument || printFrame.contentWindow?.document;
    if (!printDocument) {
      printFrame.remove();
      return toast('인쇄 화면을 열지 못했습니다.', true);
    }

    const stylesheetUrl = new URL('styles.css', document.baseURI).href;
    printDocument.open();
    printDocument.write(`<!doctype html>
      <html lang="ko">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title></title>
          <link rel="stylesheet" href="${stylesheetUrl}" />
          <style>
            @page { size: A4 portrait; margin: 0; }
            html, body {
              width: 210mm !important;
              min-width: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
              overflow: visible !important;
            }
            body > .certificate {
              display: block !important;
              width: 210mm !important;
              min-height: 297mm !important;
              height: 297mm !important;
              margin: 0 !important;
              box-shadow: none !important;
              page-break-after: avoid !important;
              break-after: avoid-page !important;
            }
          </style>
        </head>
        <body>${certificate.outerHTML}</body>
      </html>`);
    printDocument.close();

    const cleanUp = () => {
      window.setTimeout(() => printFrame.remove(), 300);
    };

    printFrame.onload = () => {
      window.setTimeout(() => {
        const printWindow = printFrame.contentWindow;
        if (!printWindow) return cleanUp();
        printWindow.addEventListener('afterprint', cleanUp, { once: true });
        printWindow.focus();
        printWindow.print();
        window.setTimeout(cleanUp, 3000);
      }, 250);
    };
  }

  function openEditDialog(index) {
    const record = state.records[index];
    if (!record) return;
    $('edit-index').value = index;
    $('edit-name').value = record.name;
    $('edit-birth').value = parseDateStrict(record.birth) ? dateToInput(parseDateStrict(record.birth)) : '';
    $('edit-department').value = record.department;
    $('edit-position').value = record.position;
    $('edit-pay-type').value = record.payType;
    $('edit-hours').value = record.hours;
    $('edit-start').value = record.startDate ? dateToInput(record.startDate) : safeInputDate(record.startRaw);
    $('edit-end').value = record.endDate ? dateToInput(record.endDate) : safeInputDate(record.endRaw);
    $('edit-retirement').value = record.retirement;
    $('edit-note').value = record.note;
    els.editIssues.hidden = !record.issues.length;
    els.editIssues.className = `inline-alert ${hasError(record) ? 'error' : ''}`;
    els.editIssues.innerHTML = record.issues.map(i => `• ${escapeHtml(i.message)}`).join('<br>');
    els.editDialog.showModal();
  }

  async function exportLedger() {
    if (!state.records.length) return toast('내려받을 대장이 없습니다.', true);
    try { await ensureXlsx(); } catch (error) { return toast(error.message, true); }
    const rows = state.records.map(record => ({
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
      '점검결과': record.issues.map(i => `${i.level === 'error' ? '오류' : '확인'}: ${i.message}`).join(' / ')
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    sheet['!cols'] = [12, 14, 14, 22, 13, 14, 14, 15, 16, 38, 16, 50].map(wch => ({ wch }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, '대장');
    const date = dateToInput(new Date()).replaceAll('-', '');
    XLSX.writeFile(workbook, `경력대장_점검수정_${date}.xlsx`);
    toast('수정 대장을 내려받았습니다.');
  }

  function clearData() {
    state.records = [];
    state.people = [];
    state.fileName = '';
    state.selectedPersonKey = null;
    state.selectedRecordIds.clear();
    $('field-name').value = '';
    $('field-birth').value = '';
    $('field-address').value = '';
    $('field-retirement').value = '';
    renderAll();
    toast('불러온 대장을 메모리에서 비웠습니다.');
  }

  function getSelectedPerson() { return state.people.find(person => person.key === state.selectedPersonKey) || null; }
  function getSelectedRecords() { return state.records.filter(record => state.selectedRecordIds.has(record.id) && !hasError(record)); }
  function personKey(record) { return `${record.name.trim()}|${record.birth || ''}`; }
  function hasError(record) { return record.issues.some(i => i.level === 'error'); }
  function hasWarning(record) { return record.issues.some(i => i.level === 'warning'); }
  function issue(level, message) { return { level, message }; }
  function countIssues(level) { return state.records.reduce((sum, record) => sum + record.issues.filter(i => i.level === level).length, 0); }
  function compareLatest(a, b) { return dateValue(a.endDate || a.startDate) - dateValue(b.endDate || b.startDate); }
  function dateValue(date) { return date instanceof Date && !Number.isNaN(date.valueOf()) ? date.valueOf() : 0; }

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
    const digits = textValue.match(/^(\d{2,4})\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})\s*일?\.?$/);
    if (digits) {
      let year = Number(digits[1]);
      if (year < 100) year += year >= 50 ? 1900 : 2000;
      return strictDate(year, Number(digits[2]), Number(digits[3]));
    }
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
    durations.forEach(d => { years += d.years; months += d.months; days += d.days; });
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
  function dateToInput(date) { return date ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` : ''; }
  function safeInputDate(value) { const date = parseDateStrict(value); return date ? dateToInput(date) : ''; }
  function pad(value) { return String(value).padStart(2, '0'); }
  function displayRaw(value) { return value instanceof Date ? formatDate(value) : String(value ?? ''); }
  function text(value) { return value === null || value === undefined ? '' : String(value).trim(); }
  function normalizeHeader(value) { return text(value).replace(/[\s\n\r_()-]/g, '').replace('위', '위').toLowerCase(); }
  function normalizeSearch(value) { return text(value).replace(/\s/g, '').toLowerCase(); }
  function groupBy(items, keyFn) { return items.reduce((groups, item) => { const key = keyFn(item); (groups[key] ||= []).push(item); return groups; }, {}); }
  function spacedSchoolName(name) { return [...text(name)].join('   '); }
  function escapeHtml(value) { return text(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]); }
  function escapeAttr(value) { return escapeHtml(value); }

  let toastTimer;
  function toast(message, isError = false) {
    els.toast.textContent = message;
    els.toast.style.background = isError ? '#991b1b' : '#111827';
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2800);
  }
})();
