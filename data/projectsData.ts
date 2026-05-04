interface Project {
  title: string
  description: string
  href?: string
  demoHref?: string
  imgSrc?: string
}

interface ProjectCategory {
  title: string
  projects: Project[]
}

const projectCategories: ProjectCategory[] = [
  {
    title: 'Tampermonkey 腳本',
    projects: [
      {
        title: 'TampermonkeyScripts',
        description:
          '個人常用的 Tampermonkey 腳本集合，包含閱讀輔助、網站重導、頁面整理、YouTube 工具、行動版版面改善與暗色模式等瀏覽器自動化功能。',
        href: 'https://github.com/ChrisTorng/TampermonkeyScripts',
        demoHref: 'https://christorng.github.io/TampermonkeyScripts/',
      },
      {
        title: 'ReadOrNot',
        description:
          '在文章連結上停留時預覽標題與閱讀時間，並以關鍵字與可選 AI 評估協助判斷文章是否值得閱讀的 Tampermonkey 腳本。',
        href: 'https://github.com/ChrisTorng/ReadOrNot',
        demoHref: 'https://christorng.github.io/ReadOrNot/',
      },
    ],
  },
  {
    title: '賞鳥',
    projects: [
      {
        title: 'eBirdScripts',
        description:
          '改善 eBird 網站操作體驗的 Tampermonkey 腳本，會在熱門鳥點等頁面補上最近鳥種與最近紀錄等快速入口。',
        href: 'https://github.com/ChrisTorng/eBirdScripts',
        demoHref: 'https://christorng.github.io/eBirdScripts/',
        imgSrc: 'https://raw.githubusercontent.com/ChrisTorng/eBirdScripts/main/demo.png',
      },
      {
        title: 'eBird',
        description:
          '整理 eBird 最近熱門地點與鳥訊快報的工具，將純文字鳥訊依地點群組、清理中外文混雜內容，讓鳥種與紀錄更容易瀏覽。',
        href: 'https://github.com/ChrisTorng/eBird',
        demoHref: 'https://e-bird-christorngs-projects.vercel.app/',
        imgSrc:
          'https://raw.githubusercontent.com/ChrisTorng/eBird/main/images/eBird-recent-hotspots.png',
      },
    ],
  },
  {
    title: '檔案處理',
    projects: [
      {
        title: 'pdf-print2pdf',
        description:
          '使用 PyMuPDF 將 PDF 重新寫出為新檔，可單檔或批次處理，用於重新產生、清理、正規化與壓縮 PDF。',
        href: 'https://github.com/ChrisTorng/pdf-print2pdf',
      },
      {
        title: 'mermaid2svg',
        description:
          '純前端 Mermaid SVG 匯出工具，可上傳或貼上 Markdown，自動偵測 Mermaid 區塊並逐一下載 SVG 或批次打包。',
        href: 'https://github.com/ChrisTorng/mermaid2svg',
        demoHref: 'https://christorng.github.io/mermaid2svg/',
      },
      {
        title: 'PdfProcess',
        description: 'PDF 處理工具集合，目前包含將聽力測驗等多頁 PDF 合併排列為單頁輸出的腳本。',
        href: 'https://github.com/ChrisTorng/PdfProcess',
      },
    ],
  },
  {
    title: '工具',
    projects: [
      {
        title: 'MaxContentView',
        description:
          'Visual Studio 擴充套件，可最大化內容檢視區，並可選擇隱藏標題列、選單列與文件分頁，降低開發時的介面干擾。',
        href: 'https://github.com/ChrisTorng/MaxContentView',
        demoHref: 'https://marketplace.visualstudio.com/items?itemName=ChrisTorng.MinimalisticView',
      },
      {
        title: 'cli-tools',
        description: '個人 CLI 工具集合，收納日常工作流程中常用的小型命令列輔助程式。',
        href: 'https://github.com/ChrisTorng/cli-tools',
      },
      {
        title: 'dotfiles-cli-tools',
        description:
          '跨 Shell 的小型命令列工具整理，涵蓋 shell、Python、PowerShell、CMD 等版本，方便加入 PATH 或選擇性使用。',
        href: 'https://github.com/ChrisTorng/dotfiles-cli-tools',
      },
      {
        title: 'InfoProcess',
        description:
          '資訊處理小工具集合，包含剪貼簿檢視與文字轉網頁顯示等功能，方便把其他應用程式內容交給瀏覽器翻譯或檢查格式。',
        href: 'https://github.com/ChrisTorng/InfoProcess',
        demoHref: 'https://christorng.github.io/InfoProcess/',
      },
      {
        title: 'mass-translate',
        description:
          '批次翻譯工具，可將指定資料夾內的檔案透過 OpenAI 相容 LLM API 翻譯為繁體中文，適合大量文件本地化。',
        href: 'https://github.com/ChrisTorng/mass-translate',
      },
    ],
  },
  {
    title: '媒體',
    projects: [
      {
        title: 'ImageMeasurer2',
        description:
          '照片透視校正網頁工具，可在圖片上選取四邊形區域並校正為矩形，同時保留完整轉換後影像供匯出。',
        href: 'https://github.com/ChrisTorng/ImageMeasurer2',
        demoHref: 'https://christorng.github.io/ImageMeasurer2/',
      },
      {
        title: 'reduce-mp4-size',
        description:
          'MP4 壓縮工具，可依目標檔案大小自動調整解析度與位元率，讓輸出影片符合容量需求。',
        href: 'https://github.com/ChrisTorng/reduce-mp4-size',
      },
      {
        title: 'video-cutting',
        description:
          '基於 FFmpeg 的影片切割工具，支援多種時間格式、品質保留、淡入淡出、字幕校正與 YouTube 章節調整。',
        href: 'https://github.com/ChrisTorng/video-cutting',
      },
      {
        title: 'Nef2Jpg',
        description: '將 Nikon NEF RAW 檔批次轉換為 JPG 的 Python 工具，支援輸入單一檔案或資料夾。',
        href: 'https://github.com/ChrisTorng/Nef2Jpg',
      },
      {
        title: 'zoom-chat-to-srt',
        description:
          '將 Zoom 會議儲存的聊天紀錄轉換為 SRT 字幕，修正時間軸並加入繁體中文使用情境的調整。',
        href: 'https://github.com/ChrisTorng/zoom-chat-to-srt',
        imgSrc:
          'https://raw.githubusercontent.com/rasyidev/zoom-chat-to-subtitle/main/demo-zoom-chat-to-subtitle.gif',
      },
      {
        title: 'zoom-chat-to-subtitle',
        description: '將 Zoom 會議聊天文字檔轉為字幕檔，讓錄影播放時可以同步顯示會議聊天內容。',
        href: 'https://github.com/ChrisTorng/zoom-chat-to-subtitle',
        imgSrc:
          'https://raw.githubusercontent.com/ChrisTorng/zoom-chat-to-subtitle/main/demo-zoom-chat-to-subtitle.gif',
      },
    ],
  },
  {
    title: '3D',
    projects: [
      {
        title: 'demo-mediapipe',
        description:
          '使用 Google MediaPipe 即時人臉偵測並疊加虛擬眼鏡的純前端示範，支援多種眼鏡樣式與行動裝置。',
        href: 'https://github.com/ChrisTorng/demo-mediapipe',
        demoHref: 'https://christorng.github.io/demo-mediapipe/',
      },
      {
        title: 'mediapipe-demo',
        description:
          'MediaPipe 前端實驗專案，部署為網頁展示版本，用於測試瀏覽器端即時影像偵測互動。',
        href: 'https://github.com/ChrisTorng/mediapipe-demo',
        demoHref: 'https://christorng.github.io/mediapipe-demo/web/dist/',
      },
      {
        title: '3d-phone-show',
        description:
          '使用 Three.js 建立的互動式 3D 手機展示平台，可切換模型、旋轉縮放、自動展示並查看手機規格。',
        href: 'https://github.com/ChrisTorng/3d-phone-show',
        demoHref: 'https://3d-phone-show.vercel.app/',
      },
      {
        title: '3d-phone-show2',
        description:
          '延伸版 3D 手機展示平台，支援滑鼠旋轉、滾輪縮放與控制面板調整手機顏色及視覺效果。',
        href: 'https://github.com/ChrisTorng/3d-phone-show2',
        demoHref: 'https://3d-phone-show2.vercel.app/',
      },
    ],
  },
  {
    title: '音樂',
    projects: [
      {
        title: 'audio-browser-kiro',
        description:
          '大量音檔的網頁管理與瀏覽工具，支援自動掃描、波形與頻譜視覺化、鍵盤導航、評分、描述與快速篩選。',
        href: 'https://github.com/ChrisTorng/audio-browser-kiro',
      },
      {
        title: 'SongsRemix',
        description:
          '分軌歌曲播放與混音練習工具，可機動調整各聲部音量並同步 YouTube 影片，適合練團與敬拜排練。',
        href: 'https://github.com/ChrisTorng/SongsRemix',
        demoHref: 'https://christorng.github.io/SongsRemixDemo/',
      },
      {
        title: 'MixerGame',
        description:
          '混音能力練習遊戲，讓使用者在未知多軌音源中調整音量與混音，訓練聽辨與音控判斷。',
        href: 'https://github.com/ChrisTorng/MixerGame',
        demoHref: 'https://christorng.github.io/MixerGame/src/',
      },
      {
        title: 'MultistepMetronome',
        description:
          '可在同一首曲子中設定多種拍號與速度變化的網頁節拍器，適合練習拍號與速度轉換複雜的樂曲。',
        href: 'https://github.com/ChrisTorng/MultistepMetronome',
        demoHref: 'https://christorng.github.io/MultistepMetronome/',
      },
      {
        title: 'AudioTest',
        description: '產生週期性純正弦波音訊的測試工具，可用於音訊設備、播放鏈路與訊號處理測試。',
        href: 'https://github.com/ChrisTorng/AudioTest',
        demoHref: 'https://christorng.github.io/AudioTest/',
      },
    ],
  },
  {
    title: '語音',
    projects: [
      {
        title: 'WhisperTranscriber',
        description:
          '使用 faster-whisper、Torch 與 torchaudio 的語音轉文字工具，用於本機音訊檔轉錄流程。',
        href: 'https://github.com/ChrisTorng/WhisperTranscriber',
      },
    ],
  },
  {
    title: 'LLM 語言模型',
    projects: [
      {
        title: 'vllm-benchmarks',
        description:
          'vLLM 相關基準測試專案，用於觀察大型語言模型服務在不同設定下的推論效能與負載表現。',
        href: 'https://github.com/ChrisTorng/vllm-benchmarks',
      },
      {
        title: 'llm-load-test',
        description:
          'LLM API 壓力測試程式碼產生器，支援平行處理、多批次呼叫、串流回應時間統計與結果分析。',
        href: 'https://github.com/ChrisTorng/llm-load-test',
      },
    ],
  },
  {
    title: '編碼',
    projects: [
      {
        title: 'LLMCoder',
        description:
          '協助 LLM 修改程式碼的工具，可產生含行號版本、使用自訂 Markdown diff 指示修改，並自動套用變更。',
        href: 'https://github.com/ChrisTorng/LLMCoder',
        demoHref: 'https://christorng.github.io/LLMCoder/',
        imgSrc: 'https://raw.githubusercontent.com/ChrisTorng/LLMCoder/main/images/LLMCoder.png',
      },
      {
        title: 'LLMCoderSync',
        description:
          '整合 ClaudeSync 與 LLMCoder 的工具，讓 Claude 專案同步與含行號檔案選擇流程更順手。',
        href: 'https://github.com/ChrisTorng/LLMCoderSync',
        imgSrc:
          'https://raw.githubusercontent.com/ChrisTorng/LLMCoderSync/main/images/LLMCoderServer.png',
      },
      {
        title: 'spec-kit-translation',
        description:
          'GitHub spec-kit Copilot 英文樣版的繁體中文翻譯專案，搭配 mass-translate 與 LLM 進行整批翻譯。',
        href: 'https://github.com/ChrisTorng/spec-kit-translation',
      },
    ],
  },
  {
    title: '其他',
    projects: [
      {
        title: 'gd2md-html',
        description:
          'Google Docs 外掛，可將 Google 文件轉換為簡化的 Markdown 或 HTML，作為文件轉換流程的基礎工具。',
        href: 'https://github.com/ChrisTorng/gd2md-html',
      },
      {
        title: 'DocsConverter',
        description:
          'Google Docs 到 Substack 的轉換流程工具，結合 Docs to HTML Converter 與 Tampermonkey 腳本處理貼上格式。',
        href: 'https://github.com/ChrisTorng/DocsConverter',
        demoHref: 'https://christorng.github.io/DocsConverter/',
      },
      {
        title: 'AI-Tools',
        description:
          '收集以 AI 生成並少量人工調整的小工具，包括踩地雷、圖片比較、泛音產生器與勞基法遊戲等實驗作品。',
        href: 'https://github.com/ChrisTorng/AI-Tools',
        demoHref: 'https://christorng.github.io/AI-Tools/',
      },
      {
        title: 'PresentationAlive',
        description:
          '讓雙螢幕投影更容易的 Windows 工具，支援 PowerPoint 播放，以及引用網頁或本機圖片作為投影內容。',
        href: 'https://github.com/ChrisTorng/PresentationAlive',
      },
    ],
  },
]

export default projectCategories
