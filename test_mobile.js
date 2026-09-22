const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });

  // 1. Mobile Test (Pixel 7)
  const mobileCtx = await browser.newContext({ ...devices['Pixel 7'] });
  const mobilePage = await mobileCtx.newPage();
  
  console.log('Mobile: Navigating to login...');
  await mobilePage.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
  await mobilePage.click('button:has-text("Admin")');
  await mobilePage.waitForURL('http://localhost:3001/', { timeout: 10000 });
  await mobilePage.waitForTimeout(2000);
  await mobilePage.screenshot({ path: 'mobile_dashboard_after.png' });
  console.log('Mobile dashboard captured.');

  // Open drawer
  await mobilePage.click('button[aria-label="Open Navigation Menu"]');
  await mobilePage.waitForTimeout(600);
  await mobilePage.screenshot({ path: 'mobile_drawer_open.png' });
  console.log('Mobile drawer captured.');

  // Navigate to calling sewa
  await mobilePage.click('aside a:has-text("Calling Sewa")');
  await mobilePage.waitForTimeout(2000);
  await mobilePage.screenshot({ path: 'mobile_calling_sewa.png' });
  console.log('Mobile Calling Sewa captured.');

  // 2. Desktop Test (1440x900)
  const desktopCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const desktopPage = await desktopCtx.newPage();
  console.log('Desktop: Navigating to login...');
  await desktopPage.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
  await desktopPage.click('button:has-text("Admin")');
  await desktopPage.waitForURL('http://localhost:3001/', { timeout: 10000 });
  await desktopPage.waitForTimeout(2000);
  await desktopPage.screenshot({ path: 'desktop_dashboard.png' });
  console.log('Desktop dashboard captured.');

  await browser.close();
  console.log('All tests passed and screenshots generated!');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
