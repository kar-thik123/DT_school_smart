const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Navigating to login page...');
  await page.goto('http://localhost:4200/authentication/signin');
  
  console.log('Filling credentials...');
  await page.fill('input[formControlName="username"], input[type="email"], input[name="email"]', 'karthik6112001@gmail.com');
  await page.fill('input[formControlName="password"], input[type="password"]', 'System@123');
  
  console.log('Submitting login...');
  await page.click('button[type="submit"]');
  
  console.log('Waiting for navigation to dashboard...');
  await page.waitForTimeout(5000); // Wait 5 seconds for page load
  
  console.log('Current URL:', page.url());
  
  console.log('Retrieving storage values...');
  const storageData = await page.evaluate(() => {
    return {
      sessionStorage: { ...sessionStorage },
      localStorage: { ...localStorage }
    };
  });
  console.log('Storage data:', JSON.stringify(storageData, null, 2));
  
  console.log('Retrieving app-header HTML and state...');
  const headerDetails = await page.evaluate(() => {
    const headerEl = document.querySelector('app-header');
    if (!headerEl) return { error: 'app-header element not found' };
    
    const brandEl = headerEl.querySelector('.navbar-brand');
    const brandHtml = brandEl ? brandEl.outerHTML : 'navbar-brand not found';
    
    let angularLogoImg = null;
    let angularSchoolName = null;
    if (window.ng) {
      const comp = window.ng.getComponent(headerEl);
      if (comp) {
        angularLogoImg = comp.logoImg;
        angularSchoolName = comp.schoolName;
      }
    }
    
    return {
      brandHtml,
      angularLogoImg,
      angularSchoolName
    };
  });
  
  console.log('Header Details:', JSON.stringify(headerDetails, null, 2));
  
  await browser.close();
}

run().catch(console.error);
