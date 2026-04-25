const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:8765/shopping-list.html';
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const page = await browser.newPage();

  // localStorage 초기화 (테스트 격리)
  await page.goto(BASE_URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  console.log('\n══════════════════════════════════════');
  console.log(' 쇼핑 리스트 앱 자동 테스트');
  console.log('══════════════════════════════════════');

  console.log('\n[테스트 1] 초기 상태 확인');
  const emptyMsg = await page.locator('#empty').isVisible();
  assert(emptyMsg, '"아직 아이템이 없습니다." 메시지가 표시된다');
  const itemCount = await page.locator('#list li').count();
  assert(itemCount === 0, '리스트가 비어 있다 (항목 0개)');

  console.log('\n[테스트 2] 아이템 추가 (버튼 클릭)');
  await page.fill('#itemInput', '사과');
  await page.click('button:has-text("추가")');
  await page.waitForTimeout(100);
  const count1 = await page.locator('#list li').count();
  assert(count1 === 1, '사과 추가 후 항목 1개');
  const firstText = await page.locator('#list li .item-text').first().textContent();
  assert(firstText === '사과', '첫 번째 항목 텍스트가 "사과"');
  const emptyHidden = await page.locator('#empty').isHidden();
  assert(emptyHidden, '항목 추가 후 빈 메시지가 숨겨진다');

  console.log('\n[테스트 3] 아이템 추가 (Enter 키)');
  await page.fill('#itemInput', '우유');
  await page.press('#itemInput', 'Enter');
  await page.waitForTimeout(100);
  await page.fill('#itemInput', '계란');
  await page.press('#itemInput', 'Enter');
  await page.waitForTimeout(100);
  const count2 = await page.locator('#list li').count();
  assert(count2 === 3, 'Enter로 추가 후 총 3개 항목');
  const topText = await page.locator('#list li .item-text').first().textContent();
  assert(topText === '계란', '가장 최근 추가 항목이 맨 위에 위치한다');

  console.log('\n[테스트 4] 빈 입력값 추가 방지');
  await page.fill('#itemInput', '   ');
  await page.press('#itemInput', 'Enter');
  await page.waitForTimeout(100);
  const countAfterEmpty = await page.locator('#list li').count();
  assert(countAfterEmpty === 3, '공백 입력은 추가되지 않는다');

  console.log('\n[테스트 5] 체크(완료) 기능');
  const appleItem = page.locator('#list li').filter({ hasText: '사과' });
  const appleCheckbox = appleItem.locator('input[type="checkbox"]');
  await appleCheckbox.check();
  await page.waitForTimeout(100);
  const appleChecked = await appleCheckbox.isChecked();
  assert(appleChecked, '"사과" 체크박스가 체크됨');
  const appleDone = await appleItem.evaluate(el => el.classList.contains('done'));
  assert(appleDone, '"사과" 항목에 "done" 클래스가 추가됨 (취소선)');
  const statsText = await page.locator('#stats').textContent();
  assert(statsText.includes('완료 1'), `통계에 "완료 1" 표시 (실제: "${statsText.trim()}")`);

  console.log('\n[테스트 6] 체크 해제 (토글)');
  await appleCheckbox.uncheck();
  await page.waitForTimeout(100);
  const appleUnchecked = await appleCheckbox.isChecked();
  assert(!appleUnchecked, '"사과" 체크박스가 해제됨');
  const appleNotDone = await appleItem.evaluate(el => !el.classList.contains('done'));
  assert(appleNotDone, '"사과" 항목에서 "done" 클래스가 제거됨');

  console.log('\n[테스트 7] 개별 항목 삭제');
  const countBefore = await page.locator('#list li').count();
  const milkItem = page.locator('#list li').filter({ hasText: '우유' });
  await milkItem.locator('.delete-btn').click();
  await page.waitForTimeout(100);
  const countAfterDelete = await page.locator('#list li').count();
  assert(countAfterDelete === countBefore - 1, `삭제 후 항목 수 감소 (${countBefore} → ${countAfterDelete})`);
  const milkExists = await page.locator('#list li').filter({ hasText: '우유' }).count();
  assert(milkExists === 0, '"우유" 항목이 리스트에서 제거됨');

  console.log('\n[테스트 8] localStorage 영속성');
  const storedRaw = await page.evaluate(() => localStorage.getItem('shopping_list'));
  const stored = JSON.parse(storedRaw);
  assert(Array.isArray(stored) && stored.length === 2, `localStorage에 2개 항목 저장됨`);
  await page.reload();
  await page.waitForTimeout(200);
  const countAfterReload = await page.locator('#list li').count();
  assert(countAfterReload === 2, `새로고침 후 데이터 유지 (${countAfterReload}개)`);

  console.log('\n[테스트 9] 완료 항목 일괄 삭제');
  const appleItemReloaded = page.locator('#list li').filter({ hasText: '사과' });
  await appleItemReloaded.locator('input[type="checkbox"]').check();
  await page.waitForTimeout(100);
  await page.click('button:has-text("완료 항목 지우기")');
  await page.waitForTimeout(100);
  const countAfterClear = await page.locator('#list li').count();
  assert(countAfterClear === 1, '완료 항목 삭제 후 미완료 항목만 남음 (1개)');
  const appleGone = await page.locator('#list li').filter({ hasText: '사과' }).count();
  assert(appleGone === 0, '"사과"(완료) 항목이 제거됨');

  console.log('\n[테스트 10] 마지막 항목 삭제 후 빈 상태');
  await page.locator('#list li .delete-btn').first().click();
  await page.waitForTimeout(100);
  const finalCount = await page.locator('#list li').count();
  assert(finalCount === 0, '모든 항목 삭제 후 리스트 비어 있음');
  const emptyVisible = await page.locator('#empty').isVisible();
  assert(emptyVisible, '빈 메시지가 다시 표시됨');

  console.log('\n══════════════════════════════════════');
  console.log(` 테스트 완료: ${passed + failed}개 중 ${passed}개 통과, ${failed}개 실패`);
  console.log('══════════════════════════════════════\n');

  await page.waitForTimeout(1500);
  await browser.close();

  process.exit(failed > 0 ? 1 : 0);
})();