#!/usr/bin/env node

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const BASE_URL = 'https://www.rightmove.co.uk';
const SEARCH_URL = `${BASE_URL}/property-for-sale/find.html`;

async function scrapeRightmove(postcode, radius = 1) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    ]
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1920, height: 1080 });

  const searchUrl = `${SEARCH_URL}?searchType=SALE&locationIdentifier=POSTCODE^${postcode.replace(/\s/g, '')}&radius=${radius}`;
  await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

  // Accept cookies if needed
  try {
    const cookieButton = await page.$('#onetrust-accept-btn-handler');
    if (cookieButton) {
      await cookieButton.click();
      await page.waitForTimeout(1000);
    }
  } catch (e) {}

  // Wait for property cards
  await page.waitForTimeout(3000);

  const properties = await page.evaluate(() => {
    const results = [];
    const cards = document.querySelectorAll('.propertyCard, .l-searchResult, .property-card, [data-testid="property-card"]');
    cards.forEach(card => {
      const priceEl = card.querySelector('[data-testid="price"], .propertyCard-priceValue, .price, .l-searchResult__price');
      const titleEl = card.querySelector('[data-testid="title"], .propertyCard-title, .title, .l-searchResult__title');
      const addressEl = card.querySelector('[data-testid="address"], .propertyCard-address, .address, .l-searchResult__address');
      const linkEl = card.querySelector('a[href*="/properties/"], a[href*="/property-for-sale/"]');
      const imageEl = card.querySelector('img');
      results.push({
        price: priceEl?.textContent?.trim() || '',
        title: titleEl?.textContent?.trim() || '',
        address: addressEl?.textContent?.trim() || '',
        link: linkEl?.href || '',
        image: imageEl?.src || ''
      });
    });
    return results;
  });

  await browser.close();
  return properties;
}

// CLI usage: node rightmove-standalone.js SS95EL 1
if (require.main === module) {
  const [,, postcode, radius] = process.argv;
  if (!postcode) {
    console.error('Usage: node rightmove-standalone.js <POSTCODE> [radius]');
    process.exit(1);
  }
  scrapeRightmove(postcode, radius || 1)
    .then(results => {
      console.log(JSON.stringify(results, null, 2));
    })
    .catch(err => {
      console.error('Scraping failed:', err);
      process.exit(2);
    });
} 