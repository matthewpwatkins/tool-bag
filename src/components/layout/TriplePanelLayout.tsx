import type { ReactNode } from 'react'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'

interface TriplePanelLayoutProps {
  left: ReactNode
  center: ReactNode
  right: ReactNode
  console?: ReactNode
}

export function TriplePanelLayout({ left, center, right, console: consolePanel }: TriplePanelLayoutProps) {
  return (
    <ResizablePanelGroup direction="vertical" className="flex-1">
      <ResizablePanel defaultSize={consolePanel ? 75 : 100} minSize={40}>
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={33} minSize={15}>
            <div className="flex h-full flex-col">{left}</div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={34} minSize={15}>
            <div className="flex h-full flex-col">{center}</div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={33} minSize={15}>
            <div className="flex h-full flex-col">{right}</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
      {consolePanel && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={25} minSize={10}>
            <div className="flex h-full flex-col">{consolePanel}</div>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  )
}
