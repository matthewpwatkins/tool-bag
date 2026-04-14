import { useState, useCallback } from 'react'
import { Play, Minimize2 } from 'lucide-react'
import * as prettier from 'prettier/standalone'
import * as parserBabel from 'prettier/plugins/babel'
import * as parserEstree from 'prettier/plugins/estree'
import * as parserTypeScript from 'prettier/plugins/typescript'
import * as parserHtml from 'prettier/plugins/html'
import * as parserPostcss from 'prettier/plugins/postcss'
import * as parserMarkdown from 'prettier/plugins/markdown'
import yaml from 'js-yaml'
import { XMLParser, XMLBuilder } from 'fast-xml-parser'
import { minify } from 'terser'
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
import { useToolPrefs } from '@/hooks/useToolPrefs'

type Language = 'json' | 'javascript' | 'typescript' | 'html' | 'css' | 'yaml' | 'xml' | 'markdown'

const LANG_LABELS: Record<Language, string> = {
  json: 'JSON', javascript: 'JavaScript', typescript: 'TypeScript',
  html: 'HTML', css: 'CSS', yaml: 'YAML', xml: 'XML', markdown: 'Markdown',
}

const MONACO_LANG: Record<Language, string> = {
  json: 'json', javascript: 'javascript', typescript: 'typescript',
  html: 'html', css: 'css', yaml: 'yaml', xml: 'xml', markdown: 'markdown',
}

const SUPPORTS_MINIFY = new Set<Language>(['json', 'javascript', 'typescript'])

async function formatCode(code: string, lang: Language): Promise<string> {
  switch (lang) {
    case 'json': return JSON.stringify(JSON.parse(code), null, 2)
    case 'javascript':
      return prettier.format(code, { parser: 'babel', plugins: [parserBabel, parserEstree], semi: true, singleQuote: true, printWidth: 100 })
    case 'typescript':
      return prettier.format(code, { parser: 'typescript', plugins: [parserTypeScript, parserEstree], semi: true, singleQuote: true, printWidth: 100 })
    case 'html':
      return prettier.format(code, { parser: 'html', plugins: [parserHtml], printWidth: 100 })
    case 'css':
      return prettier.format(code, { parser: 'css', plugins: [parserPostcss], singleQuote: true })
    case 'yaml': return yaml.dump(yaml.load(code) as object, { indent: 2 })
    case 'xml': {
      const parser = new XMLParser({ ignoreAttributes: false })
      const builder = new XMLBuilder({ ignoreAttributes: false, format: true })
      return builder.build(parser.parse(code))
    }
    case 'markdown':
      return prettier.format(code, { parser: 'markdown', plugins: [parserMarkdown], proseWrap: 'preserve' })
    default:
      return code
  }
}

async function minifyCode(code: string, lang: Language): Promise<string> {
  switch (lang) {
    case 'json': return JSON.stringify(JSON.parse(code))
    case 'javascript':
    case 'typescript': {
      const result = await minify(code, { compress: true, mangle: true })
      return result.code ?? ''
    }
    default: return code
  }
}

export default function Formatter() {
  const [lang, setLang] = useState<Language>('json')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const { panelMode, setPanelMode } = useToolPrefs('formatter')

  const runFormat = useCallback(async () => {
    setError('')
    if (!input.trim()) return
    try {
      const result = await formatCode(input, lang)
      if (panelMode === 'single') {
        setInput(result)
      } else {
        setOutput(result)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [input, lang, panelMode])

  const runMinify = useCallback(async () => {
    setError('')
    if (!input.trim()) return
    try {
      const result = await minifyCode(input, lang)
      if (panelMode === 'single') {
        setInput(result)
      } else {
        setOutput(result)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [input, lang, panelMode])

  useRunShortcut(runFormat)

  const langSelect = (
    <Select value={lang} onValueChange={v => setLang(v as Language)}>
      <SelectTrigger className="h-5 w-28 text-[11px] border-0 bg-transparent px-1 focus:ring-0 gap-1">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(LANG_LABELS) as Language[]).map(l => (
          <SelectItem key={l} value={l}>{LANG_LABELS[l]}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  if (panelMode === 'single') {
    return (
      <div className="flex flex-col h-full">
        <ToolToolbar
          error={error}
          panelMode={panelMode}
          onPanelModeChange={setPanelMode}
          right={
            <div className="flex items-center gap-1">
              {SUPPORTS_MINIFY.has(lang) && (
                <Button size="sm" variant="outline" onClick={runMinify} className="h-6 px-2 text-xs gap-1">
                  <Minimize2 className="h-3 w-3" />
                  Minify
                </Button>
              )}
              <Button size="sm" onClick={runFormat} className="h-6 px-2 text-xs gap-1">
                <Play className="h-3 w-3" />
                Format
              </Button>
            </div>
          }
        />
        <FileIOBar
          label="Editor"
          value={input}
          onLoad={setInput}
          downloadFilename={`code.${lang === 'javascript' ? 'js' : lang === 'typescript' ? 'ts' : lang}`}
          showDownload
          formatSelect={langSelect}
        />
        <div className="flex-1">
          <CodeEditor
            value={input}
            onChange={setInput}
            language={MONACO_LANG[lang]}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <ToolToolbar
        error={error}
        panelMode={panelMode}
        onPanelModeChange={setPanelMode}
        right={
          <div className="flex items-center gap-1">
            {SUPPORTS_MINIFY.has(lang) && (
              <Button size="sm" variant="outline" onClick={runMinify} className="h-6 px-2 text-xs gap-1">
                <Minimize2 className="h-3 w-3" />
                Minify
              </Button>
            )}
            <Button size="sm" onClick={runFormat} className="h-6 px-2 text-xs gap-1">
              <Play className="h-3 w-3" />
              Format
            </Button>
          </div>
        }
      />
      <DualPanelLayout
        left={
          <>
            <FileIOBar
              label="Input"
              value={input}
              onLoad={setInput}
              showDownload={false}
              formatSelect={langSelect}
            />
            <div className="flex-1">
              <CodeEditor value={input} onChange={setInput} language={MONACO_LANG[lang]} />
            </div>
          </>
        }
        right={
          <>
            <FileIOBar
              label="Output"
              value={output}
              downloadFilename={`formatted.${lang === 'javascript' ? 'js' : lang === 'typescript' ? 'ts' : lang}`}
              showDownload
            />
            <div className="flex-1">
              <CodeEditor value={output} language={MONACO_LANG[lang]} readOnly />
            </div>
          </>
        }
      />
    </div>
  )
}
