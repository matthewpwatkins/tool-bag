import { useState, useCallback } from 'react'
import { Play, Minimize2 } from 'lucide-react'
import * as prettier from 'prettier/standalone'
import yaml from 'js-yaml'
import { XMLParser, XMLBuilder } from 'fast-xml-parser'
import type { editor as monacoEditor } from 'monaco-editor'
import { CodeEditor } from '@/components/editor/CodeEditor'
import { FileIOBar } from '@/components/editor/FileIOBar'
import { StatusBarSelect } from '@/components/editor/StatusBarSelect'
import { DualPanelLayout } from '@/components/layout/DualPanelLayout'
import { Button } from '@/components/ui/button'
import { useRunShortcut } from '@/hooks/useRunShortcut'
import { useToolPrefs } from '@/hooks/useToolPrefs'
import { useFileIO } from '@/hooks/useFileIO'
import { useMenubarActions } from '@/hooks/useMenubarActions'
import { parseJsonc } from '@/lib/jsonc'

type Language = 'json' | 'javascript' | 'typescript' | 'html' | 'css' | 'yaml' | 'xml' | 'markdown'

const LANG_OPTIONS = [
  ['json', 'JSON'],
  ['javascript', 'JavaScript'],
  ['typescript', 'TypeScript'],
  ['html', 'HTML'],
  ['css', 'CSS'],
  ['yaml', 'YAML'],
  ['xml', 'XML'],
  ['markdown', 'Markdown'],
] as const

const MONO_LANG: Record<Language, string> = {
  json: 'jsonc', javascript: 'javascript', typescript: 'typescript',
  html: 'html', css: 'css', yaml: 'yaml', xml: 'xml', markdown: 'markdown',
}

const SUPPORTS_MINIFY = new Set<Language>(['json', 'javascript', 'typescript'])

const EXT: Record<Language, string> = {
  json: 'json', javascript: 'js', typescript: 'ts',
  html: 'html', css: 'css', yaml: 'yaml', xml: 'xml', markdown: 'md',
}

