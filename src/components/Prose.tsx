/**
 * Prose — single source of truth for rendering vault Markdown.
 *
 * Handles GFM tables, soft-break newlines (Obsidian-style), Obsidian `[[wikilinks]]`,
 * and routes internal links through react-router so SPA navigation works.
 */
import { Link } from 'react-router-dom'
import React from 'react'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import type { PluggableList } from 'unified'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import remarkWikiLink from 'remark-wiki-link'
import rehypeRaw from 'rehype-raw'
import { wikiPermalinks, routeForWikiKey } from '../lib/content'

const WIKILINK_PREFIX = 'wikilink:'

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function getTextContent(children: React.ReactNode): string {
  let text = ''
  React.Children.forEach(children, child => {
    if (typeof child === 'string' || typeof child === 'number') {
      text += child
    } else if (React.isValidElement(child) && typeof child.props === 'object' && child.props !== null && 'children' in child.props) {
      text += getTextContent((child.props as { children: React.ReactNode }).children)
    }
  })
  return text
}

const remarkPlugins: PluggableList = [
  remarkGfm,
  remarkBreaks,
  // Obsidian wikilinks: `[[Page Name]]` and `[[Page|Display Text]]`
  [
    remarkWikiLink,
    {
      permalinks: wikiPermalinks,
      aliasDivider: '|',
      hrefTemplate: (permalink: string) => `${WIKILINK_PREFIX}${permalink}`,
      pageResolver: (name: string) => [name.trim()],
    },
  ],
]

const rehypePlugins: PluggableList = [rehypeRaw]

// Matches **ALL CAPS:** and **ALL CAPS (Role):** speaker labels used in screenplay-format episodes
const SPEAKER_RE = /^[A-Z][A-Z0-9 .'.\-]+(?:\s*\([^)]+\))?:$/

const components: Components = {
  h2(props) {
    const text = getTextContent(props.children)
    return <h2 id={slugify(text)} className="scroll-mt-32">{props.children}</h2>
  },
  p(props) {
    const kids = React.Children.toArray(props.children)
    const first = kids[0]

    if (React.isValidElement(first) && (first as React.ReactElement).type === 'strong') {
      const strongEl = first as React.ReactElement<{ children: React.ReactNode }>
      const strongText = getTextContent(strongEl.props.children).trim()

      // **[SCENE START]** / **[SCENE END]**
      if (/^\[SCENE (?:START|END)\]$/.test(strongText)) {
        return (
          <div className="flex items-center gap-4 py-3">
            <span className="flex-1 border-t border-[color:var(--color-rule)]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-ink-faint)]">
              {strongText.slice(1, -1)}
            </span>
            <span className="flex-1 border-t border-[color:var(--color-rule)]" />
          </div>
        )
      }

      // **SPEAKER NAME (Role):**
      if (SPEAKER_RE.test(strongText)) {
        const speakerName = strongText.slice(0, -1) // drop trailing ':'
        const rest = kids.slice(1)

        // skip leading <br> / empty strings
        let i = 0
        while (i < rest.length) {
          const el = rest[i]
          if (React.isValidElement(el) && (el as React.ReactElement).type === 'br') { i++; continue }
          if (typeof el === 'string' && el.trim() === '') { i++; continue }
          break
        }

        // optional stage direction: <em>(…)
        let stageDirection: React.ReactNode = null
        if (i < rest.length) {
          const el = rest[i]
          if (React.isValidElement(el) && (el as React.ReactElement).type === 'em') {
            const emText = getTextContent((el as React.ReactElement<{ children: React.ReactNode }>).props.children)
            if (emText.trim().startsWith('(')) {
              stageDirection = el
              i++
              while (i < rest.length) {
                const x = rest[i]
                if (React.isValidElement(x) && (x as React.ReactElement).type === 'br') { i++; continue }
                if (typeof x === 'string' && x.trim() === '') { i++; continue }
                break
              }
            }
          }
        }

        const dialogue = rest.slice(i)

        return (
          <div className="pl-4 border-l-2 border-[color:var(--color-rule)] space-y-1.5">
            <div className="font-mono text-[10px] uppercase tracking-[0.15em] font-semibold text-[color:var(--color-ink-faint)]">
              {speakerName}
            </div>
            {stageDirection && (
              <div className="font-mono text-[11px] italic text-[color:var(--color-ink-faint)]">
                {stageDirection}
              </div>
            )}
            {dialogue.length > 0 && (
              <p className="leading-relaxed m-0 text-[color:var(--color-ink)]">
                {dialogue}
              </p>
            )}
          </div>
        )
      }
    }

    return <p>{props.children}</p>
  },
  a(props) {
    const { href = '', children, ...rest } = props

    // Wikilink — resolve to an internal route via the manifest.
    if (href.startsWith(WIKILINK_PREFIX)) {
      const key = href.slice(WIKILINK_PREFIX.length)
      const route = routeForWikiKey(key)
      if (route) {
        return <Link to={route} className="text-[color:var(--color-accent)] border-b border-transparent hover:border-[color:var(--color-accent)]">{children}</Link>
      }
      // Unknown target — render as a "broken" wikilink with a tooltip-friendly title
      return <span className="text-[color:var(--color-ink-faint)] underline decoration-dotted cursor-help" title={`No vault entry for [[${key}]]`}>{children}</span>
    }

    // Internal site links → react-router Link
    if (href.startsWith('/')) {
      return <Link to={href} className="text-[color:var(--color-accent)] border-b border-transparent hover:border-[color:var(--color-accent)]">{children}</Link>
    }

    // External — open in new tab
    return (
      <a href={href} target="_blank" rel="noreferrer noopener" {...rest} className="text-[color:var(--color-accent)] border-b border-transparent hover:border-[color:var(--color-accent)]">
        {children}
      </a>
    )
  },
}

export function Prose({ children }: { children: string }) {
  return (
    <div className="prose-body">
      <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  )
}

/** Inline variant — for one-line markdown snippets that should not introduce a `<p>`. */
export function ProseInline({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins}
      components={{ ...components, p: ({ children }) => <span>{children}</span> }}
    >
      {children}
    </ReactMarkdown>
  )
}
