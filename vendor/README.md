# Excel 라이브러리

| 파일 | 버전 | 라이선스 | SHA-256 |
| --- | --- | --- | --- |
| xlsx.full.min.js | SheetJS CE 0.20.3 | Apache-2.0 | `cc015130aa8521e7f088f88898eba949ccdcbfb38df0bd129b44b7273c3a6f41` |
| xlsx-populate.min.js | xlsx-populate 1.21.0과 JSZip 3.10.1 | xlsx-populate MIT, JSZip MIT 옵션 및 포함된 라이브러리별 조건 | `f177b4b21d7e98a3f22068d7ae4b99dbf3be2377d7a4d1774de1a3ba6593d672` |

앱과 동일한 출처에서 제공합니다. 암호화 번들은 npm 원본 패키지들과 고정된 의존성을 사용합니다. 복호화 시에는 원본 Excel ZIP을 반환하고, 수정 대장 저장에는 기존 xlsx-populate의 Agile 암호화를 사용합니다. 포함된 패키지별 라이선스는 [THIRD-PARTY-NOTICES.txt](THIRD-PARTY-NOTICES.txt)에 있습니다.

저장소 루트에서 번들을 다시 빌드할 수 있습니다.

```sh
npm ci --prefix tools/office-bundle
npm run build --prefix tools/office-bundle
```

- [SheetJS 배포 파일](https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js)
- [xlsx-populate 1.21.0](https://www.npmjs.com/package/xlsx-populate/v/1.21.0)
- [JSZip 3.10.1](https://www.npmjs.com/package/jszip/v/3.10.1)
