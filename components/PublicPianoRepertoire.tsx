import fs from 'fs'
import path from 'path'
import { ReactNode } from 'react'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import GithubSlugger from 'github-slugger'
import matter from 'gray-matter'
import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import type { Root as HastRoot } from 'hast'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import AudioPlayer from './AudioPlayer'
import CustomLink from './Link'
import VideoPlayer from './VideoPlayer'
import YouTubeEmbed from './YouTubeEmbed'

type RecordingComponent = 'YouTubeEmbed' | 'VideoPlayer' | 'AudioPlayer'

type PublicPianoRecording = {
  label?: string
  component: RecordingComponent
  id?: string
  src?: string
  title: string
}

type PublicPianoReference = {
  title: string
  url: string
}

type PublicPianoPiece = {
  composer?: string
  title: string
  originalComposer?: string
  originalTitle?: string
  favorite: number
  difficulty: number
  proficiency: number
  description: string
  recordings?: PublicPianoRecording[]
  professionalReference?: PublicPianoReference
}

type PublicPianoRepertoireProps = {
  source: 'repertoire' | 'other'
  numbered?: boolean
}

const sourceFiles: Record<PublicPianoRepertoireProps['source'], string> = {
  repertoire: 'data/public-piano/repertoire.yaml',
  other: 'data/public-piano/other.yaml',
}

const markdownProcessor = unified().use(remarkParse).use(remarkGfm).use(remarkRehype)

const starPath =
  'M12 2.4 14.55 8.65 21.3 9.05 16.15 13.38 17.8 20.2 12 16.55 6.2 20.2 7.85 13.38 2.7 9.05 9.45 8.65 12 2.4Z'
const halfStarPath = 'M12 2.4 12 16.55 6.2 20.2 7.85 13.38 2.7 9.05 9.45 8.65 12 2.4Z'

const linkIconPathOne =
  'M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z'
const linkIconPathTwo =
  'M11.603 7.963a.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 1 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865Z'

function loadPieces(source: PublicPianoRepertoireProps['source']) {
  const filePath = path.join(process.cwd(), sourceFiles[source])
  const yaml = fs.readFileSync(filePath, 'utf8')
  return matter(`---\n${yaml}\n---`).data.pieces as PublicPianoPiece[]
}

function formatPieceTitle(piece: PublicPianoPiece) {
  return piece.composer ? `${piece.composer} - ${piece.title}` : piece.title
}

function formatOriginalTitle(piece: PublicPianoPiece) {
  if (piece.originalComposer && piece.originalTitle) {
    return `${piece.originalComposer} - ${piece.originalTitle}`
  }

  return piece.originalTitle
}

function MarkdownBlock({ children }: { children?: string }) {
  if (!children) return null

  const mdast = markdownProcessor.parse(children)
  const hast = markdownProcessor.runSync(mdast) as HastRoot

  return (
    <>
      {
        toJsxRuntime(hast, {
          Fragment,
          jsx,
          jsxs,
          components: {
            a: CustomLink,
          },
        }) as ReactNode
      }
    </>
  )
}

function HeadingAnchor({ id }: { id: string }) {
  return (
    <a href={`#${id}`} aria-hidden="true" tabIndex={-1}>
      <span className="content-header-link">
        <svg
          className="linkicon h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d={linkIconPathOne} />
          <path d={linkIconPathTwo} />
        </svg>
      </span>
    </a>
  )
}

function RatingStar({ type }: { type: 'full' | 'half' }) {
  if (type === 'full') {
    return (
      <span className="rating-star" aria-hidden="true">
        <span className="rating-star-source">★</span>
        <svg
          className="rating-star-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          focusable="false"
        >
          <path fill="currentColor" d={starPath} />
        </svg>
      </span>
    )
  }

  return (
    <span className="rating-star" aria-hidden="true">
      <span className="rating-star-source">⯨</span>
      <svg
        className="rating-star-icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        focusable="false"
      >
        <path fill="currentColor" d={halfStarPath} />
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          d={starPath}
        />
      </svg>
    </span>
  )
}

function RatingStars({ value }: { value: number }) {
  const rating = Math.max(0, Math.min(5, value))
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating - fullStars >= 0.5

  return (
    <span aria-label={`${rating} / 5`}>
      {Array.from({ length: fullStars }, (_, index) => (
        <RatingStar key={`full-${index}`} type="full" />
      ))}
      {hasHalfStar && <RatingStar type="half" />}
    </span>
  )
}

function Recording({ recording }: { recording: PublicPianoRecording }) {
  return (
    <>
      <MarkdownBlock>{recording.label}</MarkdownBlock>
      {recording.component === 'YouTubeEmbed' && recording.id && (
        <YouTubeEmbed id={recording.id} title={recording.title} />
      )}
      {recording.component === 'VideoPlayer' && recording.src && (
        <VideoPlayer src={recording.src} title={recording.title} />
      )}
      {recording.component === 'AudioPlayer' && recording.src && (
        <AudioPlayer src={recording.src} title={recording.title} />
      )}
    </>
  )
}

export default function PublicPianoRepertoire({
  source,
  numbered = false,
}: PublicPianoRepertoireProps) {
  const pieces = loadPieces(source)
  const slugger = new GithubSlugger()

  return (
    <div className="public-piano-repertoire">
      {pieces.map((piece, index) => {
        const title = formatPieceTitle(piece)
        const heading = numbered ? `${index + 1}. ${title}` : title
        const headingId = slugger.slug(heading)
        const originalTitle = formatOriginalTitle(piece)

        return (
          <section className="public-piano-piece" key={heading}>
            <h3 className="content-header public-piano-piece-heading" id={headingId}>
              <HeadingAnchor id={headingId} />
              {heading}
            </h3>

            <div className="public-piano-piece-copy">
              {originalTitle && <p>{originalTitle}</p>}

              <ul>
                <li>
                  <strong>喜愛度</strong>: <RatingStars value={piece.favorite} />
                </li>
                <li>
                  <strong>困難度</strong>: <RatingStars value={piece.difficulty} />
                </li>
                <li>
                  <strong>熟練度</strong>: <RatingStars value={piece.proficiency} />
                </li>
              </ul>

              <MarkdownBlock>{piece.description}</MarkdownBlock>

              {piece.professionalReference && (
                <p>
                  參考專業演奏:{' '}
                  <CustomLink href={piece.professionalReference.url}>
                    {piece.professionalReference.title}
                  </CustomLink>
                </p>
              )}
            </div>

            <div className="public-piano-piece-recordings">
              {piece.recordings?.map((recording, recordingIndex) => (
                <Recording key={recordingIndex} recording={recording} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
