import { useState, useCallback, useRef, useEffect } from 'react'
import { Play, Trash2 } from 'lucide-react'
import type { editor as monacoEditor } from 'monaco-editor'
import type { Monaco } from '@monaco-editor/react'
import yaml from 'js-yaml'
import { XMLParser, XMLBuilder } from 'fast-xml-parser'
import { parseJsonc } from '@/lib/jsonc'
import { CodeEditor } from '@/components/editor/CodeEditor'
import { FileIOBar } from '@/components/editor/FileIOBar'
import { StatusBarSelect } from '@/components/editor/StatusBarSelect'
import { TriplePanelLayout } from '@/components/layout/TriplePanelLayout'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useFileIO } from '@/hooks/useFileIO'
import { useMenubarActions } from '@/hooks/useMenubarActions'

type InputFormat = 'json' | 'yaml' | 'xml'
type OutputFormat = 'json' | 'yaml' | 'xml'
type CodeLang = 'typescript' | 'javascript'

const INPUT_FORMAT_OPTIONS = [['json', 'JSON'], ['yaml', 'YAML'], ['xml', 'XML']] as const
const OUTPUT_FORMAT_OPTIONS = [['json', 'JSON'], ['yaml', 'YAML'], ['xml', 'XML']] as const
const LANG_OPTIONS = [['typescript', 'TypeScript'], ['javascript', 'JavaScript']] as const

const DEFAULT_INPUT = JSON.stringify([
  { name: 'Luke Skywalker', side: 'light', species: 'Human', homeworld: 'Tatooine', midichlorians: 20000 },
  { name: 'Darth Vader', side: 'dark', species: 'Human', homeworld: 'Tatooine', midichlorians: 27000 },
  { name: 'Han Solo', side: 'light', species: 'Human', homeworld: 'Corellia', midichlorians: null },
  { name: 'Princess Leia', side: 'light', species: 'Human', homeworld: 'Alderaan', midichlorians: 14500 },
  { name: 'Yoda', side: 'light', species: 'Jedi Master', homeworld: 'Dagobah', midichlorians: 17700 },
  { name: 'Darth Sidious', side: 'dark', species: 'Human', homeworld: 'Naboo', midichlorians: 20000 },
  { name: 'Obi-Wan Kenobi', side: 'light', species: 'Human', homeworld: 'Stewjon', midichlorians: 13400 },
  { name: 'Anakin Skywalker', side: 'light', species: 'Human', homeworld: 'Tatooine', midichlorians: 27000 },
], null, 2)

const DEFAULT_TRANSFORM = `// Group characters by side and rank by midichlorian count.
// The 'data' variable holds your parsed input. Return any value.
function transform(data) {
  const grouped = {};

  for (const char of data) {
    if (!grouped[char.side]) grouped[char.side] = [];
    grouped[char.side].push({
      name: char.name,
      midichlorians: char.midichlorians ?? 'unknown',
    });
  }

  for (const side in grouped) {
    grouped[side].sort((a, b) => {
      const av = typeof a.midichlorians === 'number' ? a.midichlorians : -1;
      const bv = typeof b.midichlorians === 'number' ? b.midichlorians : -1;
      return bv - av;
    });
  }

  return grouped;
}
`

interface LogEntry { type: 'log' | 'warn' | 'error'; args: string }

// Serialise a value safely for postMessage across the worker boundary
function toSerializable(v: unknown): unknown {
  try { JSON.stringify(v); return v } catch { return String(v) }
}

function parseInput(raw: string, format: InputFormat): unknown {
  switch (format) {
    case 'json': return parseJsonc(raw)
    case 'yaml': return yaml.load(raw)
    case 'xml': { const p = new XMLParser({ ignoreAttributes: false }); return p.parse(raw) }
  }
}

function stringifyOutput(value: unknown, format: OutputFormat): string {
  switch (format) {
    case 'json': return JSON.stringify(value, null, 2)
    case 'yaml': return yaml.dump(value, { indent: 2 })
    case 'xml': {
      const b = new XMLBuilder({ ignoreAttributes: false, format: true })
      return b.build(value)
    }
  }
}

