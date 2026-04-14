import * as Dialog from '@radix-ui/react-dialog'
import { X, Upload, Download, Copy, Keyboard } from 'lucide-react'
import { registry } from '@/tools/registry'
import { CATEGORY_LABELS, type ToolCategory } from '@/tools/types'

const CATEGORY_ORDER: ToolCategory[] = ['format', 'convert', 'markdown', 'transform']

const TOOL_DETAILS: Record<string, string> = {
  'formatter': 'Supports JSON, JavaScript, TypeScript, HTML, CSS, YAML, XML, and Markdown. Prettier-powered formatting plus minification for JS/TS/JSON. Language is auto-detected on paste or file open.',
  'json-yaml-xml': 'Paste or load any supported format in the left editor, pick your target format in the right status bar, and click Convert. Format is auto-detected as you type.',
  'markdown-editor': 'Live preview updates as you type. The Lint button runs markdownlint and highlights issues inline — click any problem to jump to that line.',
  'vtt-to-markdown': 'Paste a WebVTT file (or open one) and get a clean Markdown transcript. Consecutive lines from the same speaker are merged. Toggle timestamps on/off.',
  'js-transform': 'Write a `transform(data)` function — it receives your parsed input and must return a value. Runs in a sandboxed Web Worker with a 5-second timeout. TypeScript supported.',
}

interface HelpModalProps {
  open: boolean
  onClose: () => void
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  const byCategory = CATEGORY_ORDER.map(cat => ({
    cat,
    label: CATEGORY_LABELS[cat],
    tools: registry.filter(t => t.category === cat),
  }))

  return (
    <Dialog.Root open={open} onOpenChange={v => { if (!v) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[min(90vw,860px)] max-h-[85vh] flex flex-col rounded-lg border border-border bg-background shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
            <div>
              <Dialog.Title className="text-lg font-semibold tracking-tight">
                Toolbox
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground mt-0.5">
                Browser-based developer utilities — everything runs locally, nothing leaves your machine.
              </Dialog.Description>
            </div>
            <button
              onClick={onClose}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto px-6 py-5 space-y-7">

            {/* Tools */}
            <section>
              <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Tools</h2>
              <div className="space-y-5">
                {byCategory.map(({ label, tools }) => (
                  <div key={label}>
                    <p className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider mb-2">{label}</p>
                    <div className="space-y-2">
                      {tools.map(tool => (
                        <div key={tool.id} className="flex gap-3">
                          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded bg-accent/60">
                            <tool.icon className="h-3.5 w-3.5 text-foreground/70" />
                          </div>
                          <div>
                            <p className="text-sm font-medium leading-none mb-1">{tool.name}</p>
                            <p className="text-[13px] text-muted-foreground">
                              {TOOL_DETAILS[tool.id] ?? tool.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* File operations */}
            <section>
              <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">File Operations</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Upload, label: 'File → Open', desc: 'Load a file from disk into the input editor.' },
                  { icon: Download, label: 'File → Save As', desc: 'Download the output to a file.' },
                  { icon: Copy, label: 'Edit → Copy', desc: 'Copy the output to the clipboard.' },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="rounded-md border border-border p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[13px] font-medium">{label}</span>
                    </div>
                    <p className="text-[12px] text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Keyboard shortcuts */}
            <section>
              <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                <span className="inline-flex items-center gap-1.5"><Keyboard className="h-3 w-3" /> Keyboard Shortcuts</span>
              </h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[13px]">
                {[
                  ['Ctrl + Enter', 'Run / Format / Convert'],
                  ['Ctrl + O', 'Open file (via File menu)'],
                  ['Ctrl + S', 'Save output (via File menu)'],
                  ['View → Split View', 'Toggle single / split editor'],
                ].map(([key, action]) => (
                  <div key={key} className="flex items-center justify-between gap-4 py-1 border-b border-border/40">
                    <span className="text-muted-foreground">{action}</span>
                    <kbd className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground/70">{key}</kbd>
                  </div>
                ))}
              </div>
            </section>

            {/* Tips */}
            <section>
              <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Tips</h2>
              <ul className="space-y-1.5 text-[13px] text-muted-foreground list-disc list-inside">
                <li>The sidebar icons on the left switch tool categories. Click the active icon again to collapse the sidebar.</li>
                <li>Language and format selectors live in the blue status bar at the bottom of each editor — click to change.</li>
                <li>In the JS Transform tool, your code runs in a sandboxed Web Worker with a 5-second timeout so infinite loops can't crash the page.</li>
                <li>Formatter loads language parsers on-demand — the first format of a new language may take a moment to download.</li>
                <li>Everything runs in your browser. No data is sent to any server.</li>
              </ul>
            </section>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end border-t border-border px-6 py-3 shrink-0">
            <button
              onClick={onClose}
              className="cursor-pointer rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Get started
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
