# UI / Data / API 分工（2026-11-05 一次性調整）

## 部署責任

| 領域 | 所屬 repo | 建置與發布 |
| --- | --- | --- |
| 主站、文章、書籤、隨筆公開頁與管理／編輯器 HTML、JS、CSS | `ChrisTorng/christorng.github.io` | GitHub Pages Action；UI 修改不部署 Worker |
| 書籤公開與管理資料 API、D1、RSS XML | `ChrisTorng/blog-bookmarks` | Cloudflare Worker；僅資料／API 有變更時部署 |
| 隨筆公開與管理資料 API、D1、RSS／Sitemap XML | `ChrisTorng/blog-notes` | Cloudflare Worker；僅資料／API 有變更時部署 |

以上所有頁面持續使用 `https://christorng.idv.tw`，瀏覽器向同網域相對路徑 `/bookmarks/api/*` 和 `/notes/api/*` 呼叫資料。不另開 CORS 或跨網域登入流程。

## 正式路由

GitHub Pages 負責：
- `/bookmarks/`（React 靜態頁，從 API 載入及依條件搜尋）
- `/bookmarks/view/?id=<UUID>`（靜態書籤詳情）
- `/bookmarks/admin/`、`/bookmarks/admin/quick/` 及 `/bookmarks/*.js|css`
- `/notes/`（React 靜態頁）、`/notes/view/?id=<note-id>`、`/notes/editor/` 及編輯器 JS/CSS
- 原有 `/` 文章＋隨筆清單、`/blog/` 等全部主站頁面

Cloudflare Worker Routes **只**配置：
- Bookmarks：`/bookmarks/api*`、`/bookmarks/feed.xml*`
- Notes：`/notes/api*`、`/notes/feed.xml*`、`/notes/all/feed.xml*`、`/notes/sitemap.xml*`

原有 `/bookmarks/<UUID>/`、`/notes/<note-id>/` 歷史網址透過 Cloudflare 一次性 301 Redirect Rule 轉成 `/bookmarks/view/?id=...` 和 `/notes/view/?id=...`，保留既有外部連結。不要對 `api`、`admin`、`editor`、`feed.xml`、`view` 等非詳情路徑套用轉址。

## 驗證／安全

- 靜態管理頁的 HTML/CSS/JS 是公開可取得的程式碼；**私有內容與可變更操作皆須驗證 Cloudflare Access JWT／本機開發 Token**，不能因 UI 靜態化而放寬 API。
- 不公開資料不能由公開 API 讀取；前端顯示權限不等於資料存取權限。
- RSS、公開 JSON 的日期隱私規則在 API 資料層處理，不由 CSS 遮蔽。
- 首頁文章＋隨筆 RSS 與書籤 RSS 保持分離。
- GitHub Pages 靜態網站不含 D1 憑證或 API Secret。

## 不重跑一次性作業

既有 D1 資料庫、資料表、Migration、資料轉換、Quota 設定全部沿用，**UI 更新與 Worker deploy 均不執行遠端資料庫 Migration**。過去一次性 Migration 腳本可留作歷史或新的環境初始化，不應加入例行部署管線。

Worker CI 中若需執行 `wrangler d1 migrations apply DB --local`，那僅用於建立**全新、拋棄式本機測試資料庫**；不是對線上 D1 重覆遷移。

## 後續工作方式

1. 只改樣式、互動、頁面、閱讀功能：修改 `christorng.github.io`，PR／CI，合併後 GitHub Pages 自動更新。**不用 Cloudflare Plugin**。
2. 修改 D1 查詢、資料驗證、權限、公共 API、RSS 格式：修改對應 Worker repo，PR／CI，再部署 Worker。才需要 Cloudflare API 或事先配置的最小權限部署憑證。
3. 新增資料庫 schema：須單獨規劃、評估相容性、備份後才執行明確的正式 Migration；不要包含在一般 UI 部署。
4. 切換路由／舊網址轉址屬**一次性基礎設施操作**。完成後維持現狀，非必要不再修改。
