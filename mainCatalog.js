import puppeteer from 'puppeteer';

export class Getmedia
{
    static #browser = null;
    static #page = null;
    static #listnum = 1;
    static #prevcat = 0;

    constructor(category)
    {
        this.category = category;
        this.init = this.init.bind(this);
    }

    async #changepage(num)
    {
        await Getmedia.#page.goto(`https://filmix.ac/pages/${num}/`);
    }

    async init()
    {
        if (Getmedia.#browser === null)
        {
            Getmedia.#browser = await puppeteer.launch({ headless: 'new' });
            Getmedia.#page = await Getmedia.#browser.newPage();
            Getmedia.#page.once('load', () => console.info('✅ Page is loaded'));
        }

        if (Getmedia.#prevcat !== this.category)
        {
            Getmedia.#listnum = 1;
        }
        await this.#changepage(Getmedia.#listnum);
        await Getmedia.#page.setViewport({ width: 1920, height: 1080 });

        if (Getmedia.#prevcat !== this.category)
        {
            console.log("Category: ", this.category + 1);
            await Getmedia.#page.click(`.category-menu :nth-child(${this.category + 1})`);
            Getmedia.#prevcat = this.category;
        }

        return await this.#load();
    }

    async #load()
    {
        await Getmedia.#page.screenshot({
            path: 'screenshot.jpg'
        });

        let collection = await Getmedia.#page.evaluate(() =>
        {

            let res = [];
            let imgelemsarr = [...document.getElementsByClassName("fancybox")];
            let imgs = imgelemsarr.map(elem => elem.href);

            let nameelemsarr = [...document.getElementsByClassName("name")];
            let names = nameelemsarr.map(elem => elem.innerText);

            let links = nameelemsarr.map(elem => elem.children[0].href)

            let yearelemsarr = [...document.querySelectorAll("div.year a:first-child")];
            let years = yearelemsarr.map(elem => elem.innerText);

            for (let i = 0; i < names.length; ++i)
                res.push({
                    img: imgs[i],
                    name: names[i],
                    link: links[i],
                    year: years[i],
                });

            return res;
        });

        ++Getmedia.#listnum;

        return collection;

    }

}