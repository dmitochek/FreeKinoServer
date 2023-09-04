import puppeteer from 'puppeteer';
import { MongoDataSource } from 'apollo-datasource-mongodb';
import { XMLHttpRequest } from "xmlhttprequest"

export class Zagonka extends MongoDataSource
{
    browser;
    page;
    listnum;

    async changepage(num)
    {
        await this.page.goto(`https://kinogohd.pro/page/${num}`);
    }

    async ZagonkaInit()
    {
        console.log("ZagonkaInit")
        this.browser = await puppeteer.launch({ headless: true });
        this.page = await this.browser.newPage();
        this.page.once('load', () => console.info('✅ Zagonka page is loaded'));
        this.listnum = 1;

        await this.page.setViewport({ width: 1920, height: 1080 });
        await this.execute();
    }

    async execute()
    {
        console.log("execute")
        while (true)
        {
            await this.changepage(this.listnum);
            let links = await this.page.evaluate(() =>
            {
                return [...document.querySelectorAll("h2.card__title a")].map(elem => elem.href);
            });

            console.log(links);

            for (const link of links)
            {
                await this.page.goto(link, { waitUntil: 'domcontentloaded' });

                await this.hdvbPlayer()
                console.log("here")
                /*
                await this.page.evaluate(() =>
                {
                    let content = document.querySelectorAll("h1")[0].textContent;
                    let name = content.slice(0, content.indexOf("(") - 1);
                    let year = Number(content.slice(content.indexOf("(") + 1, content.indexOf(")")));
                    let details = document.getElementsByClassName("col-12 col-md-8")[0].textContent;
                    details = details.replace(/(\r\n|\n|\r|\t)/gm, " ").trim();
                    let rate = document.querySelectorAll("ul.watchMovie-info li.alert.alert-light:last-child")[0].outerText.trim();
                });*/
            }

            ++this.listnum;
        }
    }

    async hdvbPlayer()
    {

        console.log("hdvbPlayer");
        //await this.page.setRequestInterception(true);
        await this.page.evaluate(_ =>
        {
            window.scrollBy(0, window.innerHeight);
            return true
        });
        //TODO add timeout

        const iframe = await this.page.waitForResponse(response =>
        {
            if (response.url().startsWith('https://vid'))
                return response;
        });


        const resp = await this.page.waitForResponse(response =>
        {
            if (response.url().startsWith('https://vid') && response.request().resourceType() == "xhr")
                return response;
        });

        let data = await resp.text();
        let linkUrl = await resp.url();
        linkUrl = linkUrl.slice(0, linkUrl.indexOf(".pw") + 3)


        if (data.indexOf("{") === -1)
        {
            console.log("!" + data)
            //TODO mongo
            return;
        }

        data = JSON.parse(data);
        let frameHTML = await iframe.text();
        let frameJSON = JSON.parse(frameHTML.slice(frameHTML.indexOf("playerConfigs") + 15, frameHTML.indexOf("};") + 1));
        let key = frameJSON.key;

        let arr = [];

        for (let seasonInfo of data)
        {
            let { id, folder: season } = seasonInfo;

            arr.push({ id: id, folder: [] });

            for (let { episode, folder } of season)
            {
                arr[arr.length - 1].folder.push({ episode: episode, links: [] });

                for (let series of folder)
                {
                    if (Array.isArray(series))
                        continue;
                    console.log("!")
                    console.log(series.file)
                    console.log(`${linkUrl}/playlist/${series.file.substr(1)}.txt`)
                    console.log("!!")
                    let { file, title } = series;

                    let res = await this.page.evaluate((file, key, linkUrl) =>
                    {
                        return new Promise(function (resolve, reject)
                        {
                            let req = new XMLHttpRequest();
                            let addr = `${linkUrl}/playlist/${file.substr(1)}.txt`;
                            req.open("POST", addr, true);
                            req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                            req.setRequestHeader("X-CSRF-TOKEN", key);
                            req.onload = function ()
                            {
                                if (req.readyState == XMLHttpRequest.DONE && req.status == 200)
                                {
                                    resolve(req.response);
                                }
                                else
                                {
                                    reject({
                                        status: req.status,
                                        statusText: req.statusText
                                    });
                                }
                            };

                            req.onerror = function ()
                            {
                                reject({
                                    status: req.status,
                                    statusText: req.statusText
                                });
                            };
                            req.send(null);
                        });
                    }, file, key, linkUrl);

                    console.log(res + "YES");
                    const folderIndex = arr[arr.length - 1].folder.length - 1;
                    arr[arr.length - 1].folder[folderIndex].links.push({ file: res, title: title });
                }
            }
        }


    }

}