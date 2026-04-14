import { useState, useCallback } from 'react'
import { Play } from 'lucide-react'
import { useRunShortcut } from '@/hooks/useRunShortcut'
import { CodeEditor } from '@/components/editor/CodeEditor'
import { FileIOBar } from '@/components/editor/FileIOBar'
import { DualPanelLayout } from '@/components/layout/DualPanelLayout'
import { Button } from '@/components/ui/button'

export default function JsonMinify() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const run = useCallback(() => {
    setError('')
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setOutput('')
    }
  }, [input])

  useRunShortcut(run)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-background shrink-0">
        <Button size="sm" onClick={run} className="gap-1.5">
          <Play className="h-3.5 w-3.5" />
          Minify
        </Button>
        <span className="text-xs text-muted-foreground">Ctrl+Enter</span>
        {error && <span className="text-xs text-destructive ml-2">{error}</span>}
      </div>
      <DualPanelLayout
        left={
          <>
            <FileIOBar label="Input JSON" value={input} onLoad={setInput} accept=".json,application/json" />
            <div className="flex-1">
              <CodeEditor value={input} onChange={setInput} language="json" />
            </div>
          </>
        }
        right={
          <>
            <FileIOBar
              label="Output"
              value={output}
              downloadFilename="minified.json"
              downloadMime="application/json"
              showDownload
            />
            <div className="flex-1">
              <CodeEditor value={output} language="json" readOnly />
            </div>
          </>
        }
      />
    </div>
  )
}
