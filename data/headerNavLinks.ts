import { notesDiscoveryEnabled } from './notesSettings'
import { bookmarksDiscoveryEnabled } from './bookmarksSettings'
const headerNavLinks = [
  { href: '/', title: '首頁' },
  { href: '/blog', title: '文章' },
  ...(notesDiscoveryEnabled ? [{ href: '/notes/', title: '隨筆' }] : []),
  ...(bookmarksDiscoveryEnabled ? [{ href: '/bookmarks/', title: '書籤' }] : []),
  ...(process.env.NODE_ENV !== 'production' ? [{ href: '/draft', title: '草稿' }] : []),
  { href: '/tags', title: '類別' },
  { href: '/projects', title: '專案' },
  { href: '/about', title: '關於我' },
]

export default headerNavLinks
