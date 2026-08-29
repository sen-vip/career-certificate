# v0.7.5 암호화 Excel 지원 확인

## 자동/정적 확인
- `node --check app.js`: PASS
- HTML 필수 암호 UI 요소 및 id 중복 검사: PASS
- CSS 중괄호 균형 검사: PASS
- 사용자 화면에서 기존 `File is password-protected` 원문 제거: PASS
- 암호 처리 코드에 `localStorage.setItem`, `sessionStorage`, `indexedDB`, `document.cookie` 저장 로직 없음: PASS
- 일반 Excel은 기존 SheetJS 처리 경로를 유지하고 암호 오류일 때만 별도 복호화 경로로 분기: PASS
- 암호화 라이브러리는 암호 파일 감지 후 lazy-load하도록 구성: PASS

## 암호화 파일 픽스처 확인
- LibreOffice의 OOXML 암호 저장 기능으로 실제 파일 열기 암호가 설정된 `.xlsx` 테스트 파일 생성
- 생성 파일이 일반 ZIP(`PK`)이 아닌 CDFV2 Encrypted 컨테이너임을 확인
- 테스트 암호: `test1234` (테스트 픽스처는 배포 ZIP에 포함하지 않음)

## 런타임 확인 필요
- 현재 작업 샌드박스에서는 외부 CDN DNS 연결이 차단되어 `xlsx-populate` 브라우저 번들을 실제 로드한 종단간 복호화 테스트는 수행하지 못함
- 배포/로컬 인터넷 환경에서 실제 암호화 `.xlsx`로 다음을 최종 확인 권장:
  1. 암호 입력 모달 자동 표시
  2. 틀린 암호 재입력
  3. 올바른 암호로 대장 인식
  4. 일반 `.xlsx` 회귀 없음

# v0.7.3 경력별 방학기간 입력 확인

- 선택 경력 정렬: 증명서 경력행과 동일하게 시작일 순으로 표시
- 경력별 카드: 각 선택 경력마다 독립 카드 생성
- 저장 구조: `state.vacationOptions`가 `record.id`별로 독립 저장
- 날짜 검증: 각 방학기간은 해당 `record.startDate ~ record.endDate` 범위만 사용
- 다중 방학: 한 경력 안에서 여름/겨울/학년말 등 여러 기간 추가 가능
- 증명서 참조: 상세 방학이 있는 경력의 `※번호`가 실제 경력행 번호와 일치
- 인쇄 차단: 상세입력 모드에서 비어 있음/역전/경력범위 초과/중복 기간은 기존대로 차단
