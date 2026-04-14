import { useState, useCallback } from 'react'
import { Play } from 'lucide-react'
import { useRunShortcut } from '@/hooks/useRunShortcut'
import { vttToMarkdown } from './parser'
import { CodeEditor } from '@/components/editor/CodeEditor'
import { FileIOBar } from '@/components/editor/FileIOBar'
import { DualPanelLayout } from '@/components/layout/DualPanelLayout'
import { Button } from '@/components/ui/button'

export default function VttToMarkdown() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [includeTimestamps, setIncludeTimestamps] = useState(true)

  const run = useCallback(() => {
    setError('')
    if (!input.trim()) return
    try {
      const md = vttToMarkdown(input, { includeTimestamps })
      setOutput(md)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setOutput('')
    }
  }, [input, includeTimestamps])

  useRunShortcut(run)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-3 py-2 border-b border-border bg-background shrink-0 flex-wrap">
        <Button size="sm" onClick={run} className="gap-1.5">
          <Play className="h-3.5 w-3.5" />
          Convert
        </Button>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={includeTimestamps}
            onChange={e => setIncludeTimestamps(e.target.checked)}
            className="h-3.5 w-3.5"
          />
          Include timestamps
        </label>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
      <DualPanelLayout
        left={
          <>
            <FileIOBar label="Input VTT" value={input} onLoad={setInput} accept=".vtt,.txt" />
            <div className="flex-1">
              <CodeEditor value={input} onChange={setInput} language="plaintext" />
            </div>
          </>
        }
        right={
          <>
            <FileIOBar
              label="Output Markdown"
              value={output}
              downloadFilename="transcript.md"
              downloadMime="text/markdown"
              showDownload
            />
            <div className="flex-1">
              <CodeEditor value={output} language="markdown" readOnly />
            </div>
          </>
        }
      />
    </div>
  )
}
