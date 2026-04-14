import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { registry } from '@/tools/registry'
import { CATEGORY_LABELS, type ToolCategory } from '@/tools/types'

const CATEGORY_ORDER: ToolCategory[] = ['format', 'convert', 'markdown', 'transform']

function groupByCategory() {
  const groups = new Map<ToolCategory, typeof registry>()
  for (const cat of CATEGORY_ORDER) {
    const tools = registry.filter(t => t.category === cat)
    if (tools.length > 0) groups.set(cat, tools)
  }
  return groups
}

export function Sidebar() {
  const groups = groupByCategory()

  return (
    <aside className="flex h-full w-52 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex h-12 items-center px-4 border-b border-border">
        <span className="font-semibold text-sm tracking-tight text-sidebar-foreground">Toolbox</span>
      </div>
      <ScrollArea className="flex-1">
        <nav className="py-2">
          {Array.from(groups.entries()).map(([cat, tools]) => (
            <div key={cat} className="mb-2">
              <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {CATEGORY_LABELS[cat]}
              </p>
              {tools.map(tool => (
                <NavLink
                  key={tool.id}
                  to={`/tools/${tool.id}`}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 px-4 py-1.5 text-sm transition-colors',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                    )
                  }
                >
                  <tool.icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{tool.name}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  )
}
