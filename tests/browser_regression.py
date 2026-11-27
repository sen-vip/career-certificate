import os
from io import BytesIO
import subprocess
import sys
import tempfile
from pathlib import Path
from playwright.sync_api import expect, sync_playwright
from openpyxl import load_workbook
import msoffcrypto
from msoffcrypto.exceptions import InvalidKeyError

script_dir = Path(__file__).resolve().parent
root = Path(os.environ.get('CAREER_QA_OUTPUT') or tempfile.mkdtemp(prefix='career-certificate-qa-')).resolve()
subprocess.run([sys.executable, str(script_dir / 'generate_fixtures.py'), str(root)], check=True)
print(f'QA output: {root}', flush=True)
origin = os.environ.get('CAREER_TEST_URL','http://127.0.0.1:8765/')
errors = []
requests = []
with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_BINARY'), args=['--no-sandbox'])
    generator = browser.new_page()
    generator.goto(origin)
    generator.add_script_tag(url=f'{origin}vendor/xlsx-populate.min.js')
    encrypted = generator.evaluate('''async () => {
        const workbook = await XlsxPopulate.fromBlankAsync();
        workbook.sheet(0).cell('A1').value([
            ['성명', '생년월일', '근무부서', '직종·직위', '고용형태', '임용시작일', '임용종료일', '소정근로시간'],
            ['시험가', '1990-01-01', '가상부서', '가상직종', '교육공무직', '2024-01-01', '2024-01-05', '주 40시간']
        ]);
        const bytes = await workbook.outputAsync({ password: 'qa-only', type: 'arraybuffer' });
        return Array.from(new Uint8Array(bytes));
    }''')
    (root / 'protected.xlsx').write_bytes(bytes(encrypted))
    legacy = generator.evaluate('''() => {
        const workbook = XLSX.utils.book_new();
        const sheet = XLSX.utils.aoa_to_sheet([
            ['성명', '생년월일', '근무부서', '직종·직위', '임용시작일', '임용종료일'],
            ['시험구형', 900101, '가상부서', '가상직종', '2024-02-29', '2024-03-01']
        ]);
        XLSX.utils.book_append_sheet(workbook, sheet, '가상');
        return Array.from(new Uint8Array(XLSX.write(workbook, { bookType: 'biff8', type: 'array' })));
    }''')
    (root / 'legacy.xls').write_bytes(bytes(legacy))
    generator.close()
    p = browser.new_page(timezone_id='Asia/Seoul', locale='ko-KR', viewport={'width':1440,'height':1000})
    p.on('pageerror', lambda error: errors.append(str(error)))
    p.on('request', lambda request: requests.append((request.method,request.url)))
    p.add_init_script("""if (window !== top) {
        window.print = () => {
          top.__qaPrintHtml = document.documentElement.outerHTML;
          window.dispatchEvent(new Event('afterprint'));
        };
    }""")
    p.goto(origin)
    assert p.evaluate('XLSX.version') == '0.20.3'
    loc = p.locator
    def upload(name, person=None):
        loc('#file-input').set_input_files(root / f'{name}.xlsx')
        if person: expect(card(person)).to_be_visible()
    def card(name): return loc('.person-card').filter(has_text=name)
    def select(name):
        card(name).click()
        expect(loc('#field-name')).to_have_value(name)
    def report(name): print(f'PASS {name}', flush=True)
    def print_to_pdf(name, person, pages):
        p.evaluate('window.__qaPrintHtml = null')
        loc('#print-certificate').click()
        p.wait_for_function('window.__qaPrintHtml')
        html = p.evaluate('window.__qaPrintHtml')
        assert 'workspace no-print' not in html
        assert person in html
        out = browser.new_page(locale='ko-KR')
        out.set_content('<!doctype html>'+html, wait_until='load')
        pdf_path = root / f'{name}.pdf'
        out.pdf(path=pdf_path, prefer_css_page_size=True, print_background=True)
        out.close()
        info = subprocess.check_output(['pdfinfo', str(pdf_path)],text=True)
        assert f'Pages:           {pages}' in info, info
        assert 'A4' in info, info
        payload = subprocess.check_output(['pdftotext', '-layout',str(pdf_path),'-'],text=True)
        assert person in payload and '대장 점검' not in payload, payload[:800]
        if pages > 1:
            assert '별지 1 / 1' in payload and '2024.01.22.' in payload, payload[-800:]
        expect(loc('iframe[title="경력증명서 인쇄"]')).to_have_count(0)
    upload('general','시험추가')
    expect(card('시험누락')).to_have_count(3)
    expect(card('시험누락').filter(has_text='가상1')).to_have_count(2)
    expect(card('시험누락').filter(has_text='1993.01.01.')).to_contain_text('경력 1건')
    expect(card('시험추가')).to_contain_text('경력 1건')
    report('여러 시트, 안내 시트, 식별정보 없는 동명이인')
    select('시험번호')
    # A fictitious 1801 birth year exercises the legacy display format without using real data.
    assert '010101-9000000' not in loc('#person-list').inner_html()
    expect(loc('#field-rrn')).to_have_value('')
    loc('[data-rrn-display=yes]').click()
    expect(loc('#field-rrn')).to_have_value('010101-9000000')
    loc('#field-rrn').fill('010101-9000001')
    expect(loc('#print-certificate')).to_be_disabled()
    loc('[data-rrn-display=no]').click()
    expect(loc('#field-rrn')).to_have_value('')
    expect(loc('#certificate-pages')).not_to_contain_text('010101-9000000')
    report('가상 주민등록번호 표시 선택·다른 번호 차단·DOM 식별키 제거')
    loc('#person-search').fill('시험추가')
    expect(loc('.person-card')).to_have_count(1)
    select('시험추가')
    expect(loc('#certificate-pages .summary-table')).to_contain_text('0년 0월 1일')
    loc('#person-search').fill('')
    select('시험가')
    expect(loc('#certificate-pages .summary-table')).to_contain_text('0년 1월 10일')
    expect(loc('#certificate-pages .hours-table')).to_contain_text('주 40시간')
    loc('[data-certificate-mode=general]').click()
    expect(loc('#certificate-pages .hours-table')).to_have_count(0)
    report('검색·윤일·월말·불연속 합계·소정근로시간 서식')
    loc('#field-name').fill('가상불일치')
    expect(loc('#print-certificate')).to_be_disabled()
    loc('#field-name').fill('시험가')
    loc('#field-birth').fill('1990-01-02')
    expect(loc('#print-certificate')).to_be_disabled()
    loc('#field-birth').fill('1990-01-01')
    expect(loc('#print-certificate')).to_be_enabled()
    loc('#field-address').fill('가상주소')
    loc('#field-purpose').fill('가상용도')
    loc('#field-issue-date').fill('2025-05-01')
    if loc('.history-fields').get_attribute('open') is None:
        loc('.history-fields summary').click()
    for kind, field in [('award','type'),('discipline','type'),('suspension','reason')]:
        loc(f'[data-add-history={kind}]').click()
        fields = loc(f'#history-{kind}-list')
        fields.locator('[data-history-field=date]').fill('2024-02-29')
        fields.locator('[data-history-field=agency]').fill('가상기관')
        fields.locator(f'[data-history-field={field}]').fill('가상내용')
    expect(loc('#print-certificate')).to_be_enabled()
    loc('#history-award-list [data-history-field=date]').fill('10000-01-01')
    expect(loc('#print-block-message')).to_contain_text('포상 사항의 연월일을 확인')
    expect(loc('#print-certificate')).to_be_disabled()
    select('시험나')
    expect(loc('#field-address')).to_have_value('')
    expect(loc('#field-purpose')).to_have_value('제출용')
    assert loc('#field-issue-date').input_value() != '2025-05-01'
    expect(loc('[data-history-field=date]')).to_have_count(0)
    expect(loc('#certificate-pages')).not_to_contain_text('가상주소')
    report('대상 변경 시 입력 초기화·성명과 생년월일 일치·상벌 필수 일자')
    p.set_viewport_size({'width':390,'height':844})
    loc('#preview-fit-width').click()
    before = loc('#preview-zoom-level').inner_text()
    loc('#preview-zoom-in').click()
    assert loc('#preview-zoom-level').inner_text() != before
    p.set_viewport_size({'width':1440,'height':1000})
    print_to_pdf('one-page','시험나',1)
    select('시험다량')
    expect(loc('.appendix-page')).to_have_count(1)
    print_to_pdf('appendix','시험다량',2)
    report('좁은 화면 가로 맞춤/확대·인쇄 버튼·A4 PDF 본문과 별지')
    select('시험겹침')
    expect(loc('#career-alert')).to_contain_text('3일 겹칩니다')
    expect(loc('#career-list input[type=checkbox]:disabled')).to_have_count(2)
    for invalid, message in [('invalid','지원하는 대장 형식'),('empty','불러올 경력'),('mixed','여러 종류')]:
        upload(invalid)
        expect(loc('#upload-error')).to_contain_text(message)
        expect(loc('#field-name')).to_have_value('시험겹침')
    report('포함 중첩 전부 검출·형식 오류/빈 대장/혼합 대장 이전 상태 보존')
    upload('mac','시험맥')
    select('시험맥')
    expect(loc('#field-birth')).to_have_value('1990-01-01')
    expect(loc('#certificate-pages')).to_contain_text('2024.02.29.')
    expect(loc('#certificate-pages .summary-table')).to_contain_text('0년 0월 2일')
    report('1904 날짜 체계의 생년월일·근무일·윤년')
    upload('teacher','시험교원')
    select('시험교원')
    expect(loc('#print-certificate')).to_be_disabled()
    loc('[data-apply-followup]').click()
    expect(loc('#certificate-pages')).to_contain_text('2024.06.01.')
    expect(loc('#certificate-pages')).to_contain_text('의원면직')
    expect(loc('#print-certificate')).to_be_enabled()
    loc('[data-undo-followup]').click()
    expect(loc('#print-certificate')).to_be_disabled()
    report('기간제교원 과목·후속 발령 반영 및 되돌리기')
    upload('instructor','시험강사')
    select('시험강사')
    expect(loc('#certificate-pages')).to_contain_text('주당 6시수')
    expect(loc('#certificate-pages')).to_contain_text('방학기간 제외')
    expect(loc('#certificate-pages .summary-table')).to_contain_text('1년 0월 0일')
    loc('[data-vacation-mode=detailed]').click()
    expect(loc('#print-certificate')).to_be_disabled()
    loc('[data-vacation-date=startDate]').fill('20240801')
    loc('[data-vacation-date=endDate]').fill('20240803')
    expect(loc('.certificate-vacation-notes')).to_contain_text('2024. 8. 1.')
    expect(loc('#certificate-pages .summary-table')).to_contain_text('1년 0월 0일')
    expect(loc('#print-certificate')).to_be_enabled()
    report('강사 시수·방학 표시/입력 검증·현행 근무연한 산식')
    if loc('.history-fields').get_attribute('open') is None:
        loc('.history-fields summary').click()
    for i in range(17):
        loc('[data-add-history=award]').click()
        loc('[data-history-field=date]').last.fill('2024-02-29')
        loc('[data-history-field=type]').last.fill('가상 포상 ' * 5)
        loc('[data-history-field=agency]').last.fill('가상 시행청')
    expect(loc('.certificate--main')).to_have_attribute('data-a4-fit','compact-2-overflow')
    expect(loc('#print-block-message')).to_contain_text('A4 한 페이지')
    expect(loc('#print-certificate')).to_be_disabled()
    loc('#reset-form').click()
    expect(loc('#print-certificate')).to_be_enabled()
    report('A4 초과 출력 차단 및 초기화 후 정상 복구')
    upload('protected')
    loc('#workbook-password').fill('wrong-qa')
    loc('#unlock-workbook').click()
    expect(loc('#password-status')).to_contain_text('올바르지 않습니다',timeout=20000)
    expect(loc('#field-name')).to_have_value('시험강사')
    loc('#workbook-password').fill('qa-only')
    loc('#unlock-workbook').click()
    expect(card('시험가')).to_be_visible(timeout=20000)
    expect(loc('#workbook-password')).to_have_value('')
    loc('[data-tab=ledger]').click()
    loc('[data-edit-index]').first.click()
    loc('#edit-position').fill('가상수정직종')
    loc('#edit-form button[type=submit]').click()
    expect(loc('#edit-dialog')).not_to_be_visible()
    loc('#export-ledger').click()
    expect(loc('#export-password-dialog')).to_be_visible()
    loc('#export-password').fill('qa-new')
    loc('#export-password-confirm').fill('different')
    loc('#export-password-submit').click()
    expect(loc('#export-password-dialog')).to_be_visible()
    loc('#export-password-confirm').fill('qa-new')
    with p.expect_download(timeout=20000) as event:
        loc('#export-password-submit').click()
    encrypted = root / 'exported-protected.xlsx'
    event.value.save_as(encrypted)
    assert encrypted.read_bytes()[:8].hex() == 'd0cf11e0a1b11ae1'
    with encrypted.open('rb') as source:
        office = msoffcrypto.OfficeFile(source)
        try:
            office.load_key(password='qa-only', verify_password=True)
        except InvalidKeyError:
            pass
        else:
            raise AssertionError('The original password still opens the new encrypted workbook')
        office.load_key(password='qa-new', verify_password=True)
        decoded = BytesIO()
        office.decrypt(decoded, verify_integrity=True)
        decoded.seek(0)
        independently_opened = load_workbook(decoded)
        assert independently_opened.active['D2'].value == '가상수정직종'
    loc('[data-tab=issue]').click()
    upload('exported-protected')
    loc('#workbook-password').fill('qa-new')
    loc('#unlock-workbook').click()
    expect(loc('#password-dialog')).not_to_be_visible(timeout=20000)
    select('시험가')
    expect(loc('#certificate-pages')).to_contain_text('가상수정직종')
    report('암호 오류·수정 저장 암호 확인·재업로드·수정 내용 유지')
    upload('general','시험추가')
    loc('[data-tab=ledger]').click()
    with p.expect_download() as event:
        loc('#export-ledger').click()
    event.value.save_as(root / 'exported-general.xlsx')
    wb = load_workbook(root / 'exported-general.xlsx')
    assert wb.active['A1'].value == '성명'
    assert any(row[0] == '시험추가' for row in wb.active.values)
    loc('[data-tab=issue]').click()
    select('시험나')
    loc('#clear-data').click()
    loc('#clear-data-form button[value=cancel]').click()
    expect(loc('#field-name')).to_have_value('시험나')
    loc('#clear-data').click()
    loc('#confirm-clear-data').click()
    expect(loc('#field-name')).to_have_value('')
    expect(loc('.person-card')).to_have_count(0)
    for link in loc('.template-download-menu a').evaluate_all('links => links.map(link => link.href)'):
        assert p.request.get(link).ok
    report('일반 Excel 다운로드·대장 비우기 취소/확인·기본양식 3종')
    # A second time zone exercises sheet serial dates without a local midnight conversion.
    pacific = browser.new_page(timezone_id='America/Los_Angeles')
    pacific.goto(origin)
    pacific.locator('#file-input').set_input_files(root / 'legacy.xls')
    pacific.locator('.person-card').filter(has_text='시험구형').click()
    expect(pacific.locator('#field-birth')).to_have_value('1990-01-01')
    expect(pacific.locator('#certificate-pages')).to_contain_text('2024.02.29.')
    pacific.locator('#file-input').set_input_files(root / 'mac.xlsx')
    pacific.locator('.person-card').filter(has_text='시험맥').click()
    expect(pacific.locator('#certificate-pages')).to_contain_text('2024.02.29.')
    pacific.close()
    report('구형 .xls 및 다른 브라우저 시간대의 날짜 보존')
    assert not errors, errors
    assert all(method == 'GET' and (url.startswith(origin) or url.startswith('blob:')) for method,url in requests), requests
    assert p.evaluate('Object.keys(localStorage).length') == 0
    loc('[data-tab=settings]').click()
    loc('#setting-school').fill('가상학교')
    loc('#save-settings').click()
    p.reload()
    loc('[data-tab=settings]').click()
    expect(loc('#setting-school')).to_have_value('가상학교')
    loc('#reset-settings').click()
    assert p.evaluate('Object.keys(localStorage).length') == 0
    report('개인 발급정보 비저장·학교 설정 저장/초기화·외부 요청과 JS 오류 없음')
