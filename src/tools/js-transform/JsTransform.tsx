import { useState, useCallback, useRef } from 'react'
import { Play, Trash2 } from 'lucide-react'
import { useRunShortcut } from '@/hooks/useRunShortcut'
import yaml from 'js-yaml'
import { XMLParser } from 'fast-xml-parser'
import { CodeEditor } from '@/components/editor/CodeEditor'
import { FileIOBar } from '@/components/editor/FileIOBar'
import { TriplePanelLayout } from '@/components/layout/TriplePanelLayout'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'

type InputFormat = 'json' | 'yaml' | 'xml'

const DEFAULT_TRANSFORM = `// Transform function — receives \`data\` (parsed input) and \`console\`
// Return value becomes the output
function transform(data) {
  // Example: sort an array
  if (Array.isArray(data)) {
    return [...data].sort()
  }
  return data
}
`

interface LogEntry {
  type: 'log' | 'error' | 'warn'
  args: string
}

function parseInput(raw: string, format: InputFormat): unknown {
  switch (format) {
    case 'json': return JSON.parse(raw)
    case 'yaml': return yaml.load(raw)
    case 'xml': {
      const parser = new XMLParser({ ignoreAttributes: false })
      return parser.parse(raw)
    }
  }
}

export default function JsTransform() {
  const [input, setInput] = useState('')
  const [code, setCode] = useState(DEFAULT_TRANSFORM)
  const [output, setOutput] = useState('')
  const [format, setFormat] = useState<InputFormat>('json')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [error, setError] = useState('')
  const logsRef = useRef<LogEntry[]>([])

  const run = useCallback(() => {
    setError('')
    logsRef.current = []
    setLogs([])

    const capturedConsole = {
      log: (...args: unknown[]) => {
        logsRef.current.push({ type: 'log', args: args.map(a => JSON.stringify(a, null, 2)).join(' ') })
      },
      warn: (...args: unknown[]) => {
        logsRef.current.push({ type: 'warn', args: args.map(a => JSON.stringify(a, null, 2)).join(' ') })
      },
      error: (...args: unknown[]) => {
        logsRef.current.push({ type: 'error', args: args.map(a => JSON.stringify(a, null, 2)).join(' ') })
      },
    }

    try {
      const data = input.trim() ? parseInput(input, format) : undefined
      // Build function that calls the user's transform function
      const wrapped = `
        ${code}
        return transform(data);
      `
      // eslint-disable-next-line no-new-func
      const fn = new Function('data', 'console', wrapped)
      const result = fn(data, capturedConsole)
      setOutput(result === undefined ? '' : JSON.stringify(result, null, 2))
      setLogs([...logsRef.current])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setLogs([...logsRef.current])
    }
  }, [input, code, format])

  useRunShortcut(run)

  const consolePanel = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-1.5">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Console</span>
        <Button variant="ghost" size="sm" onClick={() => setLogs([])} title="Clear">
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      <ScrollArea className="flex-1 font-mono text-xs p-2">
        {logs.length === 0 && !error ? (
          <span className="text-muted-foreground">No output yet.</span>
        ) : (
          <>
            {error && (
              <div className="text-destructive mb-1">Error: {error}</div>
            )}
            {logs.map((l, i) => (
              <div
                key={i}
                className={
                  l.type === 'error' ? 'text-destructive' :
                  l.type === 'warn' ? 'text-yellow-500' :
                  'text-foreground'
                }
              >
                {l.args}
              </div>
            ))}
          </>
        )}
      </ScrollArea>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-background shrink-0 flex-wrap">
        <Select value={format} onValueChange={v => setFormat(v as InputFormat)}>
          <SelectTrigger className="w-24 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="yaml">YAML</SelectItem>
            <SelectItem value="xml">XML</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" onClick={run} className="gap-1.5">
          <Play className="h-3.5 w-3.5" />
          Run
        </Button>
        <span className="text-xs text-muted-foreground">Ctrl+Enter</span>
      </div>
      <TriplePanelLayout
        left={
          <>
            <FileIOBar label="Input Data" value={input} onLoad={setInput} accept=".json,.yaml,.yml,.xml" />
            <div className="flex-1">
              <CodeEditor value={input} onChange={setInput} language={format === 'yaml' ? 'yaml' : format === 'xml' ? 'xml' : 'json'} />
            </div>
          </>
        }
        center={
          <>
            <div className="flex items-center border-b border-border bg-muted/40 px-3 py-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Transform (JS)</span>
            </div>
            <div className="flex-1">
              <CodeEditor value={code} onChange={setCode} language="javascript" />
            </div>
          </>
        }
        right={
          <>
            <FileIOBar
              label="Output"
              value={output}
              downloadFilename="output.json"
              downloadMime="application/json"
              showDownload
            />
            <div className="flex-1">
              <CodeEditor value={output} language="json" readOnly />
            </div>
          </>
        }
        console={consolePanel}
      />
    </div>
  )
}
