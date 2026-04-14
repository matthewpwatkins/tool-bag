import { useState, useRef, useEffect, useCallback } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from 'react-resizable-panels'
import { ActivityBar } from './ActivityBar'
import { SidebarPanel } from './SidebarPanel'
import { AppMenubar } from './AppMenubar'
import { MenubarProvider } from '@/contexts/MenubarContext'
import { registry } from '@/tools/registry'
import { type ToolCategory } from '@/tools/types'

const SIDEBAR_WIDTH_KEY = 'toolbox-sidebar-width'
const SIDEBAR_OPEN_KEY = 'toolbox-sidebar-open'
const SIDEBAR_DEFAULT_PX = 240
const SIDEBAR_MIN_PX = 160
const SIDEBAR_MAX_PX = 480

function pxToPercent(px: number) {
  return (px / window.innerWidth) * 100
}

function getInitialOpen(): boolean {
  try { return localStorage.getItem(SIDEBAR_OPEN_KEY) !== 'false' } catch { return true }
}

function getCategoryForPath(pathname: string): ToolCategory | null {
  const match = pathname.match(/^\/tools\/(.+)/)
  if (!match) return null
  return registry.find(t => t.id === match[1])?.category ?? null
}

function getFirstToolInCategory(category: ToolCategory): string | null {
  const tool = registry.find(t => t.category === category)
  return tool ? `/tools/${tool.id}` : null
}

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const sidebarRef = useRef<ImperativePanelHandle>(null)

  const [sidebarOpen, setSidebarOpen] = useState(getInitialOpen)
  const [activeCategory, setActiveCategory] = useState<ToolCategory>(() => {
    return getCategoryForPath(location.pathname) ?? 'format'
  })

  useEffect(() => {
    const cat = getCategoryForPath(location.pathname)
    if (cat) setActiveCategory(cat)
  }, [location.pathname])

  const handleCategoryClick = useCallback((cat: ToolCategory) => {
    if (cat === activeCategory) {
      if (sidebarOpen) sidebarRef.current?.collapse()
      else sidebarRef.current?.expand()
    } else {
      setActiveCategory(cat)
      if (!sidebarOpen) sidebarRef.current?.expand()
      const path = getFirstToolInCategory(cat)
      if (path) navigate(path)
    }
  }, [activeCategory, sidebarOpen, navigate])

  const handleCollapse = useCallback(() => {
    setSidebarOpen(false)
    try { localStorage.setItem(SIDEBAR_OPEN_KEY, 'false') } catch { /* noop */ }
  }, [])

  const handleExpand = useCallback(() => {
    setSidebarOpen(true)
    try { localStorage.setItem(SIDEBAR_OPEN_KEY, 'true') } catch { /* noop */ }
  }, [])

  const defaultSidebarSize = pxToPercent(
    (() => { try { return Number(localStorage.getItem(SIDEBAR_WIDTH_KEY)) || SIDEBAR_DEFAULT_PX } catch { return SIDEBAR_DEFAULT_PX } })()
  )

  return (
    <MenubarProvider>
      <div className="flex flex-col h-screen w-full overflow-hidden bg-background text-foreground">
        {/* Full-width menu bar at the very top, like VS Code */}
        <AppMenubar />

        <div className="flex flex-1 overflow-hidden">
          <ActivityBar
            activeCategory={activeCategory}
            sidebarOpen={sidebarOpen}
            onCategoryClick={handleCategoryClick}
          />

          <PanelGroup
            direction="horizontal"
            className="flex-1"
            onLayout={(sizes) => {
              if (sidebarOpen && sizes[0] > 0) {
                const px = Math.round((sizes[0] / 100) * window.innerWidth)
                try { localStorage.setItem(SIDEBAR_WIDTH_KEY, String(px)) } catch { /* noop */ }
              }
            }}
          >
            <Panel
              ref={sidebarRef}
              defaultSize={sidebarOpen ? defaultSidebarSize : 0}
              minSize={pxToPercent(SIDEBAR_MIN_PX)}
              maxSize={pxToPercent(SIDEBAR_MAX_PX)}
              collapsible
              collapsedSize={0}
              onCollapse={handleCollapse}
              onExpand={handleExpand}
              style={{ overflow: 'hidden' }}
            >
              <SidebarPanel category={activeCategory} />
            </Panel>

            <PanelResizeHandle
              className="w-[1px] bg-sidebar-border hover:bg-blue-500 transition-colors duration-150 cursor-col-resize"
              style={{ display: sidebarOpen ? undefined : 'none' }}
            />

            <Panel minSize={30}>
              <main className="flex h-full flex-col overflow-hidden">
                <Outlet />
              </main>
            </Panel>
          </PanelGroup>
        </div>
      </div>
    </MenubarProvider>
  )
}
