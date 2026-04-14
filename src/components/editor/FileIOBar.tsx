import type { ReactNode } from 'react'

interface FileIOBarProps {
  label: string
  /** Action buttons (Format, Run, Lint…) placed in the tab bar to the right */
  actions?: ReactNode
}

/**
 * Panel header styled as a VS Code editor tab.
 *
 * Layout:
 *   [Tab: label | blue top border, editor bg] [Tab-bar spacer: actions right-aligned]
 *
 * The tab background matches the editor (`#1e1e1e` dark / `#fff` light) so it
 * blends seamlessly into the Monaco editor below it.
 */
export function FileIOBar({ label, actions }: FileIOBarProps) {
  return (
    <div className="flex h-9 items-stretch shrink-0 bg-[#f3f3f3] dark:bg-[#252526]">
      {/* The tab itself */}
      <div
        className="flex items-center px-4 text-[13px] text-foreground bg-white dark:bg-[#1e1e1e] border-r border-[#e7e7e7] dark:border-[#3c3c3c] shrink-0 select-none"
        style={{ borderTop: '2px solid #0078d4' }}
      >
        {label}
      </div>

      {/* Remaining tab-bar area — holds action buttons, has bottom border */}
      <div className="flex flex-1 items-center justify-end gap-1 px-2 border-b border-[#e7e7e7] dark:border-[#3c3c3c]">
        {actions}
      </div>
    </div>
  )
}
