import { useRef, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { ImperativePanelHandle } from 'react-resizable-panels'
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
  /** When true the console panel expands (e.g. on error). */
  consoleExpanded?: boolean
}

export function TriplePanelLayout({
  left,
  center,
  right,
  console: consolePanel,
  consoleExpanded,
}: TriplePanelLayoutProps) {
  const consolePanelRef = useRef<ImperativePanelHandle>(null)

  useEffect(() => {
    if (consoleExpanded) consolePanelRef.current?.expand()
  }, [consoleExpanded])

  return (
    <ResizablePanelGroup direction="vertical" className="flex-1">
      <ResizablePanel defaultSize={consolePanel ? 80 : 100} minSize={40}>
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
          <ResizablePanel
            ref={consolePanelRef}
            defaultSize={20}
            minSize={5}
            collapsible
            collapsedSize={0}
          >
            <div className="flex h-full flex-col">{consolePanel}</div>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  )
}
