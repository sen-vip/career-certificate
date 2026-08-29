# v0.7.10 A4 1페이지 자동 맞춤 확인

## 수정 사항
- 메인 증명서에 `certificate--main` 식별 클래스를 추가
- 실제 `scrollHeight / clientHeight`를 비교하는 `fitMainCertificateToA4()` 추가
- A4 초과 시 `normal → compact-1 → compact-2` 순서로 최대 2단계까지만 압축
- 상벌·징계·직위해제의 긴 문구와 추가 행 높이도 실제 DOM 높이에 포함
- compact 단계에서 글자 크기는 유지하고 경력/상벌 행, 표 padding, 방학기간 안내, 하단 증명문·발급일·학교장·담당자 간격을 우선 축소
- 기존 10줄 전용 `certificate--ten-rows` 런타임/CSS 제거
- 미리보기 렌더 후와 인쇄 직전에 자동 맞춤을 다시 확인

## 정적 검증
- `app.js` JavaScript 구문 검사 통과 (`node --check`)
- 메인 증명서에 `certificate--main` 적용 확인
- 자동 맞춤 단계가 `normal / compact-1 / compact-2` 3단계로 제한되는지 확인
- 10줄 전용 `certificate--ten-rows`가 런타임 코드와 CSS에서 제거됐는지 확인
- 미리보기 기본값 `previewScale = 0.75` 유지 확인
- 인쇄 직전 `fitMainCertificateToA4()`가 호출되는지 확인
- 인적사항/경력사항 좌측 12mm 기준선 규칙 유지 확인

## 확인이 필요한 실제 출력 사례
- 5줄 / 상벌 없음: 기본 레이아웃 유지
- 10줄 / 상벌 없음: 필요 시 자동 compact 적용 후 1페이지 유지
- 5~10줄 / 상벌 3건 이상: 하단 담당자 표가 A4 밖으로 밀리지 않는지 확인
- 긴 시행청·기관명으로 상벌 셀이 2줄 이상일 때 높이 자동 감지 확인
- 공무직·일용직 증명서에서 좌측 기준선과 하단 영역 동시 확인

## 회귀 범위
- 75% 미리보기 확대/축소 로직 유지
- 암호화 Excel 업로드 및 암호 오류 안내 로직 변경 없음
- 별지 페이지의 기존 출력 구조 변경 없음
