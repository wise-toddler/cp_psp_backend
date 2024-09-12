const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const initiatePage = async () => {
    try {
        const browser = await puppeteer.launch({
            executablePath: '/usr/bin/microsoft-edge',
            headless: false,
            userDataDir: '/home/ansh/.config/microsoft-edge/Default', // Modify this path if using a different profile
        });
        const page = await browser.newPage();

        // Set User-Agent and other headers to mimic a real browser
        // await page.setUserAgent(
        //     'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36'
        // );
        // await page.setExtraHTTPHeaders({
        //     'Accept-Language': 'en-US,en;q=0.9',
        //     'Accept-Encoding': 'gzip, deflate, br',
        //     'Referer': 'https://www.google.com/',
        // });

        return page;
    } catch (error) {
        console.error('Error occurred while initiating the page:', error);
        throw error;
    }
};

const gotoPage = async (page, url) => { 
    try {
        await page.goto(url, { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 5000) + 2000)); // Random delay
    } catch (error) {
        console.error('Error occurred while navigating to the page:', error);
        throw error;
    }
};

const closeBrowser = async (page) => {
    if (page && page.browser()) {
        try {
            console.log('Closing the browser...');
            await page.browser().close();
        } catch (error) {
            console.error('Failed to close the browser:', error);
        }
    } else {
        console.log('No browser instance found to close.');
    }
};

module.exports = {
    initiatePage,
    gotoPage,
    closeBrowser
};