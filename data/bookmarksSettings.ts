// Bookmarks are linked from the blog only in local development.
// Production direct /bookmarks/ routes remain accessible without navigation links.
export const bookmarksDiscoveryEnabled = process.env.NODE_ENV !== 'production'