// Inline worker source. Receives { code, data }, posts { type, … } messages back.
const WORKER_SRC = `
  function safeStr(v) {
    if (typeof v === 'string') return v;
    try { return JSON.stringify(v, null, 2); } catch { return String(v); }
  }
  const fakeConsole = {
    log:   (...a) => self.postMessage({ type: 'log',   args: a.map(safeStr).join(' ') }),
    warn:  (...a) => self.postMessage({ type: 'warn',  args: a.map(safeStr).join(' ') }),
    error: (...a) => self.postMessage({ type: 'error', args: a.map(safeStr).join(' ') }),
    info:  (...a) => self.postMessage({ type: 'log',   args: a.map(safeStr).join(' ') }),
  };
  self.onmessage = function(e) {
    const { code, data } = e.data;
    try {
      var fn = new Function('data', 'console', code + '\\nreturn transform(data);');
      var result = fn(data, fakeConsole);
      self.postMessage({ type: 'result', result: result });
    } catch(err) {
      self.postMessage({ type: 'runtimeError', message: err.message });
    }
  };
`

const TIMEOUT_MS = 5000

interface WorkerResult {
  result?: unknown
  logs: LogEntry[]
  error?: string
}

function runInWorker(jsCode: string, data: unknown): Promise<WorkerResult> {
  return new Promise(resolve => {
    const blob = new Blob([WORKER_SRC], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)
    const worker = new Worker(url)
    const logs: LogEntry[] = []
    let done = false

    const finish = (outcome: WorkerResult) => {
      if (done) return
      done = true
      clearTimeout(timer)
      worker.terminate()
      URL.revokeObjectURL(url)
      resolve(outcome)
    }

    const timer = setTimeout(() => {
      finish({ logs, error: `Timed out after ${TIMEOUT_MS / 1000}s — possible infinite loop` })
    }, TIMEOUT_MS)

    worker.onmessage = e => {
      const msg = e.data as { type: string; args?: string; result?: unknown; message?: string }
      if (msg.type === 'log' || msg.type === 'warn' || msg.type === 'error') {
        logs.push({ type: msg.type as LogEntry['type'], args: msg.args ?? '' })
      } else if (msg.type === 'result') {
        finish({ result: msg.result, logs })
      } else if (msg.type === 'runtimeError') {
        finish({ logs, error: msg.message })
      }
    }

    worker.onerror = e => finish({ logs, error: e.message ?? 'Worker error' })
    worker.postMessage({ code: jsCode, data: toSerializable(data) })
  })
}

