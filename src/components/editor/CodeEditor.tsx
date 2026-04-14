import Editor, { type OnMount } from '@monaco-editor/react'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Monaco } from '@monaco-editor/react'
// Reuse Monaco's built-in JSON tokenizer with comment support enabled.
// This gives identical token scopes (string.key.json, string.value.json, etc.)
// and therefore identical VS Code theme colors.
import { createTokenizationSupport } from 'monaco-editor/esm/vs/language/json/tokenization.js'

let jsoncRegistered = false
function ensureJsoncLanguage(monaco: Monaco) {
  if (jsoncRegistered) return
  jsoncRegistered = true
  monaco.languages.register({ id: 'jsonc' })
  monaco.languages.setTokensProvider('jsonc', createTokenizationSupport(true))
}

interface CodeEditorProps {
  value: string
  onChange?: (value: string) => void
  language?: string
  readOnly?: boolean
  minHeight?: string
  onMount?: OnMount
  /** Rendered as a VS Code–style status bar below the editor */
  footer?: ReactNode
}

export function CodeEditor({
  value,
  onChange,
  language = 'plaintext',
  readOnly = false,
  minHeight = '200px',
  onMount,
  footer,
}: CodeEditorProps) {
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains('dark')
  )

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="flex flex-col h-full w-full overflow-hidden" style={{ minHeight }}>
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={language}
          value={value}
          theme={isDark ? 'vs-dark' : 'vs'}
          onChange={v => onChange?.(v ?? '')}
          onMount={onMount}
          beforeMount={monaco => {
            ensureJsoncLanguage(monaco)
            monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
              target: monaco.languages.typescript.ScriptTarget.ES2020,
              allowNonTsExtensions: true,
              noEmit: false,
              strict: false,
            })
          }}
          options={{
            readOnly,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 13,
            lineNumbers: 'on',
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
            padding: { top: 8, bottom: 8 },
            renderWhitespace: 'none',
            fixedOverflowWidgets: true,
            scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
          }}
        />
      </div>
      {footer && (
        <div
          className="flex h-[22px] shrink-0 items-center overflow-hidden text-[12px] text-white"
          style={{ backgroundColor: '#007acc' }}
        >
          {footer}
        </div>
      )}
    </div>
  )
}
