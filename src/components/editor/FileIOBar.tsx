import { useState } from 'react'
import type { ReactNode } from 'react'
import { Upload, Download, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFileIO } from '@/hooks/useFileIO'

interface PanelTitleBarProps {
  label: string
  value: string
  onLoad?: (content: string) => void
  downloadFilename?: string
  downloadMime?: string
  accept?: string
  showDownload?: boolean
  /** Slot for a format selector dropdown rendered between label and actions */
  formatSelect?: ReactNode
}

export function FileIOBar({
  label,
  value,
  onLoad,
  downloadFilename = 'output.txt',
  downloadMime = 'text/plain',
  accept = '*',
  showDownload = true,
  formatSelect,
}: PanelTitleBarProps) {
  const { openFile, downloadFile, copyToClipboard } = useFileIO()
  const [copied, setCopied] = useState(false)

  async function handleOpen() {
    try {
      const text = await openFile(accept)
      onLoad?.(text)
    } catch {
      // cancelled
    }
  }

  async function handleCopy() {
    const ok = await copyToClipboard(value)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <div
      className="flex h-8 items-center justify-between border-b px-2 shrink-0"
      style={{ background: 'var(--panel-title-bg, hsl(var(--muted)/40%))', borderColor: 'hsl(var(--border))' }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide shrink-0">
          {label}
        </span>
        {formatSelect && <div className="flex items-center">{formatSelect}</div>}
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        {onLoad && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleOpen} title="Open file">
            <Upload className="h-3 w-3" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy} title="Copy">
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
        {showDownload && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => downloadFile(value, downloadFilename, downloadMime)}
            title="Download"
            disabled={!value}
          >
            <Download className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  )
}
