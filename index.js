const fetch = require('node-fetch')
const cheerio = require('cheerio')
const Epub = require('epub-gen')

const getChapterEpubContent = async (chapterUrl) => {
    const res = await fetch(chapterUrl)
    const body = await res.text()

    const $ = cheerio.load(body)

    const articleNode = $('article.post')
    const article = articleNode.html()
    const entryTitle = $('.entry-title').text()
    // console.log(entryTitle)

    const content = {
        title: `Chapter - ${entryTitle}`, // Optional
        data: article,
    }

    return content
}

;(async function () {
    const res = await fetch('https://wanderinginn.com/table-of-contents/')
    const body = await res.text()

    const chapterLinks = []

    const $ = cheerio.load(body)
    $('a').each((i, link) => {
        chapterLinks.push($(link).attr('href'))
    })

    const startChapterIndex = chapterLinks.findIndex(
        (link) => link === 'https://wanderinginn.com/2021/01/10/8-00/'
    )
    const endChapterIndex = chapterLinks.findIndex(
        (link) => link === 'https://wanderinginn.com/2022/05/03/epilogue/'
    )
    const chaptersFromDefinedIndex = chapterLinks.slice(
        startChapterIndex,
        endChapterIndex + 1
    )
    const onlyBookChapters = chaptersFromDefinedIndex.filter((link) =>
        /wanderinginn.com/.test(link)
    )

    const content = onlyBookChapters.map((chapterLink, index) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                getChapterEpubContent(chapterLink)
                    .then((content) => {
                        console.log(content.title, index)
                        resolve(content)
                    })
                    .catch((err) => {
                        reject(err)
                    })
            }, index * 300)
        })
    })

    Promise.all(content)
        .then((chapters) => {
            const option = {
                title: 'The Wandering inn', // *Required, title of the book.
                author: 'Pirate Aba', // *Required, name of the author.
                cover: 'https://m.media-amazon.com/images/I/41zGUBv9XHL.SX316.SY480._SL500_.jpg', // Url or File path, both ok.
                content: chapters,
            }
            new Epub(option, './wanderingInn-vol8.epub')
        })
        .catch((err) => {
            console.error(err)
        })
})()
