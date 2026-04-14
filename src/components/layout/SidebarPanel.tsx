import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { registry } from '@/tools/registry'
import { CATEGORY_LABELS, type ToolCategory } from '@/tools/types'

interface SidebarPanelProps {
  category: ToolCategory
}

export function SidebarPanel({ category }: SidebarPanelProps) {
  const tools = registry.filter(t => t.category === category)

  return (
    <div className="flex flex-col h-full overflow-hidden bg-sidebar border-r border-sidebar-border">
      {/* VS Code-style section title */}
      <div className="flex h-9 items-center px-3 shrink-0 border-b border-sidebar-border">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/60 select-none">
          {CATEGORY_LABELS[category]}
        </span>
      </div>

      <ScrollArea className="flex-1">
        <nav className="py-0.5">
          {tools.map(tool => (
            <NavLink
              key={tool.id}
              to={`/tools/${tool.id}`}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-4 py-[5px] text-[13px] transition-colors select-none cursor-pointer',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )
              }
            >
              <tool.icon className="h-[15px] w-[15px] shrink-0 opacity-70" />
              <span className="truncate">{tool.name}</span>
            </NavLink>
          ))}
        </nav>
      </ScrollArea>
    </div>
  )
}
