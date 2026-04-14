import { useState } from 'react'
import { Upload, Download, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFileIO } from '@/hooks/useFileIO'

interface FileIOBarProps {
  label: string
  value: string
  onLoad?: (content: string) => void
  downloadFilename?: string
  downloadMime?: string
  accept?: string
  showDownload?: boolean
}

export function FileIOBar({
  label,
  value,
  onLoad,
  downloadFilename = 'output.txt',
  downloadMime = 'text/plain',
  accept = '*',
  showDownload = true,
}: FileIOBarProps) {
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
    <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-1.5">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      <div className="flex gap-1">
        {onLoad && (
          <Button variant="ghost" size="sm" onClick={handleOpen} title="Open file">
            <Upload className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={handleCopy} title="Copy">
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
        {showDownload && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => downloadFile(value, downloadFilename, downloadMime)}
            title="Download"
            disabled={!value}
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
