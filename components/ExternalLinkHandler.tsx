'use client'

import { useEffect } from 'react'
import { EXTERNAL_LINK_ICON_PATHS } from './ExternalLinkIcon'

const EXTERNAL_LINK_SELECTOR = 'a[href]'
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

const isExternalHttpLink = (anchor: HTMLAnchorElement) => {
  const href = anchor.getAttribute('href')

  if (!href || href.startsWith('#')) return false

  try {
    const url = new URL(href, window.location.href)

    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      url.origin !== window.location.origin
    )
  } catch {
    return false
  }
}

const appendExternalLinkIcon = (anchor: HTMLAnchorElement) => {
  if (!anchor.textContent?.trim()) return
  if (anchor.querySelector('img, picture, svg, video, canvas')) return
  if (anchor.querySelector('[data-external-link-icon]')) return

  const icon = document.createElementNS(SVG_NAMESPACE, 'svg')
  icon.setAttribute('aria-hidden', 'true')
  icon.setAttribute('class', 'external-link-icon')
  icon.setAttribute('viewBox', '0 0 20 20')
  icon.setAttribute('fill', 'none')
  icon.setAttribute('data-external-link-icon', 'auto')

  EXTERNAL_LINK_ICON_PATHS.forEach((pathData) => {
    const path = document.createElementNS(SVG_NAMESPACE, 'path')
    path.setAttribute('d', pathData)
    path.setAttribute('stroke', 'currentColor')
    path.setAttribute('stroke-width', '1.6')
    path.setAttribute('stroke-linecap', 'round')
    path.setAttribute('stroke-linejoin', 'round')
    icon.appendChild(path)
  })

  anchor.appendChild(icon)
}

const updateExternalLinks = (root: ParentNode = document) => {
  root.querySelectorAll<HTMLAnchorElement>(EXTERNAL_LINK_SELECTOR).forEach((anchor) => {
    if (!isExternalHttpLink(anchor)) {
      anchor.removeAttribute('data-external-link')
      anchor.querySelector('[data-external-link-icon="auto"]')?.remove()
      return
    }

    anchor.target = '_blank'
    anchor.rel = 'noopener noreferrer'
    anchor.dataset.externalLink = 'true'
    appendExternalLinkIcon(anchor)
  })
}

export default function ExternalLinkHandler() {
  useEffect(() => {
    updateExternalLinks()

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLAnchorElement) {
            updateExternalLinks(node.parentNode ?? document)
            return
          }

          if (node instanceof HTMLElement) {
            updateExternalLinks(node)
          }
        })
      })
    })

    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  return null
}
