import { useState, useCallback, useRef } from 'react'
import { marked } from 'marked'
import { CheckSquare, AlertTriangle, Info } from 'lucide-react'
import { lint } from 'markdownlint/sync'
import type { editor as monacoEditor } from 'monaco-editor'
import type { Monaco } from '@monaco-editor/react'
import { CodeEditor } from '@/components/editor/CodeEditor'
import { FileIOBar } from '@/components/editor/FileIOBar'
import { DualPanelLayout } from '@/components/layout/DualPanelLayout'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { useToolPrefs } from '@/hooks/useToolPrefs'
import { useFileIO } from '@/hooks/useFileIO'
import { useMenubarActions } from '@/hooks/useMenubarActions'

marked.setOptions({ async: false })

interface LintResult {
  lineNumber: number
  ruleNames: string[]
  ruleDescription: string
  errorDetail: string | null
}

const DEFAULT_INPUT = `# Star Wars: A New Hope

> "A long time ago in a galaxy far, far away..."

## Synopsis

The **Galactic Empire** has constructed a planet-destroying superweapon known as the *Death Star*. Princess Leia intercepts the plans and hides them in the droid **R2-D2** before her ship is captured by Darth Vader.

## Main Characters

| Character | Affiliation | Species |
|-----------|-------------|---------|
| Luke Skywalker | Rebel Alliance | Human |
| Han Solo | Rebel Alliance | Human |
| Princess Leia | Rebel Alliance | Human |
| Darth Vader | Galactic Empire | Human (Cyborg) |
| Obi-Wan Kenobi | Jedi Order | Human |
| Chewbacca | Rebel Alliance | Wookiee |

## The Force

Those who are sensitive to the Force can:

- **Sense** events and emotions from afar
- **Move** objects with their mind (telekinesis)
- **Influence** the weak-minded (Jedi mind trick)
- **Accelerate** healing and physical ability

## Memorable Quotes

1. "May the Force be with you." — General Dodonna
2. "Use the Force, Luke." — Obi-Wan Kenobi
3. "I find your lack of faith disturbing." — Darth Vader
4. "Do or do not. There is no try." — Yoda

## Kessel Run

Han Solo famously made the Kessel Run in \`12 parsecs\`. The route required navigating near the Maw cluster of black holes, and a shorter path meant a faster time — it was a test of *nerve*, not speed.

\`\`\`
Distance: 12 parsecs
Ship: Millennium Falcon
Pilot: Han Solo
Copilot: Chewbacca
\`\`\`
`

