from datetime import date
from pathlib import Path
import sys
from openpyxl import Workbook
from openpyxl.utils.datetime import CALENDAR_MAC_1904

out = Path(sys.argv[1])
out.mkdir(parents=True, exist_ok=True)
general = ['성명','생년월일','근무부서','직종·직위','고용형태','임용시작일','임용종료일','소정근로시간']
def row(name, birth, start, end, position='가상직종'):
    return [name,birth,'가상부서',position,'교육공무직',start,end,'주 40시간']
def make(name, sheets, epoch=None):
    book = Workbook()
    book.remove(book.active)
    if epoch: book.epoch = epoch
    for title, rows in sheets:
        sheet = book.create_sheet(title)
        for values in rows: sheet.append(values)
    book.save(out / f'{name}.xlsx')

make('general', [('안내', [['가상 자료']]), ('가상1', [general,
    row('시험가', date(1990,1,1), date(2024,1,31), date(2024,2,28)),
    row('시험가', '1990-01-01', '2024-05-01', '2024-05-10'),
    row('시험번호', '010101-9000000','2024-01-01','2024-01-02'),
    row('시험나', '1992-02-02', '2023-01-01', '2023-01-01'),
    row('시험누락','', '2024-01-01','2024-01-05'),
    row('시험누락','', '2024-02-01','2024-02-05'),
    row('시험누락','1993-01-01','2024-03-01','2024-03-05'),
    row('시험겹침','1990-01-01','2024-01-01','2024-01-31'),
    row('시험겹침','1990-01-01','2024-01-05','2024-01-07'),
    row('시험겹침','1990-01-01','2024-01-10','2024-01-12'),
    row('시험다량','1990-01-01','2024-01-01','2024-01-01'),
    *[row('시험다량','1990-01-01', date(2024,1,i), date(2024,1,i)) for i in range(2,23)]
]), ('가상2', [general, [], row('시험추가', '1995-03-03', '2024-02-29', '2024-02-29')])])
make('invalid', [('설명', [['구조가 없는 파일']])])
make('empty', [('빈대장', [general])])
make('mac', [('가상1904', [general, row('시험맥', date(1990,1,1), date(2024,2,29), date(2024,3,1))])], CALENDAR_MAC_1904)
teacher = ['직위(급)','과목','성명','생년월일 또는 주민번호','임용시작일','임용종료일']
make('teacher', [('가상교원',[teacher,
    ['기간제교사','가상과목','시험교원','1990-01-01','2024-03-01','2025-02-28'],
    ['기간제교사','가상과목','시험교원','1990-01-01','2024-06-01','의원면직']])])
instructor = ['직위구분','담당구분','담당내용','성명','생년월일','임용시작일','임용종료일','주당수업시간','총주수','방학기간 제외']
make('instructor', [('시간강사_입력',[instructor,
    ['시간강사','교과','가상강의','시험강사','1990-01-01','2024-03-01','2025-02-28',6,30,'예']])])
make('mixed', [('일반',[general,row('시험혼합','1990-01-01','2024-03-01','2024-03-02')]),
    ('교원',[teacher,['기간제교사','가상과목','시험별도','1990-01-01','2024-03-01','2024-03-02']])])
