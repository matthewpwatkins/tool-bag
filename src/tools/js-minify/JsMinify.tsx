import { useState, useCallback } from 'react'
import { Play } from 'lucide-react'
import { minify } from 'terser'
import { useRunShortcut } from '@/hooks/useRunShortcut'
import { CodeEditor } from '@/components/editor/CodeEditor'
import { FileIOBar } from '@/components/editor/FileIOBar'
import { DualPanelLayout } from '@/components/layout/DualPanelLayout'
import { Button } from '@/components/ui/button'

export default function JsMinify() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const run = useCallback(async () => {
    setError('')
    if (!input.trim()) return
    try {
      const result = await minify(input, { compress: true, mangle: true })
      setOutput(result.code ?? '')
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
            <FileIOBar label="Input JS" value={input} onLoad={setInput} accept=".js,.ts,.mjs" />
            <div className="flex-1">
              <CodeEditor value={input} onChange={setInput} language="javascript" />
            </div>
          </>
        }
        right={
          <>
            <FileIOBar
              label="Output"
              value={output}
              downloadFilename="minified.js"
              downloadMime="text/javascript"
              showDownload
            />
            <div className="flex-1">
              <CodeEditor value={output} language="javascript" readOnly />
            </div>
          </>
        }
      />
    </div>
  )
}
