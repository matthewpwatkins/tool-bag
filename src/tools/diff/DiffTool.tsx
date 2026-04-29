import { useState, useEffect } from 'react'
import { Play, Pencil } from 'lucide-react'
import { DiffEditor } from '@monaco-editor/react'
import { CodeEditor } from '@/components/editor/CodeEditor'
import { FileIOBar } from '@/components/editor/FileIOBar'
import { DualPanelLayout } from '@/components/layout/DualPanelLayout'
import { Button } from '@/components/ui/button'
import { StatusBarSelect } from '@/components/editor/StatusBarSelect'

const LANGUAGES = [
  ['plaintext', 'Plain Text'],
  ['javascript', 'JavaScript'],
  ['typescript', 'TypeScript'],
  ['python', 'Python'],
  ['json', 'JSON'],
  ['jsonc', 'JSONC'],
  ['css', 'CSS'],
  ['html', 'HTML'],
  ['markdown', 'Markdown'],
  ['sql', 'SQL'],
  ['yaml', 'YAML'],
  ['xml', 'XML'],
  ['shell', 'Shell'],
] as const satisfies readonly (readonly [string, string])[]

export default function DiffTool() {
  const [before, setBefore] = useState('')
  const [after, setAfter] = useState('')
  const [language, setLanguage] = useState('plaintext')
  const [showDiff, setShowDiff] = useState(false)
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains('dark')
  )

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const langSelect = (
    <StatusBarSelect value={language} options={LANGUAGES} onChange={setLanguage} />
  )

  if (showDiff) {
    return (
      <div className="flex flex-col h-full">
        <FileIOBar
          label="Diff"
          actions={
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDiff(false)}
                className="h-6 px-2 text-xs gap-1"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </Button>
            </div>
          }
        />
        <div className="flex-1 overflow-hidden">
          <DiffEditor
            height="100%"
            language={language}
            original={before}
            modified={after}
            theme={isDark ? 'vs-dark' : 'vs'}
            options={{
              readOnly: false,
              originalEditable: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 13,
              wordWrap: 'on',
              renderSideBySide: true,
              padding: { top: 8, bottom: 8 },
              scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <DualPanelLayout
      left={
        <>
          <FileIOBar label="Before" />
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              value={before}
              onChange={setBefore}
              language={language}
              footer={langSelect}
            />
          </div>
        </>
      }
      right={
        <>
          <FileIOBar
            label="After"
            actions={
              <Button
                size="sm"
                onClick={() => setShowDiff(true)}
                className="h-6 px-2 text-xs gap-1"
              >
                <Play className="h-3 w-3" />
                Diff
              </Button>
            }
          />
          <div className="flex-1 overflow-hidden">
            <CodeEditor value={after} onChange={setAfter} language={language} />
          </div>
        </>
      }
    />
  )
}
