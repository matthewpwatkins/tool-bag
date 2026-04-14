import { useState, useCallback, useRef } from 'react'
import { marked } from 'marked'
import { CheckSquare, AlertTriangle, Info } from 'lucide-react'
import { lint } from 'markdownlint/sync'
import type { editor as monacoEditor } from 'monaco-editor'
import type { Monaco } from '@monaco-editor/react'
import { CodeEditor } from '@/components/editor/CodeEditor'
import { FileIOBar } from '@/components/editor/FileIOBar'
import { DualPanelLayout } from '@/components/layout/DualPanelLayout'
import { ToolToolbar } from '@/components/layout/ToolToolbar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { useToolPrefs } from '@/hooks/useToolPrefs'

marked.setOptions({ async: false })

interface LintResult {
  lineNumber: number
  ruleNames: string[]
  ruleDescription: string
  errorDetail: string | null
}

export default function MarkdownEditor() {
  const [input, setInput] = useState('# Hello\n\nStart typing your markdown here...\n')
  const [lintResults, setLintResults] = useState<LintResult[] | null>(null)
  const editorRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const { panelMode, setPanelMode } = useToolPrefs('markdown-editor')

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

    // Show inline Monaco markers
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

  function clearLint() {
    setLintResults(null)
    if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel()
      if (model) {
        monacoRef.current.editor.setModelMarkers(model, 'markdownlint', [])
      }
    }
  }

  const toolbar = (
    <ToolToolbar
      left={
        lintResults !== null && (
          <span className="text-xs text-muted-foreground">
            {lintResults.length === 0 ? '✓ No issues' : `${lintResults.length} lint issue${lintResults.length === 1 ? '' : 's'}`}
          </span>
        )
      }
      right={
        <Button size="sm" variant="outline" onClick={lintResults !== null ? clearLint : runLint} className="h-6 px-2 text-xs gap-1">
          <CheckSquare className="h-3 w-3" />
          {lintResults !== null ? 'Clear Lint' : 'Lint'}
        </Button>
      }
      panelMode={panelMode}
      onPanelModeChange={setPanelMode}
    />
  )

  const editorPanel = (
    <>
      <FileIOBar
        label="Markdown"
        value={input}
        onLoad={setInput}
        accept=".md,.markdown,.txt"
        downloadFilename="document.md"
        showDownload
      />
      <div className="flex-1">
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
      <div className="flex h-8 items-center border-b border-border px-2 shrink-0"
           style={{ background: 'hsl(var(--muted)/40%)' }}>
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Preview</span>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </>
  )

  // Build main content (editor + optional preview)
  const mainContent = panelMode === 'single'
    ? <div className="flex flex-col h-full">{editorPanel}</div>
    : <DualPanelLayout left={<div className="flex flex-col h-full">{editorPanel}</div>} right={previewPanel} />

  // If lint results exist, show a resizable diagnostics panel below
  if (lintResults !== null && lintResults.length > 0) {
    return (
      <div className="flex flex-col h-full">
        {toolbar}
        <ResizablePanelGroup direction="vertical" className="flex-1">
          <ResizablePanel defaultSize={75} minSize={40}>
            {mainContent}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={25} minSize={10}>
            <div className="flex flex-col h-full">
              <div className="flex h-8 items-center border-b border-border px-2 shrink-0"
                   style={{ background: 'hsl(var(--muted)/40%)' }}>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  Problems
                </span>
              </div>
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
                              {r.errorDetail && (
                                <span className="text-muted-foreground"> — {r.errorDetail}</span>
                              )}
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
      </div>
    )
  }

  // Lint passed (0 issues) — show a brief status row
  if (lintResults !== null && lintResults.length === 0) {
    return (
      <div className="flex flex-col h-full">
        {toolbar}
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-muted/20 text-xs shrink-0">
          <Info className="h-3.5 w-3.5 text-green-500" />
          <span className="text-green-600 dark:text-green-400">No issues found</span>
        </div>
        {mainContent}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {toolbar}
      {mainContent}
    </div>
  )
}
