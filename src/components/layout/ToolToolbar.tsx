import type { ReactNode } from 'react'
import { Columns2, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PanelMode } from '@/hooks/useToolPrefs'

interface ToolToolbarProps {
  left?: ReactNode
  right?: ReactNode
  error?: string
  panelMode?: PanelMode
  onPanelModeChange?: (mode: PanelMode) => void
}

export function ToolToolbar({ left, right, error, panelMode, onPanelModeChange }: ToolToolbarProps) {
  return (
    <div className="flex h-9 items-center justify-between px-2 border-b border-border bg-background shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        {left}
        {error && (
          <span className="text-xs text-destructive truncate">{error}</span>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {right}
        {onPanelModeChange && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            title={panelMode === 'single' ? 'Switch to split view' : 'Switch to single view'}
            onClick={() => onPanelModeChange(panelMode === 'single' ? 'dual' : 'single')}
          >
            {panelMode === 'single' ? (
              <Columns2 className="h-3.5 w-3.5" />
            ) : (
              <Square className="h-3.5 w-3.5" />
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
