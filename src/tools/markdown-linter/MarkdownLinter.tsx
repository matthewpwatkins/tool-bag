import { useState, useCallback } from 'react'
import { Play, AlertTriangle, Info } from 'lucide-react'
import { lint } from 'markdownlint/sync'
import { useRunShortcut } from '@/hooks/useRunShortcut'
import { CodeEditor } from '@/components/editor/CodeEditor'
import { FileIOBar } from '@/components/editor/FileIOBar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'

interface LintResult {
  lineNumber: number
  ruleNames: string[]
  ruleDescription: string
  errorDetail: string | null
}

export default function MarkdownLinter() {
  const [input, setInput] = useState('')
  const [results, setResults] = useState<LintResult[] | null>(null)

  const run = useCallback(() => {
    if (!input.trim()) { setResults([]); return }
    const lintResults = lint({
      strings: { content: input },
      config: { default: true },
    })
    const issues: LintResult[] = (lintResults['content'] ?? []).map(r => ({
      lineNumber: r.lineNumber,
      ruleNames: r.ruleNames,
      ruleDescription: r.ruleDescription,
      errorDetail: r.errorDetail,
    }))
    setResults(issues)
  }, [input])

  useRunShortcut(run)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-background shrink-0">
        <Button size="sm" onClick={run} className="gap-1.5">
          <Play className="h-3.5 w-3.5" />
          Lint
        </Button>
        <span className="text-xs text-muted-foreground">Ctrl+Enter</span>
        {results !== null && (
          <span className="text-xs text-muted-foreground ml-2">
            {results.length === 0 ? '✓ No issues' : `${results.length} issue${results.length === 1 ? '' : 's'}`}
          </span>
        )}
      </div>
      <ResizablePanelGroup direction="vertical" className="flex-1">
        <ResizablePanel defaultSize={65} minSize={30}>
          <div className="flex flex-col h-full">
            <FileIOBar label="Markdown" value={input} onLoad={setInput} accept=".md,.markdown,.txt" showDownload={false} />
            <div className="flex-1">
              <CodeEditor value={input} onChange={setInput} language="markdown" />
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={35} minSize={15}>
          <div className="flex flex-col h-full">
            <div className="flex items-center border-b border-border bg-muted/40 px-3 py-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Results</span>
            </div>
            <ScrollArea className="flex-1">
              {results === null ? (
                <p className="p-4 text-xs text-muted-foreground">Click Lint to check your markdown.</p>
              ) : results.length === 0 ? (
                <div className="flex items-center gap-2 p-4">
                  <Info className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 dark:text-green-400">No issues found</span>
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground w-12">Line</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground w-24">Rule</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="px-3 py-1.5 text-muted-foreground font-mono">{r.lineNumber}</td>
                        <td className="px-3 py-1.5">
                          <span className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded">
                            {r.ruleNames[0]}
                          </span>
                        </td>
                        <td className="px-3 py-1.5">
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
              )}
            </ScrollArea>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
