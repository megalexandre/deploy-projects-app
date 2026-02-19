import { After, AfterAll, Before, BeforeAll, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium, type Browser } from 'playwright';
import type { CustomWorld } from './world';

let browser: Browser;

setDefaultTimeout(30 * 1000);

BeforeAll(async () => {
  browser = await chromium.launch();
});

AfterAll(async () => {
  await browser?.close();
});

Before(async function (this: CustomWorld) {
  this.page = await browser.newPage();
});

After(async function (this: CustomWorld) {
  await this.page?.close();
});
