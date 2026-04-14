import { useState, useCallback } from 'react'
import { Play } from 'lucide-react'
import yaml from 'js-yaml'
import { XMLParser, XMLBuilder } from 'fast-xml-parser'
import { CodeEditor } from '@/components/editor/CodeEditor'
import { FileIOBar } from '@/components/editor/FileIOBar'
import { DualPanelLayout } from '@/components/layout/DualPanelLayout'
import { ToolToolbar } from '@/components/layout/ToolToolbar'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRunShortcut } from '@/hooks/useRunShortcut'

type Format = 'json' | 'yaml' | 'xml'

const LANGUAGES: Record<Format, string> = { json: 'json', yaml: 'yaml', xml: 'xml' }
const EXT: Record<Format, string> = { json: 'json', yaml: 'yaml', xml: 'xml' }
const MIME: Record<Format, string> = {
  json: 'application/json',
  yaml: 'text/yaml',
  xml: 'application/xml',
}

function parse(input: string, format: Format): unknown {
  switch (format) {
    case 'json': return JSON.parse(input)
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

function FormatSelect({ value, onChange }: { value: Format; onChange: (v: Format) => void }) {
  return (
    <Select value={value} onValueChange={v => onChange(v as Format)}>
      <SelectTrigger className="h-5 w-20 text-[11px] border-0 bg-transparent px-1 focus:ring-0 gap-1">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="json">JSON</SelectItem>
        <SelectItem value="yaml">YAML</SelectItem>
        <SelectItem value="xml">XML</SelectItem>
      </SelectContent>
    </Select>
  )
}

export default function JsonYamlXml() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [from, setFrom] = useState<Format>('json')
  const [to, setTo] = useState<Format>('yaml')
  const [error, setError] = useState('')

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

  return (
    <div className="flex flex-col h-full">
      <ToolToolbar
        error={error}
        right={
          <Button size="sm" onClick={run} className="h-6 px-2 text-xs gap-1">
            <Play className="h-3 w-3" />
            Convert
          </Button>
        }
      />
      <DualPanelLayout
        left={
          <>
            <FileIOBar
              label="Input"
              value={input}
              onLoad={setInput}
              accept={`.${EXT[from]}`}
              showDownload={false}
              formatSelect={<FormatSelect value={from} onChange={setFrom} />}
            />
            <div className="flex-1">
              <CodeEditor value={input} onChange={setInput} language={LANGUAGES[from]} />
            </div>
          </>
        }
        right={
          <>
            <FileIOBar
              label="Output"
              value={output}
              downloadFilename={`output.${EXT[to]}`}
              downloadMime={MIME[to]}
              showDownload
              formatSelect={<FormatSelect value={to} onChange={setTo} />}
            />
            <div className="flex-1">
              <CodeEditor value={output} language={LANGUAGES[to]} readOnly />
            </div>
          </>
        }
      />
    </div>
  )
}
