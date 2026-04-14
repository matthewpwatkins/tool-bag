import type { ReactNode } from 'react'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'

interface DualPanelLayoutProps {
  left: ReactNode
  right: ReactNode
}

export function DualPanelLayout({ left, right }: DualPanelLayoutProps) {
  return (
    <ResizablePanelGroup direction="horizontal" className="flex-1">
      <ResizablePanel defaultSize={50} minSize={20}>
        <div className="flex h-full flex-col">{left}</div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={50} minSize={20}>
        <div className="flex h-full flex-col">{right}</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
