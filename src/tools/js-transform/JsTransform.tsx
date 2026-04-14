import { useState, useCallback, useRef, useEffect } from 'react'
import { Play, Trash2 } from 'lucide-react'
import type { editor as monacoEditor } from 'monaco-editor'
import type { Monaco } from '@monaco-editor/react'
import yaml from 'js-yaml'
import { XMLParser } from 'fast-xml-parser'
import { CodeEditor } from '@/components/editor/CodeEditor'
import { FileIOBar } from '@/components/editor/FileIOBar'
import { StatusBarSelect } from '@/components/editor/StatusBarSelect'
import { TriplePanelLayout } from '@/components/layout/TriplePanelLayout'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useFileIO } from '@/hooks/useFileIO'
import { useMenubarActions } from '@/hooks/useMenubarActions'

type InputFormat = 'json' | 'yaml' | 'xml'
type CodeLang = 'typescript' | 'javascript'

const FORMAT_OPTIONS = [['json', 'JSON'], ['yaml', 'YAML'], ['xml', 'XML']] as const
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

const DEFAULT_TRANSFORM = `// Group Force users by side and sort by midichlorian count
function transform(data: { name: string; side: string; midichlorians: number | null }[]) {
  const result: Record<string, { name: string; midichlorians: number | string }[]> = {};

  for (const char of data) {
    if (!result[char.side]) result[char.side] = [];
    result[char.side].push({
      name: char.name,
      midichlorians: char.midichlorians ?? 'unknown',
    });
  }

  // Sort each group descending by midichlorian count
  for (const side in result) {
    result[side].sort((a, b) => {
      const av = typeof a.midichlorians === 'number' ? a.midichlorians : 0;
      const bv = typeof b.midichlorians === 'number' ? b.midichlorians : 0;
      return bv - av;
    });
  }

  return result;
}
`

interface LogEntry { type: 'log' | 'error' | 'warn'; args: string }

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

function formatArg(a: unknown): string {
  if (typeof a === 'string') return a
  try { return JSON.stringify(a, null, 2) } catch { return String(a) }
}

export default function JsTransform() {
  const [input, setInput] = useState(DEFAULT_INPUT)
  const [code, setCode] = useState(DEFAULT_TRANSFORM)
  const [output, setOutput] = useState('')
  const [format, setFormat] = useState<InputFormat>('json')
  const [codeLang, setCodeLang] = useState<CodeLang>('typescript')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [error, setError] = useState('')
  const editorRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const logsRef = useRef<LogEntry[]>([])
  const didAutoRun = useRef(false)
  const { openFile, downloadFile, copyToClipboard } = useFileIO()

  const run = useCallback(async () => {
    setError('')
    logsRef.current = []
    setLogs([])

    const capturedConsole = {
      log: (...args: unknown[]) => { logsRef.current.push({ type: 'log', args: args.map(formatArg).join(' ') }) },
      warn: (...args: unknown[]) => { logsRef.current.push({ type: 'warn', args: args.map(formatArg).join(' ') }) },
      error: (...args: unknown[]) => { logsRef.current.push({ type: 'error', args: args.map(formatArg).join(' ') }) },
    }

    try {
      const data = input.trim() ? parseInput(input, format) : undefined

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
        } catch { /* fall back to plain JS */ }
      }

      // eslint-disable-next-line no-new-func
      const fn = new Function('data', 'console', `${jsCode}\nreturn transform(data);`)
      const result = fn(data, capturedConsole)
      setOutput(result === undefined ? '' : JSON.stringify(result, null, 2))
      setLogs([...logsRef.current])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setLogs([...logsRef.current])
    }
  }, [input, code, format, codeLang])

  useEffect(() => {
    if (!didAutoRun.current) {
      didAutoRun.current = true
      const timer = setTimeout(() => { run() }, 300)
      return () => clearTimeout(timer)
    }
  }, [run])

  const handleOpenData = useCallback(async () => {
    try {
      const text = await openFile('.json,.yaml,.yml,.xml')
      setInput(text)
    } catch { /* cancelled */ }
  }, [openFile])

  const handleSave = useCallback(() => {
    downloadFile(output, 'output.json', 'application/json')
  }, [downloadFile, output])

  const handleCopy = useCallback(async () => {
    await copyToClipboard(output)
  }, [copyToClipboard, output])

  useMenubarActions({
    fileOpen: handleOpenData,
    fileOpenAccept: '.json,.yaml,.yml,.xml',
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
    <TriplePanelLayout
      left={
        <>
          <FileIOBar label="Input Data" />
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              value={input}
              onChange={setInput}
              language={format === 'yaml' ? 'yaml' : format === 'xml' ? 'xml' : 'json'}
              footer={
                <StatusBarSelect
                  value={format}
                  options={FORMAT_OPTIONS}
                  onChange={v => setFormat(v as InputFormat)}
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
              <Button size="sm" onClick={run} className="h-6 px-2 text-xs gap-1">
                <Play className="h-3 w-3" />
                Run
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
            <CodeEditor value={output} language="json" readOnly />
          </div>
        </>
      }
      console={consolePanel}
    />
  )
}
