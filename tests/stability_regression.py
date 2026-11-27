"""Exercise release-blocking cases with fictitious workbooks and actual Chromium PDF text."""
import os
import re
import subprocess
import tempfile
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

import msoffcrypto
from openpyxl import Workbook
from playwright.sync_api import expect, sync_playwright


ROOT = Path(os.environ.get('CAREER_TEST_ROOT', Path(__file__).resolve().parents[1]))
BASELINE = os.environ.get('CAREER_EXPECT_V0716') == '1'
HEADER = ['성명', '생년월일', '근무부서', '직종·직위', '고용형태', '임용시작일', '임용종료일']
SYNTHETIC_ID = '010101-9000000'  # Fictitious 1801 birth date.
BIRTH = '1991-08-03'


def row(name, start, end, identity=BIRTH, department='가상경력부서'):
    return [name, identity, department, '가상직종', '교육공무직', start, end]


def save_ledger(directory, filename, sheets):
    book = Workbook()
    book.remove(book.active)
    for title, visibility, rows in sheets:
        sheet = book.create_sheet(title)
        sheet.sheet_state = visibility
        for values in rows:
            sheet.append(values)
    path = directory / filename
    book.save(path)
    return path


def verify(browser, url, directory):
    page = browser.new_page(timezone_id='Asia/Seoul', locale='ko-KR', viewport={'width': 1440, 'height': 1000})
    page.goto(url)
    locate = page.locator
    print_button = locate('#print-certificate')
    message = locate('#print-block-message')

    def choose(name):
        locate('.person-card').filter(has_text=name).first.click()

    ledger = save_ledger(directory, '가상원본파일명.xlsx', [
        ('현행대장', 'visible', [HEADER,
            row('가상검수출력', '2024-01-01', '2024-01-03', SYNTHETIC_ID),
            row('가상미선택자', '2024-01-04', '2024-01-07'),
            row('가상충돌갑', '2024-01-01', '2024-01-03', '020101-9000000'),
            row('가상충돌을', '2024-02-01', '2024-02-02', '020101-9000000'),
            row('가상완전미래', '2027-01-01', '2027-12-31'),
            row('가상발급일경계', '2026-06-01', '2026-09-30'),
            row('가상후속중복', '2024-01-01', '2024-12-31'),
            row('가상후속중복', '2024-05-01', '2024-09-30'),
            row('가상후속중복', '2024-06-01', '의원면직'),
            row('가상생년미기재', '2024-01-01', '2024-12-31'),
            row('가상생년미기재', '2024-06-01', '의원면직', ''),
            row('가상일자미기재', '2024-01-01', '2024-12-31'),
            row('가상일자미기재', '발령일 확인', '의원면직'),
            row('가상관련없음', '2020-01-01', '2020-12-31'),
            row('가상관련없음', '2024-06-01', '의원면직')]),
        ('숨김', 'hidden', [HEADER, row('가상숨김인물', '2020-01-01', '2020-01-31')]),
        ('매우숨김', 'veryHidden', [HEADER, row('가상매우숨김인물', '2020-01-01', '2020-01-31')]),
    ])
    locate('#file-input').set_input_files(ledger)
    choose('가상검수출력')
    locate('[data-rrn-display=yes]').click()
    locate('#field-address').fill('가상비공개주소')
    expect(locate('#certificate-pages')).to_contain_text(SYNTHETIC_ID)
    expect(print_button).to_be_enabled()
    for state in ('valid', 'invalid', 'ledger'):
        if state == 'invalid':
            locate('#field-name').fill('가상검증실패성명')
            expect(print_button).to_be_disabled()
        elif state == 'ledger':
            locate('[data-tab=ledger]').click()
        pdf = directory / (state + '.pdf')
        page.pdf(path=pdf, prefer_css_page_size=True)
        contents = subprocess.check_output(['pdftotext', '-layout', pdf, '-'], text=True)
        compact = re.sub(r'\s+', '', contents)
        private_text = ('가상검수출력', '가상검증실패성명', '가상미선택자', '1801.01.01.',
                        '1991.08.03.', SYNTHETIC_ID, '가상비공개주소', '가상경력부서',
                        '가상원본파일명', '상태성명생년월일', '경력증명서')
        leaked = [value for value in private_text if value in compact]
        if BASELINE:
            assert leaked and '1991.08.03.' in leaked and '상태성명생년월일' in leaked, (state, leaked)
        else:
            assert not leaked, (state, leaked)
            assert '증명서인쇄버튼을이용해' in compact, compact
    locate('[data-tab=issue]').click()
    print('PASS 기본 인쇄 PDF 3가지 상태', flush=True)

    choose('가상충돌갑')
    if BASELINE:
        expect(print_button).to_be_enabled()
    else:
        expect(print_button).to_be_disabled()
        expect(message).to_contain_text('같은 주민등록번호에 서로 다른 성명')
        expect(locate('#career-list input[type=checkbox]:disabled')).to_have_count(2)
    print('PASS 동일 번호·다른 성명 그룹', flush=True)

    for name, expected in (('가상완전미래', '시작일 2027.01.01.'),
                           ('가상발급일경계', '종료일 2026.09.30.')):
        choose(name)
        locate('#field-issue-date').fill('2026-06-30')
        if BASELINE:
            expect(print_button).to_be_enabled()
        else:
            expect(print_button).to_be_disabled()
            expect(message).to_contain_text(expected)
        locate('#field-issue-date').fill('2027-12-31')
        expect(print_button).to_be_enabled()
    print('PASS 발급일 이후 시작·종료 및 발급일과 종료일 동일', flush=True)

    for name in ('가상후속중복', '가상생년미기재', '가상일자미기재'):
        choose(name)
        if BASELINE:
            expect(print_button).to_be_enabled()
        else:
            expect(print_button).to_be_disabled()
            expect(message).to_contain_text('후속 퇴직발령')
    if not BASELINE:
        choose('가상후속중복')
        locate('[data-standalone-followup]').click()
        expect(locate('#edit-dialog')).to_be_visible()
        page.keyboard.press('Escape')
        expect(print_button).to_be_disabled()
    choose('가상관련없음')
    expect(print_button).to_be_enabled()
    print('PASS 미해결 후속 발령·확인 취소·무관 경력', flush=True)

    for name in ('가상숨김인물', '가상매우숨김인물'):
        expect(locate('.person-card').filter(has_text=name)).to_have_count(1 if BASELINE else 0)
    print('PASS 숨김과 매우 숨김 시트', flush=True)

    locate('#clear-data').click()
    locate('#confirm-clear-data').click()
    if BASELINE:
        expect(locate('#upload-summary')).to_contain_text(ledger.name)
    else:
        for selector in ('#upload-summary', '#career-alert', '#password-file-name', '#edit-issues'):
            expect(locate(selector)).to_have_text('')
        expect(locate('#field-rrn')).to_have_value('')
        expect(locate('#certificate-pages')).not_to_contain_text('가상관련없음')
    print('PASS 대장 비우기 DOM 검사', flush=True)

    with_gaps = save_ledger(directory, '가상공백행.xlsx', [('가상원본', 'visible', [
        ['안내'], *([[]] * 18), HEADER, [], row('가상행번호', '2024-01-01', '2024-01-02', '')])])
    locate('#file-input').set_input_files(with_gaps)
    if BASELINE:
        expect(locate('#upload-error')).to_be_visible()
    else:
        expect(locate('.person-card').filter(has_text='가상행번호')).to_contain_text('가상원본 22행')
    print('PASS 공백 뒤 헤더와 실제 행 번호', flush=True)

    protected = directory / '가상암호파일명.xlsx'
    with ledger.open('rb') as source, protected.open('wb') as output:
        msoffcrypto.OfficeFile(source).encrypt('qa-fixture', output)
    if BASELINE:
        locate('#file-input').set_input_files(protected)
        locate('#workbook-password').fill('qa-fixture')
        locate('#unlock-workbook').click()
        expect(locate('#password-status')).to_contain_text('암호가 올바르지 않습니다', timeout=20000)
        page.keyboard.press('Escape')

        generator = browser.new_page()
        generator.goto(url)
        generator.add_script_tag(url=url + 'vendor/xlsx-populate.min.js')
        old_payload = generator.evaluate('''async rows => {
            const wb = await XlsxPopulate.fromBlankAsync();
            wb.sheet(0).cell('A1').value(rows);
            wb.addSheet('가상숨김').cell('A1').value([rows[0], [
                '가상숨김인물', '1991-08-03', '가상부서', '가상직종', '교육공무직', '2024-01-01', '2024-01-02'
            ]]).sheet().hidden(true);
            return Array.from(new Uint8Array(await wb.outputAsync({password: 'qa-fixture', type: 'arraybuffer'})));
        }''', [HEADER, row('가상검수출력', '2024-01-01', '2024-01-03')])
        protected.write_bytes(bytes(old_payload))
        generator.close()
    for action in ('cancel', 'open'):
        locate('#file-input').set_input_files(protected)
        expect(locate('#password-file-name')).to_have_text(protected.name)
        locate('#workbook-password').fill('qa-fixture')
        if action == 'cancel':
            page.keyboard.press('Escape')
        else:
            locate('#unlock-workbook').click()
        expect(locate('#password-dialog')).not_to_be_visible(timeout=20000)
        expect(locate('#workbook-password')).to_have_value('')
        expect(locate('#password-file-name')).to_have_text(protected.name if BASELINE else '')
    expect(locate('.person-card').filter(has_text='가상검수출력')).to_be_visible()
    expect(locate('.person-card').filter(has_text='가상숨김인물')).to_have_count(1 if BASELINE else 0)
    print('PASS 독립 생성 암호화 파일 열기·숨김 시트·취소/완료 후 DOM', flush=True)
    page.close()


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


with tempfile.TemporaryDirectory(prefix='career-stability-') as scratch:
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=ROOT))
    worker = Thread(target=server.serve_forever, daemon=True)
    worker.start()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(executable_path=os.environ.get('CHROMIUM_BINARY'))
            verify(browser, f'http://127.0.0.1:{server.server_port}/', Path(scratch))
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
