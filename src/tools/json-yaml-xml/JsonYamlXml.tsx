import { useState, useCallback, useEffect, useRef } from 'react'
import { Play } from 'lucide-react'
import yaml from 'js-yaml'
import { XMLParser, XMLBuilder } from 'fast-xml-parser'
import { CodeEditor } from '@/components/editor/CodeEditor'
import { FileIOBar } from '@/components/editor/FileIOBar'
import { StatusBarSelect } from '@/components/editor/StatusBarSelect'
import { DualPanelLayout } from '@/components/layout/DualPanelLayout'
import { Button } from '@/components/ui/button'
import { useRunShortcut } from '@/hooks/useRunShortcut'
import { useFileIO } from '@/hooks/useFileIO'
import { useMenubarActions } from '@/hooks/useMenubarActions'
import { parseJsonc } from '@/lib/jsonc'

type Format = 'json' | 'yaml' | 'xml'

const FORMAT_OPTIONS = [
  ['json', 'JSON'],
  ['yaml', 'YAML'],
  ['xml', 'XML'],
] as const

const MONO_LANG: Record<Format, string> = { json: 'jsonc', yaml: 'yaml', xml: 'xml' }
const EXT: Record<Format, string> = { json: 'json', yaml: 'yaml', xml: 'xml' }
const MIME: Record<Format, string> = {
  json: 'application/json', yaml: 'text/yaml', xml: 'application/xml',
}

function parse(input: string, format: Format): unknown {
  switch (format) {
    case 'json': return parseJsonc(input)
    case 'yaml': return yaml.load(input)
    case 'xml': {
      const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
      return parser.parse(input)
    }
  }
}

function stringify(data: unknown, format: Format): string {
  switch (format) {
    case 'json': return JSON.stringify(data, null, 2)
    case 'yaml': return yaml.dump(data, { indent: 2 })
    case 'xml': {
      const builder = new XMLBuilder({ ignoreAttributes: false, attributeNamePrefix: '@_', format: true })
      return builder.build(data)
    }
  }
}

function detectFormat(text: string): Format | null {
  const t = text.trim()
  if (!t) return null
  if (t.startsWith('<')) return 'xml'
  if (t.startsWith('{') || t.startsWith('[')) {
    try { parseJsonc(t); return 'json' } catch { /* not json */ }
  }
  if (/^[a-zA-Z_-]+:\s/m.test(t) || t.startsWith('---')) return 'yaml'
  return null
}

const DEFAULT_INPUT = JSON.stringify({
  starships: [
    { name: 'Millennium Falcon', class: 'Light freighter', crew: 2, parsecs: 12 },
    { name: 'X-Wing', class: 'Starfighter', crew: 1, parsecs: null },
    { name: 'Death Star', class: 'Space station', crew: 342953, parsecs: null },
    { name: 'Star Destroyer', class: 'Destroyer', crew: 47060, parsecs: null },
    { name: 'TIE Fighter', class: 'Starfighter', crew: 1, parsecs: null },
  ],
}, null, 2)

export default function JsonYamlXml() {
  const [input, setInput] = useState(DEFAULT_INPUT)
  const [output, setOutput] = useState('')
  const [from, setFrom] = useState<Format>('json')
  const [to, setTo] = useState<Format>('yaml')
  const [error, setError] = useState('')
  const didAutoRun = useRef(false)
  const { openFile, downloadFile, copyToClipboard } = useFileIO()

  const run = useCallback(() => {
    setError('')
    if (!input.trim()) return
    try {
      const parsed = parse(input, from)
      setOutput(stringify(parsed, to))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setOutput('')
    }
  }, [input, from, to])

  useRunShortcut(run)

  useEffect(() => {
    if (!didAutoRun.current) {
      didAutoRun.current = true
      run()
    }
  }, [run])

  const handleOpen = useCallback(async () => {
    try {
      const text = await openFile(`.${EXT[from]},*`)
      setInput(text)
      const detected = detectFormat(text)
      if (detected) setFrom(detected)
    } catch { /* cancelled */ }
  }, [openFile, from])

  const handleSave = useCallback(() => {
    downloadFile(output, `output.${EXT[to]}`, MIME[to])
  }, [downloadFile, output, to])

  const handleCopy = useCallback(async () => {
    await copyToClipboard(output)
  }, [copyToClipboard, output])

  useMenubarActions({
    fileOpen: handleOpen,
    fileSave: handleSave,
    fileSaveDisabled: !output,
    editCopy: handleCopy,
    editCopyDisabled: !output,
  })

  return (
    <DualPanelLayout
      left={
        <>
          <FileIOBar
            label="Input"
            actions={
              <div className="flex items-center gap-1">
                {error && <span className="text-[11px] text-destructive max-w-[180px] truncate">{error}</span>}
                <Button size="sm" onClick={run} className="h-6 px-2 text-xs gap-1">
                  <Play className="h-3 w-3" />
                  Convert
                </Button>
              </div>
            }
          />
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              value={input}
              onChange={text => {
                setInput(text)
                const detected = detectFormat(text)
                if (detected && detected !== from) setFrom(detected)
              }}
              language={MONO_LANG[from]}
              footer={
                <StatusBarSelect
                  value={from}
                  options={FORMAT_OPTIONS}
                  onChange={v => setFrom(v as Format)}
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
              language={MONO_LANG[to]}
              readOnly
              footer={
                <StatusBarSelect
                  value={to}
                  options={FORMAT_OPTIONS}
                  onChange={v => setTo(v as Format)}
                />
              }
            />
          </div>
        </>
      }
    />
  )
}