function detectLanguage(text: string): Language | null {
  const t = text.trim()
  if (!t) return null
  if (/^<!DOCTYPE\s+html/i.test(t) || /^<html/i.test(t)) return 'html'
  if (t.startsWith('<') && (t.includes('</') || t.endsWith('/>'))) return 'xml'
  if (t.startsWith('{') || t.startsWith('[')) {
    try { parseJsonc(t); return 'json' } catch { /* not json */ }
  }
  if (t.startsWith('---') || /^[a-zA-Z_-]+:\s/m.test(t)) return 'yaml'
  if (/^#+\s/m.test(t) || /\*\*.+\*\*/m.test(t)) return 'markdown'
  if (/:\s*(string|number|boolean|void|any)\b/.test(t) || /\binterface\b|\btype\s+\w+\s*=/.test(t)) return 'typescript'
  if (/\b(function|const|let|var|class|import|export|require)\b/.test(t)) return 'javascript'
  if (/^\s*[\w.*#[\]:,-]+\s*\{/m.test(t)) return 'css'
  return null
}

// Lazy-load each prettier parser + terser so they split into separate chunks
// and are only fetched when the user actually formats that language.
async function formatCode(code: string, lang: Language): Promise<string> {
  switch (lang) {
    case 'json': return JSON.stringify(parseJsonc(code), null, 2)
    case 'javascript': {
      const [babel, estree] = await Promise.all([
        import('prettier/plugins/babel'),
        import('prettier/plugins/estree'),
      ])
      return prettier.format(code, { parser: 'babel', plugins: [babel, estree], semi: true, singleQuote: true, printWidth: 100 })
    }
    case 'typescript': {
      const [ts, estree] = await Promise.all([
        import('prettier/plugins/typescript'),
        import('prettier/plugins/estree'),
      ])
      return prettier.format(code, { parser: 'typescript', plugins: [ts, estree], semi: true, singleQuote: true, printWidth: 100 })
    }
    case 'html': {
      const html = await import('prettier/plugins/html')
      return prettier.format(code, { parser: 'html', plugins: [html], printWidth: 100 })
    }
    case 'css': {
      const postcss = await import('prettier/plugins/postcss')
      return prettier.format(code, { parser: 'css', plugins: [postcss], singleQuote: true })
    }
    case 'yaml': return yaml.dump(yaml.load(code) as object, { indent: 2 })
    case 'xml': {
      const parser = new XMLParser({ ignoreAttributes: false })
      const builder = new XMLBuilder({ ignoreAttributes: false, format: true })
      return builder.build(parser.parse(code))
    }
    case 'markdown': {
      const md = await import('prettier/plugins/markdown')
      return prettier.format(code, { parser: 'markdown', plugins: [md], proseWrap: 'preserve' })
    }
    default: return code
  }
}

async function minifyCode(code: string, lang: Language): Promise<string> {
  switch (lang) {
    case 'json': return JSON.stringify(parseJsonc(code))
    case 'javascript':
    case 'typescript': {
      const { minify } = await import('terser')
      const result = await minify(code, { compress: true, mangle: true })
      return result.code ?? ''
    }
    default: return code
  }
}

const DEFAULT_INPUT = `// Star Wars character roster — paste your own JSON, JS, TS, HTML, CSS, YAML, XML, or Markdown
// Press Format (or Ctrl+Enter) to clean it up.
{ "faction":"Galactic Republic",  "year": -19,
  "members": [
{"name":"Anakin Skywalker","rank":"Jedi Knight","midichlorians":27000 /* highest ever recorded */},
    {  "name":"Obi-Wan Kenobi","rank":"Jedi Master","midichlorians":13400},
    {"name":"Yoda","rank":"Grand Master","midichlorians":17700},
    {  "name":"Mace Windu",  "rank":"Jedi Master","midichlorians":12000},
  // fallen member
  {"name":"Count Dooku","rank":"Sith Lord","midichlorians":13500}
  ]}`

export default function Formatter() {
  const [lang, setLang] = useState<Language>('json')
  const [input, setInput] = useState(DEFAULT_INPUT)
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const { panelMode, setPanelMode } = useToolPrefs('formatter')
  const { openFile, downloadFile, copyToClipboard } = useFileIO()

  const currentContent = panelMode === 'single' ? input : output

  const runFormat = useCallback(async () => {
    setError('')
    if (!input.trim()) return
    try {
      const result = await formatCode(input, lang)
      if (panelMode === 'single') setInput(result)
      else setOutput(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [input, lang, panelMode])

  const runMinify = useCallback(async () => {
    setError('')
    if (!input.trim()) return
    try {
      const result = await minifyCode(input, lang)
      if (panelMode === 'single') setInput(result)
      else setOutput(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [input, lang, panelMode])

  useRunShortcut(runFormat)

  const handleOpen = useCallback(async () => {
    try {
      const text = await openFile(`.${EXT[lang]},*`)
      setInput(text)
      const detected = detectLanguage(text)
      if (detected) setLang(detected)
    } catch { /* cancelled */ }
  }, [openFile, lang])

  const handleSave = useCallback(() => {
    downloadFile(currentContent, `code.${EXT[lang]}`)
  }, [downloadFile, currentContent, lang])

  const handleCopy = useCallback(async () => {
    await copyToClipboard(currentContent)
  }, [copyToClipboard, currentContent])

  useMenubarActions({
    fileOpen: handleOpen,
    fileSave: handleSave,
    fileSaveDisabled: !currentContent,
    editCopy: handleCopy,
    editCopyDisabled: !currentContent,
    panelMode,
    onPanelModeChange: setPanelMode,
  })

  // Paste detection: update language when user pastes into an empty/near-empty editor
  function handleEditorMount(editor: monacoEditor.IStandaloneCodeEditor) {
    editor.onDidPaste(() => {
      const text = editor.getValue()
      const detected = detectLanguage(text)
      if (detected) setLang(detected)
    })
  }

  const langFooter = (
    <StatusBarSelect
      value={lang}
      options={LANG_OPTIONS}
      onChange={v => setLang(v as Language)}
    />
  )

  const actionButtons = (
    <div className="flex items-center gap-1">
      {error && <span className="text-[11px] text-destructive max-w-[180px] truncate">{error}</span>}
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
  )

  if (panelMode === 'single') {
    return (
      <div className="flex flex-col h-full">
        <FileIOBar label="Editor" actions={actionButtons} />
        <div className="flex-1 overflow-hidden">
          <CodeEditor
            value={input}
            onChange={setInput}
            language={MONO_LANG[lang]}
            onMount={e => handleEditorMount(e)}
            footer={langFooter}
          />
        </div>
      </div>
    )
  }

  return (
    <DualPanelLayout
      left={
        <>
          <FileIOBar label="Input" actions={actionButtons} />
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              value={input}
              onChange={setInput}
              language={MONO_LANG[lang]}
              onMount={e => handleEditorMount(e)}
              footer={langFooter}
            />
          </div>
        </>
      }
      right={
        <>
          <FileIOBar label="Output" />
          <div className="flex-1 overflow-hidden">
            <CodeEditor value={output} language={MONO_LANG[lang]} readOnly footer={langFooter} />
          </div>
        </>
      }
    />
  )
}
