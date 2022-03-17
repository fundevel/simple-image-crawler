const puppeteer = require('puppeteer-extra');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { request } = require('http');

puppeteer.use(StealthPlugin());


const name = 'superurbancat';
const targetUrl = 'https://opensea.io/assets/' + name;

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 500);
        });
    });
}

fs.promises.mkdir('./data/' + name, { recursive: true }).catch(console.error);

// puppeteer usage as normal
puppeteer.launch({ headless: true, args: ['--start-maximized'] }).then(async browser => {

    const page = await browser.newPage();
    let itemCount = 0;

    page.on('response', async response => {
        if (response.request().resourceType() === 'image') {            
            const url = response.url();            
            if(url.includes('googleusercontent.com')) {
                const fileName = url.split('/').pop() + ".png";
                console.log("[", ++itemCount, "] >> ", fileName);
                response.buffer().then(file => {
                    const filePath = path.resolve(__dirname, "data", name, fileName);
                    const writeStream = fs.createWriteStream(filePath);
                    writeStream.write(file);
                });
            } else {
                console.log("[SKIP] ", url);
            }            
        }
    });

    await page.goto(targetUrl, { waitUntil: 'networkidle2' });

    await autoScroll(page);

    await browser.close();
});