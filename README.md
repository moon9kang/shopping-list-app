# 쇼핑 리스트 앱

간단한 쇼핑 리스트 웹 앱입니다. 순수 HTML/CSS/JavaScript로 작성되었으며, localStorage를 사용해 데이터를 저장합니다.

## 기능

- 아이템 추가 (버튼 클릭 또는 Enter 키)
- 체크박스로 완료 표시 / 해제
- 개별 아이템 삭제
- 완료 항목 일괄 삭제
- localStorage로 새로고침 후에도 데이터 유지
- 총 개수 / 완료 개수 통계 표시

## 실행 방법

`shopping-list.html` 파일을 브라우저에서 열거나, 로컬 서버로 실행:

```bash
npx serve . -p 8765
```

## 테스트 실행

```bash
npm install
node test-shopping.js
```

Playwright를 사용한 E2E 테스트 10개가 포함되어 있습니다.
