import puppeteerCore from 'puppeteer-core';
import puppeteer from 'puppeteer';
import MailClickFailedError from './error/mail_click_failed_error.js';

export default class MailClicker {

    browser = null;
    handlers = null;
    mailClient = null;
    statisticsService = null;

    constructor(handlers, mailClient, statisticsService) {
        this.handlers = handlers;
        this.mailClient = mailClient;
        this.statisticsService = statisticsService;
    }

    async openBrowser() {
        if (this.browser) {
            await this.closeBrowser();
        }
        this.browser = await this.getBrowserByPlatform();
    }

    async closeBrowser() {
        await this.browser.close();
    }

    async click(cashmail) {
        if (!cashmail.cashUrl) {
            console.log(`No cash URL's were found for cashmail from ${cashmail.from}`);
            return;
        }
        let page = await this.browser.newPage();
        console.log(`\nTrying to open the link ${cashmail.cashUrl}`);
        await page.goto(cashmail.cashUrl).then(async () => {
            let startLoop = Date.now();
            const handler = cashmail.handler;
            await handler.performCustomAction(page, this.browser);
            while (!handler.hasRedirected(page)) {
                console.log(`Waiting for page to redirect to target from ${page.url()}`);
                await(this.sleep(1000));
                if ((Date.now() - startLoop) > 30000) {
                    throw new MailClickFailedError();
                }
            }
            console.log(`Redirected to ${page.url()}`);
            console.log(`Saving statistic`);
            this.statisticsService.addClick(handler.getName());
            console.log(`Deleting mail from ${cashmail.from}`);
            this.mailClient.deleteMail(cashmail.id);
        }).catch(error => {
            if (error instanceof MailClickFailedError) {
                console.log(`WARNING: There was an error while navigation: ${error}`);
            } else {
                console.log(`WARNING: There was an unknown error while navigation: ${error}`);
            }
            console.log(`Timed out waiting for redirect to target, preserving email for review`);
        }).finally(async () => {
            console.log(`Closing all browser pages`);
            for (let i = 0; i < this.browser.pages().length; i++) {
                await this.browser.pages()[i].close();
            }
        });
    }

    async sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

    async getBrowserByPlatform() {
        if (process.env.MACBOOK === 'true') {
            return await puppeteer.launch({
                headless: true,
                args: this.getBrowserArgs()
            });
        } else {
            return await puppeteerCore.launch({
                headless: true,
                executablePath: '/usr/bin/chromium-browser',
                args: this.getBrowserArgs()
        });
        }
    }

    getBrowserArgs() {
        return [
            "--disable-gpu",
            "--disable-dev-shm-usage",
            "--disable-setuid-sandbox",
            "--no-sandbox",
        ];
    }

}