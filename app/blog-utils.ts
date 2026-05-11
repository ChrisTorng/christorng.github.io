import type { Blog } from 'contentlayer/generated'

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