export default function JsTransform() {
  const [input, setInput] = useState(DEFAULT_INPUT)
  const [code, setCode] = useState(DEFAULT_TRANSFORM)
  const [output, setOutput] = useState('')
  const [inputFormat, setInputFormat] = useState<InputFormat>('json')
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('json')
  const [codeLang, setCodeLang] = useState<CodeLang>('javascript')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [error, setError] = useState('')
  const [running, setRunning] = useState(false)
  const editorRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const didAutoRun = useRef(false)
  const { downloadFile, copyToClipboard } = useFileIO()

  const run = useCallback(async () => {
    setError('')
    setLogs([])
    setRunning(true)

    try {
      const data = input.trim() ? parseInput(input, inputFormat) : undefined

      // Compile TypeScript → JavaScript via Monaco's built-in TS worker
      let jsCode = code
      if (codeLang === 'typescript' && editorRef.current && monacoRef.current) {
        try {
          const model = editorRef.current.getModel()
          if (model) {
            const getWorker = await monacoRef.current.languages.typescript.getTypeScriptWorker()
            const worker = await getWorker(model.uri)
            const emitOutput = await worker.getEmitOutput(model.uri.toString())
            if (emitOutput.outputFiles.length > 0) jsCode = emitOutput.outputFiles[0].text
          }
        } catch { /* fall back to treating as plain JS */ }
      }

      const { result, logs: workerLogs, error: workerError } = await runInWorker(jsCode, data)
      setLogs(workerLogs)

      if (workerError) {
        setError(workerError)
        setOutput('')
      } else if (result !== undefined) {
        setOutput(stringifyOutput(result, outputFormat))
      } else {
        setOutput('')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setRunning(false)
    }
  }, [input, code, inputFormat, outputFormat, codeLang])

  // Auto-run on mount
  useEffect(() => {
    if (!didAutoRun.current) {
      didAutoRun.current = true
      const timer = setTimeout(() => run(), 300)
      return () => clearTimeout(timer)
    }
  }, [run])

  // Re-stringify existing result when output format changes (no re-run needed)
  const prevOutputRef = useRef<unknown>(undefined)
  const handleOutputFormatChange = useCallback((fmt: string) => {
    setOutputFormat(fmt as OutputFormat)
    if (prevOutputRef.current !== undefined) {
      try { setOutput(stringifyOutput(prevOutputRef.current, fmt as OutputFormat)) } catch { /* noop */ }
    }
  }, [])

  // Keep a reference to the last result value so we can reformat without re-running
  useEffect(() => {
    if (!output) { prevOutputRef.current = undefined; return }
    try { prevOutputRef.current = JSON.parse(output) } catch { /* not JSON; leave as-is */ }
  }, [output])

  const handleSave = useCallback(() => {
    const ext = outputFormat === 'json' ? 'json' : outputFormat === 'yaml' ? 'yaml' : 'xml'
    downloadFile(output, `output.${ext}`, 'text/plain')
  }, [downloadFile, output, outputFormat])

  const handleCopy = useCallback(async () => {
    await copyToClipboard(output)
  }, [copyToClipboard, output])

  useMenubarActions({
    fileSave: handleSave,
    fileSaveDisabled: !output,
    editCopy: handleCopy,
    editCopyDisabled: !output,
  })

  const consolePanel = (
    <div className="flex flex-col h-full">
      <FileIOBar
        label="Console"
        actions={
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setLogs([])} title="Clear">
            <Trash2 className="h-3 w-3" />
          </Button>
        }
      />
      <ScrollArea className="flex-1 font-mono text-xs p-2">
        {logs.length === 0 && !error ? (
          <span className="text-muted-foreground">No output yet.</span>
        ) : (
          <>
            {error && <div className="text-destructive mb-1">Error: {error}</div>}
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
      <TriplePanelLayout
        left={
          <>
            <FileIOBar label="Input Data" />
            <div className="flex-1 overflow-hidden">
              <CodeEditor
                value={input}
                onChange={setInput}
                language={inputFormat === 'yaml' ? 'yaml' : inputFormat === 'xml' ? 'xml' : 'jsonc'}
                footer={
                  <StatusBarSelect
                    value={inputFormat}
                    options={INPUT_FORMAT_OPTIONS}
                    onChange={v => setInputFormat(v as InputFormat)}
                  />
                }
              />
            </div>
          </>
        }
        center={
          <>
            <FileIOBar
              label="Transform"
              actions={
                <Button
                  size="sm"
                  onClick={run}
                  disabled={running}
                  className="h-6 px-2 text-xs gap-1"
                >
                  <Play className="h-3 w-3" />
                  {running ? 'Running…' : 'Run'}
                </Button>
              }
            />
            <div className="flex-1 overflow-hidden">
              <CodeEditor
                value={code}
                onChange={setCode}
                language={codeLang}
                onMount={(editor, monaco) => {
                  editorRef.current = editor
                  monacoRef.current = monaco
                }}
                footer={
                  <StatusBarSelect
                    value={codeLang}
                    options={LANG_OPTIONS}
                    onChange={v => setCodeLang(v as CodeLang)}
                  />
                }
              />
            </div>
          </>
        }
        right={
          <>
            <FileIOBar label="Output" />
            <div className="flex-1 overflow-hidden">
              <CodeEditor
                value={output}
                language={outputFormat === 'yaml' ? 'yaml' : outputFormat === 'xml' ? 'xml' : 'json'}
                readOnly
                footer={
                  <StatusBarSelect
                    value={outputFormat}
                    options={OUTPUT_FORMAT_OPTIONS}
                    onChange={handleOutputFormatChange}
                  />
                }
              />
            </div>
          </>
        }
        console={consolePanel}
        consoleExpanded={!!error}
      />
    </div>
  )
}
