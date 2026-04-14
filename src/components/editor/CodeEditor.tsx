import Editor, { type OnMount } from '@monaco-editor/react'
import { useEffect, useState } from 'react'

interface CodeEditorProps {
  value: string
  onChange?: (value: string) => void
  language?: string
  readOnly?: boolean
  minHeight?: string
  onMount?: OnMount
}

export function CodeEditor({
  value,
  onChange,
  language = 'plaintext',
  readOnly = false,
  minHeight = '200px',
  onMount,
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
    <div className="h-full w-full overflow-hidden" style={{ minHeight }}>
      <Editor
        height="100%"
        language={language}
        value={value}
        theme={isDark ? 'vs-dark' : 'vs'}
        onChange={v => onChange?.(v ?? '')}
        onMount={onMount}
        beforeMount={monaco => {
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
  )
}
