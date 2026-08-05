(() => {
  'use strict';

  const HEADER_ALIASES = {
    name: ['성명', '이름'],
    identity: ['생년월일 또는 주민번호', '생년월일 또는 주민등록번호', '생년월일', '주민번호', '주민등록번호', '주민번호앞자리', '생년'],
    department: ['근무부서', '부서', '근무 부서'],
    position: ['직급(위)', '직위(급)', '직위(직급)', '직종·직위', '직종직위', '직급', '직위', '직종'],
    subject: ['과목', '담당과목', '표시과목'],
    payType: ['급제', '급여형태', '계약형태', '고용형태'],
    start: ['시작일', '근무시작일', '근무 시작일', '임용일'],
    end: ['종료일', '근무종료일', '근무 종료일', '퇴직일'],
    teacherStart: ['임용시작일', '임용 시작일', '계약시작일', '계약 시작일', '근무시작일', '근무 시작일'],
    teacherEnd: ['임용종료일', '임용 종료일', '계약종료일', '계약 종료일', '근무종료일', '근무 종료일'],
    period: ['기간', '근무기간'],
    retirement: ['퇴직사유', '퇴직 사유'],
    note: ['비고', '참고'],
    hours: ['소정근로시간', '소정 근로시간', '주당근로시간', '주당 근로시간', '근로시간', '주당수업시수', '주당 수업시수'],
    appointmentDate: ['발령일자', '발령일'],
    affiliation: ['소속', '근무기관'],
    roleType: ['직위구분', '강사구분'],
    dutyType: ['담당구분', '수업구분'],
    dutyContent: ['담당내용', '담당과목프로그램', '담당과목·프로그램', '프로그램명'],
    weeklyHours: ['주당수업시간', '주당 수업시간', '주당시수', '주당 수업시수'],
    totalWeeks: ['총주수', '총 주수', '총수업주수'],
    vacationExcluded: ['방학기간 제외', '방학기간제외', '방학 제외'],
    workTime: ['근무시간', '수업시간', '요일교시'],
    appointmentBasis: ['발령근거', '발령 근거'],
    appointmentText: ['발령사항 직접입력', '발령사항', '발령 사항'],
    ledgerNote: ['발령대장 비고', '발령대장비고'],
    checkMemo: ['확인메모', '확인 메모']
  };

  const DEFAULT_SETTINGS = {
    school: '학돌중학교',
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

  const INSTRUCTOR_DEMO_ROWS = [
    { roleType: '시간강사', dutyType: '교과', dutyContent: '음악과', name: '강하늘', identity: '1990-01-01', start: '2020-03-02', end: '2021-02-02', weeklyHours: 6, totalWeeks: 34, vacationExcluded: '아니오', workTime: '' },
    { roleType: '시간강사', dutyType: '교과', dutyContent: '음악과', name: '강하늘', identity: '900101-1234567', start: '2021-03-02', end: '2022-02-09', weeklyHours: 9, totalWeeks: 35, vacationExcluded: '아니오', workTime: '' },
    { roleType: '시간강사', dutyType: '프로그램', dutyContent: '치어리딩', name: '윤별빛', identity: '1992-04-18', start: '2017-03-03', end: '2018-01-31', weeklyHours: 2, totalWeeks: '', vacationExcluded: '예', workTime: '' },
    { roleType: '시간강사', dutyType: '프로그램', dutyContent: '스포츠6+자유2', name: '정다온', identity: '1988-08-21', start: '2018-03-01', end: '2018-07-20', weeklyHours: 8, totalWeeks: '', vacationExcluded: '아니오', workTime: '' },
    { roleType: '전문강사', dutyType: '교과', dutyContent: '영어', name: '이새봄', identity: '1985-12-12', start: '2024-03-01', end: '2025-02-28', weeklyHours: 12, totalWeeks: '', vacationExcluded: '아니오', workTime: '월·수·금' }
  ];

  const INSTRUCTOR_ROLE_VALUES = ['시간강사', '전문강사'];
  const INSTRUCTOR_DUTY_VALUES = ['교과', '프로그램', '부서'];

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
  let previewFitScale = 1;
  let previewScale = 1;
  let previewZoomMode = 'fit-width';
  const PREVIEW_MIN_SCALE = 0.25;
  const PREVIEW_MAX_SCALE = 2;
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
    bindRrnInput();
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

    $('preview-zoom-in')?.addEventListener('click', () => changePreviewZoom(1.12));
    $('preview-zoom-out')?.addEventListener('click', () => changePreviewZoom(1 / 1.12));
    $('preview-fit-width')?.addEventListener('click', () => setPreviewFitWidth());

    paper.addEventListener('wheel', event => {
      if (!(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      changePreviewZoom(event.deltaY < 0 ? 1.1 : 1 / 1.1, event);
    }, { passive: false });
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
    const availableWidth = Math.max(1, paper.clientWidth - horizontalPadding - 4);
    const pageWidth = firstPage.offsetWidth;
    const pageHeight = firstPage.offsetHeight;
    const pagesStyle = window.getComputedStyle(pages);
    const gap = parseFloat(pagesStyle.rowGap || pagesStyle.gap) || 0;
    const unscaledHeight = pageCount * pageHeight + Math.max(0, pageCount - 1) * gap;

    previewFitScale = clampPreviewScale((availableWidth / pageWidth) * 0.995);
    if (previewZoomMode === 'fit-width') previewScale = previewFitScale;
    previewScale = clampPreviewScale(previewScale);

    pages.style.setProperty('--preview-scale', previewScale.toFixed(4));
    stage.style.width = `${Math.ceil(pageWidth * previewScale)}px`;
    stage.style.height = `${Math.ceil(unscaledHeight * previewScale)}px`;
    paper.classList.toggle('is-multipage', pageCount > 1);
    paper.classList.toggle('is-zoomed', previewScale > previewFitScale + 0.01);
    paper.dataset.pageCount = String(pageCount);
    updatePreviewZoomControls();
  }

  function clampPreviewScale(value) {
    return Math.min(PREVIEW_MAX_SCALE, Math.max(PREVIEW_MIN_SCALE, Number(value) || PREVIEW_MIN_SCALE));
  }

  function setPreviewFitWidth() {
    previewZoomMode = 'fit-width';
    previewScale = previewFitScale;
    updatePreviewFit();
    const paper = $('print-area');
    if (paper) paper.scrollLeft = 0;
  }

  function changePreviewZoom(factor, wheelEvent = null) {
    const paper = $('print-area');
    const stage = $('preview-stage');
    if (!paper || !stage) return;

    const oldWidth = Math.max(1, stage.offsetWidth);
    const oldHeight = Math.max(1, stage.offsetHeight);
    const rect = paper.getBoundingClientRect();
    const localX = wheelEvent ? wheelEvent.clientX - rect.left : paper.clientWidth / 2;
    const localY = wheelEvent ? wheelEvent.clientY - rect.top : paper.clientHeight / 2;
    const ratioX = (paper.scrollLeft + localX) / oldWidth;
    const ratioY = (paper.scrollTop + localY) / oldHeight;

    previewZoomMode = 'custom';
    previewScale = clampPreviewScale(previewScale * factor);
    updatePreviewFit();

    window.requestAnimationFrame(() => {
      paper.scrollLeft = Math.max(0, ratioX * stage.offsetWidth - localX);
      paper.scrollTop = Math.max(0, ratioY * stage.offsetHeight - localY);
    });
  }

  function updatePreviewZoomControls() {
    const level = $('preview-zoom-level');
    const fitButton = $('preview-fit-width');
    const zoomIn = $('preview-zoom-in');
    const zoomOut = $('preview-zoom-out');
    if (level) level.textContent = `${Math.round(previewScale * 100)}%`;
    if (fitButton) fitButton.classList.toggle('is-active', previewZoomMode === 'fit-width');
    if (zoomIn) zoomIn.disabled = previewScale >= PREVIEW_MAX_SCALE - 0.001;
    if (zoomOut) zoomOut.disabled = previewScale <= PREVIEW_MIN_SCALE + 0.001;
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
    $('load-demo-instructor').addEventListener('click', () => {
      loadRows(INSTRUCTOR_DEMO_ROWS, '임의자료_시간강사전문강사대장.xlsx', 'instructor');
      toast('시간강사·전문강사 임의 자료를 불러왔습니다.');
    });
    document.addEventListener('click', event => {
      const details = document.querySelector('.template-download');
      if (details?.open && !details.contains(event.target)) details.open = false;
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
      renderRrnControls();
      renderPreview();
    });
  }

  function bindRrnInput() {
    $('field-rrn').addEventListener('input', event => {
      const formatted = formatRrnInput(event.target.value);
      if (event.target.value !== formatted) event.target.value = formatted;
      renderRrnControls();
      renderPreview();
    });
  }

  function bindModeControls() {
    $('certificate-mode-options').addEventListener('click', event => {
      const button = event.target.closest('[data-certificate-mode]');
      if (!button) return;
      const mode = button.dataset.certificateMode;
      if (['teacher', 'instructor'].includes(state.ledgerType) && mode !== state.ledgerType) return;
      state.certificateMode = mode;
      renderCertificateModeOptions();
      renderCareers();
      renderPreview();
    });

    qsa('[data-rrn-display]').forEach(button => button.addEventListener('click', () => {
      state.rrnDisplay = button.dataset.rrnDisplay === 'yes';
      if (state.rrnDisplay && !$('field-rrn').value.trim()) syncRrnInputFromSelectedPerson();
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
        if (!updated.retirement && updated.endDate) updated.retirement = '계약기간 만료';
      } else if (state.ledgerType === 'instructor') {
        updated.roleType = $('edit-instructor-role').value;
        updated.position = updated.roleType;
        updated.dutyTypeRaw = $('edit-instructor-duty-type').value;
        updated.dutyType = normalizeDutyType(updated.dutyTypeRaw);
        updated.dutyContent = $('edit-instructor-duty-content').value.trim();
        updated.weeklyHoursRaw = $('edit-instructor-weekly-hours').value.trim();
        updated.weeklyHours = parseInstructorNumber(updated.weeklyHoursRaw, 'hours');
        updated.totalWeeksRaw = $('edit-instructor-total-weeks').value.trim();
        updated.totalWeeks = parseInstructorNumber(updated.totalWeeksRaw, 'weeks');
        updated.vacationRaw = $('edit-instructor-vacation').value;
        updated.vacationExcluded = parseVacationExcluded(updated.vacationRaw);
        updated.workTime = $('edit-instructor-work-time').value.trim();
        updated.department = '';
        updated.subject = '';
        updated.payType = '';
        updated.hours = '';
        if (!updated.retirement && updated.endDate) updated.retirement = '계약기간 만료';
      } else {
        updated.department = $('edit-department').value.trim();
        updated.payType = $('edit-pay-type').value.trim();
        updated.hours = $('edit-hours').value.trim();
        updated.subject = '';
      }

      state.records[index] = updated;
      analyzeRecords();
      state.rrnDisplay = false;
      clearRrnInput();
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
      // 날짜 셀을 Date 객체로 만들면 브라우저 시간대에 따라 하루가 앞당겨질 수 있다.
      // 일련번호 그대로 읽고 parseDateStrict에서 연·월·일만 복원한다.
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: false, raw: true });
      const detected = detectWorkbookLayout(workbook);
      if (!detected) throw new Error('지원하는 대장 형식을 확인할 수 없습니다. 엑셀의 열 제목을 확인해 주세요.');
      const mapper = detected.type === 'teacher' ? mapTeacherRow : detected.type === 'instructor' ? mapInstructorRow : mapGeneralRow;
      const rows = detected.rows.map(mapper);
      loadRows(rows, file.name, detected.type);
      toast(`${ledgerTypeLabel(detected.type)}으로 인식했습니다.`);
    } catch (error) {
      toast(error?.message || '엑셀을 읽지 못했습니다.', true);
    }
  }

  function detectWorkbookLayout(workbook) {
    let best = null;
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true, blankrows: false });
      const limit = Math.min(matrix.length, 14);
      for (let rowIndex = 0; rowIndex < limit; rowIndex += 1) {
        const headers = matrix[rowIndex].map(value => text(value));
        const normalized = headers.map(normalizeHeader);
        const candidates = ['instructor', 'teacher', 'general'].map(type => ({ type, score: scoreHeaders(normalized, type) }));
        candidates.sort((a, b) => b.score - a.score);
        const candidate = candidates[0];
        const sheetBonus = candidate.type === 'instructor' && normalizeHeader(sheetName).includes('시간강사입력') ? 3 : 0;
        const score = candidate.score + sheetBonus;
        const threshold = candidate.type === 'instructor' ? 12 : candidate.type === 'teacher' ? 10 : 7;
        if (score < threshold || (best && score <= best.score)) continue;
        const rows = matrix.slice(rowIndex + 1)
          .filter(row => row.some(value => text(value) !== ''))
          .map(row => Object.fromEntries(headers.map((header, index) => [header || `열${index + 1}`, row[index] ?? ''])));
        best = { type: candidate.type, score, sheetName, headerRow: rowIndex, rows };
      }
    });
    return best;
  }

  function scoreHeaders(headers, type) {
    const has = field => HEADER_ALIASES[field].some(alias => headers.includes(normalizeHeader(alias)));
    if (type === 'instructor') {
      return (has('roleType') ? 3 : 0) + (has('dutyType') ? 2 : 0) + (has('dutyContent') ? 3 : 0) +
        (has('name') ? 2 : 0) + (has('teacherStart') ? 2 : 0) + (has('teacherEnd') ? 2 : 0) + (has('weeklyHours') ? 3 : 0);
    }
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

  function mapInstructorRow(row) {
    const map = normalizedRowMap(row);
    return {
      appointmentDate: valueFor(map, 'appointmentDate'),
      affiliation: valueFor(map, 'affiliation'),
      roleType: valueFor(map, 'roleType'),
      dutyType: valueFor(map, 'dutyType'),
      dutyContent: valueFor(map, 'dutyContent'),
      name: valueFor(map, 'name'),
      identity: valueFor(map, 'identity'),
      start: valueFor(map, 'teacherStart'),
      end: valueFor(map, 'teacherEnd'),
      weeklyHours: valueFor(map, 'weeklyHours'),
      totalWeeks: valueFor(map, 'totalWeeks'),
      vacationExcluded: valueFor(map, 'vacationExcluded'),
      workTime: valueFor(map, 'workTime'),
      appointmentBasis: valueFor(map, 'appointmentBasis'),
      appointmentText: valueFor(map, 'appointmentText'),
      ledgerNote: valueFor(map, 'ledgerNote'),
      checkMemo: valueFor(map, 'checkMemo')
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
    state.certificateMode = ['teacher', 'instructor'].includes(ledgerType) ? ledgerType : 'general';
    state.rrnDisplay = false;
    clearRrnInput();
    state.selectedPersonKey = null;
    state.selectedRecordIds.clear();
    state.records = rows
      .map((row, index) => normalizeRecord(row, index, ledgerType))
      .filter(record => record.name || record.identityRaw || record.startRaw || record.endRaw || record.position || record.dutyContent);
    analyzeRecords();
    clearIssueFields(true);
    renderAll();
  }

  function normalizeRecord(row, index, ledgerType) {
    const identityRaw = row.identity ?? row.birth ?? '';
    const identity = parseIdentity(identityRaw);
    const startRaw = row.start ?? row.startRaw ?? '';
    const endRaw = row.end ?? row.endRaw ?? '';
    const weeklyHoursRaw = row.weeklyHours ?? '';
    const totalWeeksRaw = row.totalWeeks ?? '';
    const vacationRaw = row.vacationExcluded ?? '';
    const isInstructor = ledgerType === 'instructor';
    const endDate = parseDateStrict(endRaw);
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
      position: isInstructor ? text(row.roleType) : text(row.position),
      payType: ledgerType === 'general' ? text(row.payType) : '',
      startRaw,
      endRaw,
      startDate: parseDateStrict(startRaw),
      endDate,
      period: text(row.period),
      retirement: ledgerType === 'teacher'
        ? (text(row.retirement) || '계약기간 만료')
        : isInstructor ? (endDate ? '계약기간 만료' : '') : text(row.retirement),
      note: isInstructor ? text(row.checkMemo) : text(row.note),
      hours: ledgerType === 'general' ? text(row.hours) : '',
      appointmentDateRaw: isInstructor ? row.appointmentDate ?? '' : '',
      appointmentDate: isInstructor ? parseDateStrict(row.appointmentDate) : null,
      affiliation: isInstructor ? text(row.affiliation) : '',
      roleType: isInstructor ? text(row.roleType) : '',
      dutyType: isInstructor ? normalizeDutyType(row.dutyType) : '',
      dutyTypeRaw: isInstructor ? text(row.dutyType) : '',
      dutyContent: isInstructor ? text(row.dutyContent) : '',
      weeklyHoursRaw: isInstructor ? text(weeklyHoursRaw) : '',
      weeklyHours: isInstructor ? parseInstructorNumber(weeklyHoursRaw, 'hours') : null,
      totalWeeksRaw: isInstructor ? text(totalWeeksRaw) : '',
      totalWeeks: isInstructor ? parseInstructorNumber(totalWeeksRaw, 'weeks') : null,
      vacationRaw: isInstructor ? text(vacationRaw) : '',
      vacationExcluded: isInstructor ? parseVacationExcluded(vacationRaw) : null,
      workTime: isInstructor ? text(row.workTime) : '',
      appointmentBasis: isInstructor ? text(row.appointmentBasis) : '',
      appointmentText: isInstructor ? text(row.appointmentText) : '',
      ledgerNote: isInstructor ? text(row.ledgerNote) : '',
      issues: []
    };
  }

  function analyzeRecords() {
    state.records.forEach(record => {
      const issues = [];
      const isTeacher = record.ledgerType === 'teacher';
      const isInstructor = record.ledgerType === 'instructor';
      if (!record.name) issues.push(issue('error', '성명이 비어 있습니다.'));
      if (!record.identityRaw) {
        issues.push(issue(isInstructor ? 'warning' : 'error', isInstructor
          ? '생년월일 또는 주민등록번호가 없어 발급 시 직접 입력이 필요합니다.'
          : isTeacher ? '생년월일 또는 주민등록번호가 비어 있습니다.' : '생년월일이 비어 있습니다.'));
      } else if (!record.birth) {
        issues.push(issue('error', isTeacher || isInstructor ? '생년월일 또는 주민등록번호 형식을 확인해 주세요.' : '생년월일 형식을 확인해 주세요.'));
      }
      if (!record.startDate) issues.push(issue('error', record.startRaw ? '시작일을 날짜로 읽을 수 없습니다.' : '시작일이 비어 있습니다.'));
      if (!record.endDate) issues.push(issue('error', record.endRaw ? '종료일을 날짜로 읽을 수 없습니다.' : '종료일이 비어 있습니다.'));
      if (record.startDate && record.endDate && record.endDate < record.startDate) issues.push(issue('error', '종료일이 시작일보다 빠릅니다.'));

      if (isInstructor) {
        if (!record.roleType) issues.push(issue('error', '직위구분이 비어 있습니다.'));
        else if (!INSTRUCTOR_ROLE_VALUES.includes(record.roleType)) issues.push(issue('error', '직위구분은 시간강사 또는 전문강사로 입력해 주세요.'));
        if (!record.dutyTypeRaw) issues.push(issue('error', '담당구분이 비어 있습니다.'));
        else if (!INSTRUCTOR_DUTY_VALUES.includes(record.dutyType)) issues.push(issue('error', '담당구분은 교과·프로그램·부서 중 하나로 입력해 주세요.'));
        if (!record.dutyContent) issues.push(issue('error', '담당내용이 비어 있습니다.'));
        if (!record.weeklyHoursRaw) issues.push(issue('error', '주당수업시간이 비어 있습니다.'));
        else if (record.weeklyHours === null) issues.push(issue('error', '주당수업시간을 숫자로 해석할 수 없습니다.'));
        if (record.totalWeeksRaw && record.totalWeeks === null) issues.push(issue('error', '총주수를 숫자로 해석할 수 없습니다.'));
        if (record.vacationRaw && record.vacationExcluded === null) issues.push(issue('error', '방학기간 제외 값을 예 또는 아니오로 확인해 주세요.'));
        if (record.appointmentDateRaw && !record.appointmentDate) issues.push(issue('warning', '발령일자를 날짜로 읽을 수 없습니다.'));
        if (record.note) issues.push(issue('warning', `상세 확인 필요: ${record.note}`));
      } else {
        if (!record.position) issues.push(issue(isTeacher ? 'error' : 'warning', '직급(위)이 비어 있습니다.'));
        if (isTeacher && !record.subject) issues.push(issue('warning', '과목이 비어 있습니다.'));
        if (record.ledgerType === 'general' && !record.department) issues.push(issue('warning', '근무부서가 비어 있습니다.'));
      }
      record.issues = issues;
    });

    const groups = groupRecordsByPerson(state.records.filter(record => record.name));
    Object.values(groups).forEach(records => {
      const valid = records.filter(record => record.startDate && record.endDate).sort((a, b) => a.startDate - b.startDate || a.endDate - b.endDate);
      valid.forEach((record, index) => {
        const previous = valid[index - 1];
        if (previous && record.startDate <= previous.endDate) record.issues.push(issue('warning', '앞 경력과 근무기간이 겹칩니다.'));
      });

      const seen = new Map();
      records.forEach(record => {
        const key = [record.name, record.birth, dateToInput(record.startDate), dateToInput(record.endDate), record.position, record.department, record.subject, record.dutyType, record.dutyContent, record.weeklyHours].join('|');
        if (seen.has(key)) record.issues.push(issue('warning', `대장 ${seen.get(key).sourceIndex}행과 같은 경력으로 보입니다.`));
        else seen.set(key, record);
      });

      const rrns = new Set(records.map(record => record.rrn).filter(Boolean));
      if (rrns.size > 1) records.forEach(record => record.issues.push(issue('error', '같은 대상자에게 서로 다른 주민등록번호가 입력되어 있습니다.')));
    });

    const identityGroups = groupBy(state.records.filter(record => record.name && record.birth), record => `${record.name}|${record.birth}`);
    Object.values(identityGroups).forEach(records => {
      const rrns = new Set(records.map(record => record.rrn).filter(Boolean));
      if (rrns.size > 1) records.forEach(record => {
        if (!record.issues.some(item => item.message.includes('서로 다른 주민등록번호'))) record.issues.push(issue('error', '같은 성명과 생년월일에 서로 다른 주민등록번호가 입력되어 있습니다.'));
      });
    });

    buildPeople();
    pruneSelections();
  }

  function buildPeople() {
    const groups = groupRecordsByPerson(state.records.filter(record => record.name));
    state.people = Object.entries(groups).map(([key, records]) => ({
      key,
      name: records[0].name,
      birth: records.find(record => record.birth)?.birth || '',
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
    const typeName = ledgerTypeShortLabel(state.ledgerType);
    const badgeClass = state.ledgerType === 'teacher' ? 'teacher' : state.ledgerType === 'instructor' ? 'instructor' : '';
    els.fileState.textContent = '불러옴';
    els.fileState.className = 'state-chip ready';
    els.uploadSummary.hidden = false;
    els.uploadSummary.innerHTML = `<div class="summary-line"><strong>${escapeHtml(state.fileName)}</strong><span class="type-badge ${badgeClass}">${typeName}</span></div>${state.people.length}명 · 경력 ${state.records.length}건 · 오류 ${errors}건 · 확인 필요 ${warnings}건`;
  }

  function renderCertificateModeOptions() {
    const container = $('certificate-mode-options');
    const options = state.ledgerType === 'teacher'
      ? [{ value: 'teacher', label: '기간제교원 경력증명서' }]
      : state.ledgerType === 'instructor'
        ? [{ value: 'instructor', label: '시간강사·전문강사 경력증명서' }]
        : [{ value: 'general', label: '일반 경력증명서' }, { value: 'hours', label: '소정근로시간 포함' }];
    container.innerHTML = options.map(option => `<button class="segment-btn ${state.certificateMode === option.value ? 'is-active' : ''}" data-certificate-mode="${option.value}" type="button">${option.label}</button>`).join('');
  }

  function renderRrnControls() {
    const section = $('rrn-display-section');
    const panel = $('rrn-input-panel');
    const status = $('rrn-input-status');
    const input = $('field-rrn');
    const person = getSelectedPerson();

    section.hidden = state.ledgerType === 'none';
    panel.hidden = section.hidden || !state.rrnDisplay;
    qsa('[data-rrn-display]').forEach(button => button.classList.toggle('is-active', (button.dataset.rrnDisplay === 'yes') === state.rrnDisplay));

    if (panel.hidden) return;
    status.className = 'rrn-input-status';
    const raw = input.value.trim();
    const parsed = parseIdentity(raw);
    if (!person) {
      status.textContent = '대상자를 먼저 선택해 주세요.';
      status.classList.add('warning');
    } else if (!raw) {
      status.textContent = person.rrn ? '대장 자료의 주민등록번호를 불러오는 중입니다.' : '대장에 주민등록번호가 없어 직접 입력이 필요합니다.';
      status.classList.add('warning');
    } else if (parsed.kind !== 'rrn') {
      status.textContent = '주민등록번호 13자리를 확인해 주세요.';
      status.classList.add('error');
    } else if (person.rrn && parsed.rrn === person.rrn) {
      status.textContent = '대장 자료에 등록된 주민등록번호를 사용합니다.';
      status.classList.add('success');
    } else {
      status.textContent = '직접 입력한 주민등록번호를 이번 발급에만 사용합니다.';
      status.classList.add('success');
    }
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
    clearRrnInput();
    const person = getSelectedPerson();
    if (person) {
      person.records.filter(record => !hasError(record)).forEach(record => state.selectedRecordIds.add(record.id));
      $('field-name').value = person.name;
      $('field-birth').value = person.birth || '';
      syncRrnInputFromSelectedPerson();
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
        : state.ledgerType === 'instructor'
          ? `${record.roleType || '직위 미기재'} · ${record.dutyContent || '담당내용 미기재'}`
          : `${record.position || '직급 미기재'} · ${record.department || '부서 미기재'}`;
      const subline = state.ledgerType === 'instructor'
        ? [record.weeklyHours !== null ? `주당 ${formatPlainNumber(record.weeklyHours)}시간` : '', record.totalWeeks !== null ? `총 ${formatPlainNumber(record.totalWeeks)}주` : ''].filter(Boolean).join(' · ')
        : '';
      const vacationBadge = state.ledgerType === 'instructor' && record.vacationExcluded === true
        ? '<span class="status-pill info">방학기간 제외</span>' : '';
      return `<label class="career-card ${state.selectedRecordIds.has(record.id) ? 'is-selected' : ''} ${blocked ? 'is-blocked' : ''}">
        <input class="career-check" type="checkbox" data-record-id="${record.id}" ${state.selectedRecordIds.has(record.id) ? 'checked' : ''} ${blocked ? 'disabled' : ''} />
        <span class="career-info"><strong>${formatDate(record.startDate)} ~ ${formatDate(record.endDate)}</strong><span class="career-summary">${escapeHtml(detail)}</span>${subline ? `<span class="career-subline">${escapeHtml(subline)}</span>` : ''}</span>
        <span class="career-badges"><span class="status-pill ${status[0]}">${status[1]}</span>${vacationBadge}${record.startDate && record.endDate && !blocked ? `<span>${formatDuration(calculateDuration(record.startDate, record.endDate))}</span>` : ''}</span>
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
    $('field-retirement').value = latest?.retirement || (['teacher', 'instructor'].includes(state.ledgerType) && latest?.endDate ? '계약기간 만료' : '');
  }

  function renderLedger() {
    $('ledger-extra-heading').textContent = state.ledgerType === 'teacher' ? '과목' : state.ledgerType === 'instructor' ? '담당내용' : '근무부서';
    if (!state.records.length) {
      els.ledgerBody.innerHTML = '<tr><td colspan="9" class="empty-cell">대장을 불러오면 점검 결과가 표시됩니다.</td></tr>';
      return;
    }
    const term = normalizeSearch(els.ledgerSearch.value);
    const filter = els.issueFilter.value;
    const rows = state.records.filter(record => {
      const status = hasError(record) ? 'error' : hasWarning(record) ? 'warning' : 'clean';
      const searchable = normalizeSearch([record.name, record.birth, record.position, record.department, record.subject, record.dutyType, record.dutyContent, record.weeklyHoursRaw, record.totalWeeksRaw, record.retirement, record.note, record.issues.map(item => item.message).join(' ')].join(' '));
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
        <td>${escapeHtml((state.ledgerType === 'teacher' ? record.subject : state.ledgerType === 'instructor' ? formatInstructorDepartment(record) : record.department) || '-')}</td>
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
    const finalPosition = latest ? (
      state.ledgerType === 'teacher' && latest.subject ? `${latest.position}(${latest.subject})`
        : state.ledgerType === 'instructor' ? formatInstructorFinalPosition(latest)
          : latest.position
    ) : '';
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
    const position = state.ledgerType === 'instructor' ? formatInstructorPosition(record) : record.position;
    const extra = isTeacher ? record.subject : state.ledgerType === 'instructor' ? formatInstructorDepartment(record) : record.department;
    return `<tr><td>${formatDate(record.startDate)}</td><td>${formatDate(record.endDate)}</td><td>${duration.years}</td><td>${duration.months}</td><td>${duration.days}</td><td>${escapeHtml(position)}</td><td>${escapeHtml(extra)}</td>${isHours ? `<td>${escapeHtml(record.hours)}</td>` : ''}</tr>`;
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

  function getPreviewIdentifier() {
    if (state.rrnDisplay) return { label: '주민등록번호', value: getEffectiveRrn() };
    return { label: '생년월일', value: formatDate(parseDateStrict($('field-birth').value)) };
  }

  function resetIssueForm() {
    $('field-address').value = '';
    $('field-purpose').value = state.settings.purpose;
    $('field-award').value = '해당없음';
    $('field-discipline').value = '해당없음';
    $('field-suspension').value = '해당없음';
    state.rrnDisplay = false;
    clearRrnInput();
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
    if (state.rrnDisplay) {
      const rawRrn = $('field-rrn').value.trim();
      const parsedRrn = parseIdentity(rawRrn);
      if (!rawRrn) return { ok: false, message: '출력할 주민등록번호를 입력해 주세요.' };
      if (parsedRrn.kind !== 'rrn') return { ok: false, message: '주민등록번호 형식을 확인해 주세요.' };
      const birth = parseDateStrict($('field-birth').value);
      if (birth && dateToInput(parsedRrn.birth) !== dateToInput(birth)) return { ok: false, message: '주민등록번호 앞 6자리와 생년월일이 일치하지 않습니다.' };
    }
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
    const instructor = state.ledgerType === 'instructor';
    $('edit-index').value = index;
    $('edit-title').textContent = teacher ? '기간제교원 경력 수정' : instructor ? '시간강사·전문강사 경력 수정' : '일반 경력 수정';
    $('edit-name').value = record.name;
    $('edit-id-label').textContent = teacher || instructor ? '생년월일 또는 주민번호' : '생년월일';
    $('edit-id-value').value = record.rrn || record.birth || record.identityRaw;
    $('edit-position').value = record.position;
    $('edit-position-group').hidden = instructor;
    $('edit-department-group').hidden = teacher || instructor;
    $('edit-pay-type-group').hidden = teacher || instructor;
    $('edit-hours-group').hidden = teacher || instructor;
    $('edit-subject-group').hidden = !teacher;
    qsa('[id^="edit-instructor-"][id$="-group"]').forEach(group => { group.hidden = !instructor; });
    $('edit-department').value = record.department;
    $('edit-subject').value = record.subject;
    $('edit-pay-type').value = record.payType;
    $('edit-hours').value = record.hours;
    $('edit-instructor-role').value = record.roleType || '시간강사';
    $('edit-instructor-duty-type').value = INSTRUCTOR_DUTY_VALUES.includes(record.dutyType) ? record.dutyType : '교과';
    $('edit-instructor-duty-content').value = record.dutyContent || '';
    $('edit-instructor-weekly-hours').value = record.weeklyHoursRaw || (record.weeklyHours !== null ? formatPlainNumber(record.weeklyHours) : '');
    $('edit-instructor-total-weeks').value = record.totalWeeksRaw || (record.totalWeeks !== null ? formatPlainNumber(record.totalWeeks) : '');
    $('edit-instructor-vacation').value = record.vacationExcluded === true ? '예' : '아니오';
    $('edit-instructor-work-time').value = record.workTime || '';
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
    let sheetName;
    let widths;
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
      sheetName = '기간제교원_대장';
      widths = [18, 14, 14, 24, 15, 15];
    } else if (state.ledgerType === 'instructor') {
      rows = state.records.map(record => ({
        '발령일자': record.appointmentDate ? formatDate(record.appointmentDate) : displayRaw(record.appointmentDateRaw),
        '소속': record.affiliation,
        '직위구분': record.roleType,
        '담당구분': record.dutyTypeRaw || record.dutyType,
        '담당내용': record.dutyContent,
        '성명': record.name,
        '생년월일 또는 주민번호': record.rrn || record.birth,
        '임용시작일': record.startDate ? formatDate(record.startDate) : displayRaw(record.startRaw),
        '임용종료일': record.endDate ? formatDate(record.endDate) : displayRaw(record.endRaw),
        '주당수업시간': record.weeklyHours !== null ? formatPlainNumber(record.weeklyHours) : record.weeklyHoursRaw,
        '총주수': record.totalWeeks !== null ? formatPlainNumber(record.totalWeeks) : record.totalWeeksRaw,
        '방학기간 제외': record.vacationExcluded === true ? '예' : record.vacationExcluded === false ? '아니오' : record.vacationRaw,
        '근무시간': record.workTime,
        '발령근거': record.appointmentBasis,
        '발령사항 직접입력': record.appointmentText,
        '발령대장 비고': record.ledgerNote,
        '확인메모': record.note,
        '점검결과': record.issues.map(item => `${item.level === 'error' ? '오류' : '확인'}: ${item.message}`).join(' / ')
      }));
      filePrefix = '시간강사_전문강사_경력대장_점검수정';
      sheetName = '시간강사_입력';
      widths = [14, 15, 13, 13, 22, 14, 24, 15, 15, 15, 12, 15, 24, 20, 38, 26, 30, 50];
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
      sheetName = '대장';
      widths = [12, 14, 14, 22, 13, 14, 14, 15, 16, 38, 16, 50];
    }
    const sheet = XLSX.utils.json_to_sheet(rows);
    sheet['!cols'] = widths.map(wch => ({ wch }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
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
    clearRrnInput();
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
      clearRrnInput();
    }
    $('field-address').value = '';
    $('field-retirement').value = '';
    $('field-purpose').value = state.settings.purpose;
    $('field-award').value = '해당없음';
    $('field-discipline').value = '해당없음';
    $('field-suspension').value = '해당없음';
    setToday();
  }

  function syncRrnInputFromSelectedPerson() {
    const input = $('field-rrn');
    if (!input) return;
    input.value = getSelectedPerson()?.rrn || '';
  }

  function clearRrnInput() {
    const input = $('field-rrn');
    if (input) input.value = '';
  }

  function getEffectiveRrn() {
    const parsed = parseIdentity($('field-rrn')?.value || '');
    return parsed.kind === 'rrn' ? parsed.rrn : '';
  }

  function getSelectedPerson() {
    return state.people.find(person => person.key === state.selectedPersonKey) || null;
  }

  function getSelectedRecords() {
    return state.records.filter(record => state.selectedRecordIds.has(record.id) && !hasError(record));
  }

  function personKey(record) {
    if (record.rrn) return `rrn|${record.rrn.replace(/\D/g, '')}`;
    if (record.birth) return `birth|${record.name.trim()}|${record.birth}`;
    return `name|${record.name.trim()}`;
  }

  function groupRecordsByPerson(records) {
    const groups = {};
    const rrnKeysByNameBirth = new Map();
    records.filter(record => record.rrn).forEach(record => {
      const key = personKey(record);
      (groups[key] ||= []).push(record);
      const nameBirth = `${record.name.trim()}|${record.birth}`;
      const keys = rrnKeysByNameBirth.get(nameBirth) || [];
      if (!keys.includes(key)) keys.push(key);
      rrnKeysByNameBirth.set(nameBirth, keys);
    });
    records.filter(record => !record.rrn && record.birth).forEach(record => {
      const nameBirth = `${record.name.trim()}|${record.birth}`;
      const rrnKeys = rrnKeysByNameBirth.get(nameBirth) || [];
      const key = rrnKeys.length === 1 ? rrnKeys[0] : personKey(record);
      (groups[key] ||= []).push(record);
    });
    records.filter(record => !record.rrn && !record.birth).forEach(record => {
      const matchingKeys = Object.keys(groups).filter(key => groups[key][0]?.name === record.name);
      const key = matchingKeys.length === 1 ? matchingKeys[0] : personKey(record);
      (groups[key] ||= []).push(record);
    });
    return groups;
  }

  function hasError(record) { return record.issues.some(item => item.level === 'error'); }
  function hasWarning(record) { return record.issues.some(item => item.level === 'warning'); }
  function issue(level, message) { return { level, message }; }
  function countIssues(level) { return state.records.reduce((sum, record) => sum + record.issues.filter(item => item.level === level).length, 0); }
  function compareLatest(a, b) { return dateValue(a.endDate || a.startDate) - dateValue(b.endDate || b.startDate); }
  function dateValue(date) { return date instanceof Date && !Number.isNaN(date.valueOf()) ? date.valueOf() : 0; }

  function parseIdentity(value) {
    if (value === null || value === undefined || value === '') return { kind: 'empty', birth: null, rrn: '' };
    if (value instanceof Date) {
      const birth = parseDateStrict(value);
      return { kind: birth ? 'birth' : 'invalid', birth, rrn: '' };
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      const numericText = Number.isInteger(value) ? String(value) : '';
      if (![6, 8, 13].includes(numericText.length)) {
        const birth = parseDateStrict(value);
        return { kind: birth ? 'birth' : 'invalid', birth, rrn: '' };
      }
      value = numericText;
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
    if (digits.length === 6 && /^\d{6}$/.test(raw.replace(/[\s-]/g, ''))) {
      const yy = Number(digits.slice(0, 2));
      const month = Number(digits.slice(2, 4));
      const day = Number(digits.slice(4, 6));
      const currentYY = new Date().getFullYear() % 100;
      const year = yy > currentYY ? 1900 + yy : 2000 + yy;
      const birth = strictDate(year, month, day);
      return { kind: birth ? 'birth' : 'invalid', birth, rrn: '' };
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

  function formatRrnInput(value) {
    const digits = String(value ?? '').replace(/\D/g, '').slice(0, 13);
    if (digits.length <= 6) return digits;
    return `${digits.slice(0, 6)}-${digits.slice(6)}`;
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

  function ledgerTypeLabel(type) {
    return type === 'teacher' ? '기간제교원 경력대장' : type === 'instructor' ? '시간강사·전문강사 경력대장' : '일반 경력대장';
  }

  function ledgerTypeShortLabel(type) {
    return type === 'teacher' ? '기간제교원 대장' : type === 'instructor' ? '시간강사 경력대장' : '일반 경력대장';
  }

  function parseInstructorNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number' && Number.isFinite(value)) return value > 0 ? value : null;
    const cleaned = text(value).replace(/,/g, '');
    const match = cleaned.match(/\d+(?:\.\d+)?/);
    if (!match) return null;
    const number = Number(match[0]);
    return Number.isFinite(number) && number > 0 ? number : null;
  }

  function formatPlainNumber(value) {
    const number = Number(value);
    return Number.isInteger(number) ? String(number) : String(number).replace(/\.0+$/, '');
  }

  function normalizeDutyType(value) {
    const normalized = normalizeSearch(value);
    if (normalized === '교과' || normalized.includes('과목')) return '교과';
    if (normalized === '프로그램' || normalized.includes('프로그램')) return '프로그램';
    if (normalized === '부서' || normalized.includes('부서')) return '부서';
    return text(value);
  }

  function parseVacationExcluded(value) {
    const normalized = normalizeSearch(value).replace(/[._\-]/g, '');
    if (!normalized || ['아니오', '아니요', 'n', 'no', '미제외'].includes(normalized)) return false;
    if (['예', '네', 'y', 'yes', '제외', '방학기간제외', '방학제외'].includes(normalized) || normalized.includes('방학기간제외')) return true;
    return null;
  }

  function formatInstructorPosition(record) {
    const role = record.roleType || record.position || '시간강사';
    const details = [];
    if (record.weeklyHours !== null) details.push(`주당${formatPlainNumber(record.weeklyHours)}시간`);
    if (record.totalWeeks !== null) details.push(`총${formatPlainNumber(record.totalWeeks)}주`);
    const base = details.length ? `${role}(${details.join(', ')})` : role;
    return record.vacationExcluded === true ? `${base}\n방학기간제외` : base;
  }

  function formatInstructorDepartment(record) {
    const content = text(record.dutyContent);
    if (!content) return '';
    if (record.dutyType === '교과') return /^과목\s*[:：]/.test(content) ? content : `과목: ${content}`;
    return content;
  }

  function formatInstructorFinalPosition(record) {
    const role = record.roleType || record.position || '';
    const content = text(record.dutyContent).replace(/^과목\s*[:：]\s*/, '');
    return content ? `${role}(${content})` : role;
  }
  function normalizeHeader(value) {
    return text(value)
      .replace(/[（(][^）)]*[）)]/g, '')
      .replace(/[\s\n\r\t_:：()（）·ㆍ.\-\/]/g, '')
      .toLowerCase();
  }
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
