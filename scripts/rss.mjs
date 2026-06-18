import { writeFileSync, mkdirSync } from 'fs'
import path from 'path'
import { slug } from 'github-slugger'
import { generateRss } from '../utils/rss.mjs'
import siteMetadata from '../data/siteMetadata.js'
import tagData from '../app/tag-data.json' with { type: 'json' }
import { allBlogs } from '../.contentlayer/generated/index.mjs'
import { sortPosts } from 'pliny/utils/contentlayer.js'

const outputFolder = process.env.EXPORT ? 'out' : 'public'

async function generateRSS(config, allBlogs, page = 'feed.xml') {
  const publishPosts = allBlogs.filter((post) => post.draft !== true)
  // RSS for blog post
  if (publishPosts.length > 0) {
    const rss = await generateRss(config, sortPosts(publishPosts), page)
    writeFileSync(`./${outputFolder}/${page}`, rss)
  }

  if (publishPosts.length > 0) {
    for (const tag of Object.keys(tagData)) {
      const tagSlug = slug(tag)
      const filteredPosts = sortPosts(
        publishPosts.filter((post) => post.tags.map((t) => slug(t)).includes(tagSlug))
      )
      if (filteredPosts.length === 0) continue
      const rss = await generateRss(config, filteredPosts, `tags/${tagSlug}/${page}`)
      const rssPath = path.join(outputFolder, 'tags', tagSlug)
      mkdirSync(rssPath, { recursive: true })
      writeFileSync(path.join(rssPath, page), rss)
    }
  }
}

const rss = async () => {
  await generateRSS(siteMetadata, allBlogs)
  console.log('RSS feed generated...')
}
export default rss
