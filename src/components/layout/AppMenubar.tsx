import * as Menubar from '@radix-ui/react-menubar'
import { Check } from 'lucide-react'
import { useState } from 'react'
import { useMenubarContext } from '@/contexts/MenubarContext'
import { cn } from '@/lib/utils'
import type { PanelMode } from '@/hooks/useToolPrefs'

const trigger = cn(
  'relative flex select-none items-center rounded px-2.5 py-1 text-[13px] outline-none cursor-pointer',
  'text-foreground/80 hover:text-foreground',
  'data-[state=open]:bg-accent data-[state=open]:text-foreground',
  'hover:bg-accent/60',
)

const content = cn(
  'z-50 min-w-[180px] overflow-hidden rounded border border-border bg-popover text-popover-foreground shadow-md',
  'origin-top-left',
)

const item = cn(
  'relative flex cursor-pointer select-none items-center justify-between rounded-sm px-3 py-1.5 text-[13px] outline-none',
  'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
)

const shortcut = 'ml-6 text-[11px] text-muted-foreground'

export function AppMenubar() {
  const { actions } = useMenubarContext()
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await actions.editCopy?.()
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Menubar.Root className="flex h-8 items-center gap-0.5 border-b border-border bg-background px-1.5 shrink-0">
      {/* File */}
      <Menubar.Menu>
        <Menubar.Trigger className={trigger}>File</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className={content} align="start" sideOffset={4}>
            <Menubar.Item
              className={item}
              disabled={!actions.fileOpen}
              onSelect={() => actions.fileOpen?.()}
            >
              Open...
              <span className={shortcut}>Ctrl+O</span>
            </Menubar.Item>
            <Menubar.Separator className="my-1 h-px bg-border mx-1" />
            <Menubar.Item
              className={item}
              disabled={!actions.fileSave || !!actions.fileSaveDisabled}
              onSelect={() => actions.fileSave?.()}
            >
              Save As...
              <span className={shortcut}>Ctrl+S</span>
            </Menubar.Item>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>

      {/* Edit */}
      <Menubar.Menu>
        <Menubar.Trigger className={trigger}>Edit</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className={content} align="start" sideOffset={4}>
            <Menubar.Item
              className={item}
              disabled={!actions.editCopy || !!actions.editCopyDisabled}
              onSelect={handleCopy}
            >
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </Menubar.Item>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>

      {/* View — only when the active tool supports panel mode */}
      {actions.onPanelModeChange && (
        <Menubar.Menu>
          <Menubar.Trigger className={trigger}>View</Menubar.Trigger>
          <Menubar.Portal>
            <Menubar.Content className={content} align="start" sideOffset={4}>
              <Menubar.RadioGroup
                value={actions.panelMode ?? 'dual'}
                onValueChange={v => actions.onPanelModeChange?.(v as PanelMode)}
              >
                <Menubar.RadioItem value="single" className={cn(item, 'pl-8')}>
                  <Menubar.ItemIndicator className="absolute left-2.5">
                    <Check className="h-3 w-3" />
                  </Menubar.ItemIndicator>
                  Single View
                </Menubar.RadioItem>
                <Menubar.RadioItem value="dual" className={cn(item, 'pl-8')}>
                  <Menubar.ItemIndicator className="absolute left-2.5">
                    <Check className="h-3 w-3" />
                  </Menubar.ItemIndicator>
                  Split View
                </Menubar.RadioItem>
              </Menubar.RadioGroup>
            </Menubar.Content>
          </Menubar.Portal>
        </Menubar.Menu>
      )}
    </Menubar.Root>
  )
}
