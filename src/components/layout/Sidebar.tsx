import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router'
import { Settings2, Shuffle, BookOpen, Zap, Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { registry } from '@/tools/registry'
import { CATEGORY_LABELS, type ToolCategory } from '@/tools/types'
import { useTheme } from '@/hooks/useTheme'

const CATEGORY_ORDER: ToolCategory[] = ['format', 'convert', 'markdown', 'transform']

const CATEGORY_ICONS: Record<ToolCategory, React.ComponentType<{ className?: string }>> = {
  format: Settings2,
  convert: Shuffle,
  markdown: BookOpen,
  transform: Zap,
}

function getStoredOpen(): boolean {
  return localStorage.getItem('toolbox-sidebar-open') !== 'false'
}

function getCategoryForTool(toolId: string): ToolCategory | null {
  return registry.find(t => t.id === toolId)?.category ?? null
}

export function Sidebar() {
  const [open, setOpen] = useState(getStoredOpen)
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('format')
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()

  // Derive active category from current route
  const currentToolId = location.pathname.startsWith('/tools/')
    ? location.pathname.slice('/tools/'.length)
    : null
  const routeCategory = currentToolId ? getCategoryForTool(currentToolId) : null
  const displayCategory = routeCategory ?? activeCategory

  const toolsForCategory = registry.filter(t => t.category === displayCategory)

  function handleCategoryClick(cat: ToolCategory) {
    if (cat === displayCategory && open) {
      // Collapse
      setOpen(false)
      localStorage.setItem('toolbox-sidebar-open', 'false')
    } else {
      setActiveCategory(cat)
      setOpen(true)
      localStorage.setItem('toolbox-sidebar-open', 'true')
      // Navigate to first tool in category if not already there
      const first = registry.find(t => t.category === cat)
      if (first && routeCategory !== cat) {
        navigate(`/tools/${first.id}`)
      }
    }
  }

  return (
    <div className="flex h-full shrink-0">
      {/* Activity Bar — always dark like VS Code */}
      <div
        className="flex w-10 shrink-0 flex-col items-center py-1 gap-0.5"
        style={{ backgroundColor: '#333333' }}
      >
        {CATEGORY_ORDER.map(cat => {
          const Icon = CATEGORY_ICONS[cat]
          const isActive = cat === displayCategory && open
          return (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              title={CATEGORY_LABELS[cat]}
              className="relative flex h-10 w-10 items-center justify-center transition-colors"
              style={{
                color: isActive ? '#ffffff' : '#858585',
              }}
              onMouseEnter={e => {
                if (!isActive) (e.currentTarget as HTMLElement).style.color = '#cccccc'
              }}
              onMouseLeave={e => {
                if (!isActive) (e.currentTarget as HTMLElement).style.color = '#858585'
              }}
            >
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r"
                  style={{ backgroundColor: '#007acc' }}
                />
              )}
              <Icon className="h-5 w-5" />
            </button>
          )
        })}

        {/* Bottom: theme toggle */}
        <div className="mt-auto">
          <button
            onClick={toggle}
            title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            className="flex h-10 w-10 items-center justify-center transition-colors"
            style={{ color: '#858585' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#cccccc')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#858585')}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Sidebar Panel */}
      <div
        className="flex flex-col border-r border-border overflow-hidden transition-all duration-200"
        style={{
          width: open ? '176px' : '0px',
          backgroundColor: 'hsl(var(--sidebar))',
        }}
      >
        {open && (
          <>
            <div
              className="flex h-8 items-center px-3 shrink-0 border-b border-border"
            >
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {CATEGORY_LABELS[displayCategory]}
              </span>
            </div>
            <ScrollArea className="flex-1">
              <nav className="py-1">
                {toolsForCategory.map(tool => (
                  <NavLink
                    key={tool.id}
                    to={`/tools/${tool.id}`}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2 px-3 py-1 text-[13px] transition-colors',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent/60'
                      )
                    }
                  >
                    <tool.icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    <span className="truncate">{tool.name}</span>
                  </NavLink>
                ))}
              </nav>
            </ScrollArea>
          </>
        )}
      </div>
    </div>
  )
}