export default function MarkdownEditor() {
  const [input, setInput] = useState(DEFAULT_INPUT)
  const [lintResults, setLintResults] = useState<LintResult[] | null>(null)
  const editorRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const { panelMode, setPanelMode } = useToolPrefs('markdown-editor')
  const { openFile, downloadFile, copyToClipboard } = useFileIO()

  const html = marked(input) as string

  const runLint = useCallback(() => {
    const results = lint({ strings: { content: input }, config: { default: true } })
    const issues: LintResult[] = (results['content'] ?? []).map(r => ({
      lineNumber: r.lineNumber,
      ruleNames: r.ruleNames,
      ruleDescription: r.ruleDescription,
      errorDetail: r.errorDetail,
    }))
    setLintResults(issues)
    if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel()
      if (model) {
        const markers = issues.map(r => ({
          severity: monacoRef.current!.MarkerSeverity.Warning,
          message: `${r.ruleNames[0]}: ${r.ruleDescription}${r.errorDetail ? ` — ${r.errorDetail}` : ''}`,
          startLineNumber: r.lineNumber,
          endLineNumber: r.lineNumber,
          startColumn: 1,
          endColumn: model.getLineLength(r.lineNumber) + 1,
        }))
        monacoRef.current.editor.setModelMarkers(model, 'markdownlint', markers)
      }
    }
  }, [input])

  const clearLint = useCallback(() => {
    setLintResults(null)
    if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel()
      if (model) monacoRef.current.editor.setModelMarkers(model, 'markdownlint', [])
    }
  }, [])

  const handleOpen = useCallback(async () => {
    try {
      const text = await openFile('.md,.markdown,.txt')
      setInput(text)
      clearLint()
    } catch { /* cancelled */ }
  }, [openFile, clearLint])

  const handleSave = useCallback(() => {
    downloadFile(input, 'document.md', 'text/markdown')
  }, [downloadFile, input])

  const handleCopy = useCallback(async () => {
    await copyToClipboard(input)
  }, [copyToClipboard, input])

  useMenubarActions({
    fileOpen: handleOpen,
    fileSave: handleSave,
    fileSaveDisabled: !input,
    editCopy: handleCopy,
    editCopyDisabled: !input,
    panelMode,
    onPanelModeChange: setPanelMode,
  })

  const lintBadge = lintResults !== null
    ? <span className="text-[11px] text-muted-foreground">
        {lintResults.length === 0 ? '✓ OK' : `${lintResults.length} issues`}
      </span>
    : null

  const editorPanel = (
    <>
      <FileIOBar
        label="Markdown"
        actions={
          <div className="flex items-center gap-1.5">
            {lintBadge}
            <Button
              size="sm"
              variant="outline"
              onClick={lintResults !== null ? clearLint : runLint}
              className="h-6 px-2 text-xs gap-1"
            >
              <CheckSquare className="h-3 w-3" />
              {lintResults !== null ? 'Clear' : 'Lint'}
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-hidden">
        <CodeEditor
          value={input}
          onChange={v => { setInput(v); if (lintResults !== null) clearLint() }}
          language="markdown"
          onMount={(e, m) => {
            editorRef.current = e
            monacoRef.current = m
          }}
        />
      </div>
    </>
  )

  const previewPanel = (
    <>
      <FileIOBar label="Preview" />
      <div className="flex-1 overflow-auto p-6">
        <div
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </>
  )

  const mainContent = panelMode === 'single'
    ? <div className="flex flex-col h-full">{editorPanel}</div>
    : <DualPanelLayout
        left={<div className="flex flex-col h-full">{editorPanel}</div>}
        right={previewPanel}
      />

  // Lint diagnostics panel
  if (lintResults !== null && lintResults.length > 0) {
    return (
      <ResizablePanelGroup direction="vertical" className="h-full">
        <ResizablePanel defaultSize={75} minSize={40}>
          {mainContent}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={25} minSize={10}>
          <div className="flex flex-col h-full">
            <FileIOBar label="Problems" />
            <ScrollArea className="flex-1">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-3 py-1.5 text-left font-medium text-muted-foreground w-12">Line</th>
                    <th className="px-3 py-1.5 text-left font-medium text-muted-foreground w-20">Rule</th>
                    <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {lintResults.map((r, i) => (
                    <tr
                      key={i}
                      className="border-b border-border/50 hover:bg-muted/20 cursor-pointer"
                      onClick={() => {
                        editorRef.current?.revealLineInCenter(r.lineNumber)
                        editorRef.current?.setPosition({ lineNumber: r.lineNumber, column: 1 })
                        editorRef.current?.focus()
                      }}
                    >
                      <td className="px-3 py-1 text-muted-foreground font-mono">{r.lineNumber}</td>
                      <td className="px-3 py-1">
                        <span className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded">
                          {r.ruleNames[0]}
                        </span>
                      </td>
                      <td className="px-3 py-1">
                        <div className="flex items-start gap-1.5">
                          <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5 shrink-0" />
                          <span>
                            {r.ruleDescription}
                            {r.errorDetail && <span className="text-muted-foreground"> — {r.errorDetail}</span>}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }

  if (lintResults !== null && lintResults.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-muted/20 text-xs shrink-0">
          <Info className="h-3.5 w-3.5 text-green-500" />
          <span className="text-green-600 dark:text-green-400">No issues found</span>
        </div>
        {mainContent}
      </div>
    )
  }

  return mainContent
}
