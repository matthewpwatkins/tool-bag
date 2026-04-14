import { useState } from 'react'
import { marked } from 'marked'
import { CodeEditor } from '@/components/editor/CodeEditor'
import { FileIOBar } from '@/components/editor/FileIOBar'
import { DualPanelLayout } from '@/components/layout/DualPanelLayout'

marked.setOptions({ async: false })

export default function MarkdownEditor() {
  const [input, setInput] = useState('# Hello\n\nStart typing your markdown here...\n')

  const html = marked(input) as string

  return (
    <DualPanelLayout
      left={
        <>
          <FileIOBar
            label="Markdown"
            value={input}
            onLoad={setInput}
            accept=".md,.markdown,.txt"
            downloadFilename="document.md"
            showDownload
          />
          <div className="flex-1">
            <CodeEditor value={input} onChange={setInput} language="markdown" />
          </div>
        </>
      }
      right={
        <>
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-1.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preview</span>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </>
      }
    />
  )
}
