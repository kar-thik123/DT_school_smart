const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Log all console messages
  page.on('console', msg => {
    console.log(`[Console] ${msg.type()}: ${msg.text()}`);
  });

  // Log all requests
  page.on('request', request => {
    console.log(`[Request] ${request.method()} ${request.url()}`);
  });

  page.on('response', response => {
    console.log(`[Response] ${response.status()} ${response.url()}`);
  });

  page.on('pageerror', err => {
    console.error('[Page Error]', err);
  });

  console.log('Navigating to login page...');
  await page.goto('http://localhost:4200/authentication/signin');

  // Wait for Angular to initialize
  await page.waitForTimeout(3000);

  console.log('Filling email...');
  const emailInput = 'input[formcontrolname="email"], input[type="email"]';
  await page.waitForSelector(emailInput);
  await page.fill(emailInput, 'karthik6112001@gmail.com');

  console.log('Filling password...');
  const passwordInput = 'input[formcontrolname="password"], input[type="password"]';
  await page.waitForSelector(passwordInput);
  await page.fill(passwordInput, 'System@123');

  console.log('Submitting login...');
  const submitButton = 'button[type="submit"]';
  await page.click(submitButton);

  console.log('Waiting for URL changes/API calls...');
  await page.waitForTimeout(8000);

  console.log('Current URL (before reload):', page.url());

  console.log('--- STORAGE DUMP (before reload) ---');
  let storageData = await page.evaluate(() => {
    return {
      sessionStorage: { ...sessionStorage },
      localStorage: { ...localStorage }
    };
  });
  console.log(JSON.stringify(storageData, null, 2));

  console.log('--- DOM INSPECTION (before reload) ---');
  let domDetails = await page.evaluate(() => {
    const header = document.querySelector('app-header');
    if (!header) return { error: 'app-header not found' };
    const navbarBrand = header.querySelector('.navbar-brand');
    if (!navbarBrand) return { error: '.navbar-brand not found in app-header' };
    const imgs = Array.from(navbarBrand.querySelectorAll('img')).map(img => ({
      outerHTML: img.outerHTML,
      src: img.src,
      complete: img.complete
    }));
    return { navbarBrandHTML: navbarBrand.outerHTML, imagesFound: imgs };
  });
  console.log(JSON.stringify(domDetails, null, 2));

  console.log('--- RELOADING PAGE ---');
  await page.reload();
  await page.waitForTimeout(8000);

  console.log('Current URL (after reload):', page.url());

  console.log('--- STORAGE DUMP (after reload) ---');
  storageData = await page.evaluate(() => {
    return {
      sessionStorage: { ...sessionStorage },
      localStorage: { ...localStorage }
    };
  });
  console.log(JSON.stringify(storageData, null, 2));

  console.log('--- DOM INSPECTION (after reload) ---');
  domDetails = await page.evaluate(() => {
    const header = document.querySelector('app-header');
    if (!header) return { error: 'app-header not found' };
    const navbarBrand = header.querySelector('.navbar-brand');
    if (!navbarBrand) return { error: '.navbar-brand not found in app-header' };
    const imgs = Array.from(navbarBrand.querySelectorAll('img')).map(img => ({
      outerHTML: img.outerHTML,
      src: img.src,
      complete: img.complete
    }));
    return { navbarBrandHTML: navbarBrand.outerHTML, imagesFound: imgs };
  });
  console.log(JSON.stringify(domDetails, null, 2));

  // Take a final screenshot
  await page.screenshot({ path: 'after_reload.png' });
  console.log('Screenshot saved as after_reload.png');

  await browser.close();
}

run().catch(console.error);
