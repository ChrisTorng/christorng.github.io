import type { Blog } from 'contentlayer/generated'

const datedPostSlugPattern = /^(\d{4})\d{4}-(.+)$/

export function getLegacyPostSlug(slug: string) {
  const match = datedPostSlugPattern.exec(slug)
  if (!match) return undefined

  const year = match[1]
  const titleSlug = match[2]
  return `${year}/${titleSlug}`
}

export function findBlogBySlug(posts: Blog[], slug: string) {
  const post = posts.find((post) => post.slug === slug)
  if (post) {
    return { post, isLegacySlug: false }
  }

  const legacyPost = posts.find((post) => getLegacyPostSlug(post.slug) === slug)
  return legacyPost ? { post: legacyPost, isLegacySlug: true } : undefined
}

export function isPublishedPost(post: Blog) {
  return post.draft !== true
}

export function isDraftPost(post: Blog) {
  return post.draft === true
}

export function getPublishedBlogs(posts: Blog[]) {
  return posts.filter(isPublishedPost)
}

export function getDraftBlogs(posts: Blog[]) {
  return posts.filter(isDraftPost)
}
