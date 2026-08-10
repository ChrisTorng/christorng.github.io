'use client'

import { useEffect, useRef, useState } from 'react'
import { tagDefinitions } from '@/data/tagDefinitions'

const form = {
  uid: 'de7a9c6339',
  src: 'https://christorng.kit.com/de7a9c6339/index.js',
}

const subscriptionTagDefinitions = tagDefinitions.filter(({ id }) => id !== 'english')

function KitForm({ uid, src }: { uid: string; src: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [categoryWarnings, setCategoryWarnings] = useState<string[]>([])
  const isDevelopment = process.env.NODE_ENV === 'development'

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let emailInput: HTMLInputElement | null = null
    let categories: HTMLElement | null = null
    let prepared = false

    const translateMessage = (message: string, type: 'error' | 'success') => {
      const text = message.trim()
      if (!text || /[\u3400-\u9fff]/.test(text)) return text

      if (type === 'success') return '訂閱成功！請前往信箱確認訂閱。'
      if (/already|subscribed/i.test(text)) return '此 Email 已經訂閱。'
      if (/required|blank|missing/i.test(text)) return '請輸入電子郵件地址。'
      if (/invalid|valid email|email address/i.test(text)) return '電子郵件地址格式不正確。'

      return '訂閱時發生錯誤，請稍後再試。'
    }

    const translateKitMessages = () => {
      container.querySelectorAll<HTMLElement>('.formkit-alert-error').forEach((alert) => {
        const messages = alert.querySelectorAll<HTMLElement>('li')
        const targets = messages.length > 0 ? Array.from(messages) : [alert]

        targets.forEach((message) => {
          const translated = translateMessage(message.textContent || '', 'error')
          if (translated && message.textContent !== translated) message.textContent = translated
        })
      })

      container.querySelectorAll<HTMLElement>('.formkit-alert-success').forEach((message) => {
        const translated = translateMessage(message.textContent || '', 'success')
        if (translated && message.textContent !== translated) message.textContent = translated
      })
    }

    const revealCategories = () => {
      if (!categories) return

      categories.inert = false
      categories.setAttribute('aria-hidden', 'false')
      categories.classList.add('is-revealed')
    }

    const checkKitCategories = (checkboxes: HTMLInputElement[]) => {
      if (!isDevelopment) return

      const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
      const optionLabels = checkboxes.map(
        (checkbox) => checkbox.labels?.[0]?.textContent?.trim() || '(無標籤)'
      )
      const allLabel = optionLabels[0]
      const kitLabels = optionLabels.slice(1)
      const normalizedKitLabels = new Set(kitLabels.map(normalize))
      const normalizedSiteLabels = new Set(
        subscriptionTagDefinitions.map(({ displayName }) => normalize(displayName))
      )
      const warnings: string[] = []

      if (allLabel !== '全部文章') {
        warnings.push(`Kit 第一個選項應為「全部文章」(pref:all)，目前是「${allLabel || '缺少'}」。`)
      }

      const missingFromKit = subscriptionTagDefinitions.filter(
        ({ displayName }) => !normalizedKitLabels.has(normalize(displayName))
      )
      if (missingFromKit.length > 0) {
        warnings.push(
          `網站有、Kit 缺少：${missingFromKit
            .map(({ id, displayName }) => `${displayName} (topic:${id})`)
            .join('、')}。`
        )
      }

      const extraInKit = kitLabels.filter((label) => !normalizedSiteLabels.has(normalize(label)))
      if (extraInKit.length > 0) warnings.push(`Kit 有、網站缺少：${extraInKit.join('、')}。`)

      const duplicateLabels = kitLabels.filter(
        (label, index) =>
          kitLabels.findIndex((candidate) => normalize(candidate) === normalize(label)) !== index
      )
      if (duplicateLabels.length > 0) {
        warnings.push(`Kit 有重複分類：${[...new Set(duplicateLabels)].join('、')}。`)
      }

      setCategoryWarnings(warnings)
      if (warnings.length > 0) {
        console.warn('[Newsletter] Kit 訂閱分類與網站類別不一致', {
          warnings,
          siteCategories: subscriptionTagDefinitions,
          kitLabels: optionLabels,
          expectedKitTags: [
            'pref:all',
            ...subscriptionTagDefinitions.map(({ id }) => `topic:${id}`),
          ],
        })
      }
    }

    const prepareForm = () => {
      const kitForm = container.querySelector<HTMLFormElement>(
        `form.formkit-form[data-uid="${uid}"]`
      )
      const fields = kitForm?.querySelector<HTMLElement>('.formkit-fields')
      const fieldElements = fields?.querySelectorAll<HTMLElement>(':scope > .formkit-field')
      const submit = fields?.querySelector<HTMLButtonElement>(':scope > .formkit-submit')

      if (!fields || !fieldElements || fieldElements.length < 2 || !submit) return false

      emailInput = fields.querySelector<HTMLInputElement>('input[name="email_address"]')
      const email = emailInput?.closest<HTMLElement>('.formkit-field')
      const categoryFieldset = fields.querySelector<HTMLElement>(
        'fieldset[data-group="checkboxes"]'
      )
      categories = categoryFieldset?.closest<HTMLElement>('.formkit-field') || null

      if (!emailInput || !email || !categories) return false

      const checkboxes = Array.from(
        categories.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
      )
      const allArticles = checkboxes[0]

      email.classList.add('newsletter-email')
      categories.classList.add('newsletter-categories')
      categories.inert = true
      categories.setAttribute('aria-hidden', 'true')
      fields.insertBefore(submit, categories)

      emailInput.type = 'email'
      emailInput.inputMode = 'email'
      emailInput.autocapitalize = 'none'
      updateEmailValidity()
      if (allArticles) allArticles.checked = true
      checkKitCategories(checkboxes)

      emailInput?.addEventListener('focus', revealCategories, { once: true })
      emailInput?.addEventListener('input', updateEmailValidity)
      emailInput?.addEventListener('invalid', updateEmailValidity)
      categories.addEventListener('change', updateCategorySelection)

      return true
    }

    const updateEmailValidity = () => {
      if (!emailInput) return

      emailInput.setCustomValidity('')
      if (!emailInput.value.trim()) {
        emailInput.setCustomValidity('請輸入電子郵件地址。')
      } else if (emailInput.validity.typeMismatch) {
        emailInput.setCustomValidity('請輸入有效的電子郵件地址。')
      }
    }

    const updateCategorySelection = (event: Event) => {
      if (!(event.target instanceof HTMLInputElement) || event.target.type !== 'checkbox') return
      if (!categories || !event.target.checked) return

      const checkboxes = Array.from(
        categories.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
      )
      const allArticles = checkboxes[0]

      if (event.target === allArticles) {
        checkboxes.slice(1).forEach((checkbox) => {
          checkbox.checked = false
        })
      } else if (allArticles) {
        allArticles.checked = false
      }
    }

    const observer = new MutationObserver(() => {
      if (!prepared) prepared = prepareForm()
      translateKitMessages()
    })
    observer.observe(container, { childList: true, subtree: true })

    const script = document.createElement('script')
    script.async = true
    script.dataset.uid = uid
    script.src = isDevelopment ? `${src}?dev=${Date.now()}` : src
    container.appendChild(script)

    return () => {
      observer.disconnect()
      emailInput?.removeEventListener('focus', revealCategories)
      emailInput?.removeEventListener('input', updateEmailValidity)
      emailInput?.removeEventListener('invalid', updateEmailValidity)
      categories?.removeEventListener('change', updateCategorySelection)
      container.replaceChildren()
    }
  }, [isDevelopment, src, uid])

  return (
    <>
      <div ref={containerRef} />
      {isDevelopment && categoryWarnings.length > 0 && (
        <aside
          role="alert"
          className="mx-auto mt-4 max-w-[700px] border-l-4 border-amber-500 bg-amber-50 p-4 text-amber-950 dark:bg-amber-950/70 dark:text-amber-100"
        >
          <p className="font-semibold">開發警告：Kit 訂閱分類與網站類別不一致</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {categoryWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
          <p className="mt-2 text-sm">
            請同步 Kit 表單選項；第一項使用 pref:all，其餘使用對應的 topic:網站類別 id。
          </p>
        </aside>
      )}
    </>
  )
}

export default function NewsletterForms() {
  return (
    <section
      aria-label="訂閱網站更新"
      className="border-y border-gray-200 py-8 dark:border-gray-700"
    >
      <div className="newsletter-form">
        <KitForm uid={form.uid} src={form.src} />
      </div>
    </section>
  )
}
