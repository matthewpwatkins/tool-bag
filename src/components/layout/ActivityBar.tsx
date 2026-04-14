import { Settings2, Shuffle, BookOpen, Zap, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { CATEGORY_LABELS, type ToolCategory } from '@/tools/types'

const CATEGORY_ICONS: Record<ToolCategory, React.ComponentType<{ className?: string }>> = {
  format: Settings2,
  convert: Shuffle,
  markdown: BookOpen,
  transform: Zap,
}

const CATEGORY_ORDER: ToolCategory[] = ['format', 'convert', 'markdown', 'transform']

interface ActivityBarProps {
  activeCategory: ToolCategory
  sidebarOpen: boolean
  onCategoryClick: (cat: ToolCategory) => void
}

interface ActivityItemProps {
  title: string
  isActive: boolean
  onClick: () => void
  children: React.ReactNode
}

function ActivityItem({ title, isActive, onClick, children }: ActivityItemProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="relative flex h-12 w-12 cursor-pointer items-center justify-center focus:outline-none"
      style={{ color: isActive ? '#ffffff' : 'rgba(255,255,255,0.4)' }}
      onMouseEnter={e => {
        if (!isActive) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)'
      }}
      onMouseLeave={e => {
        if (!isActive) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'
      }}
    >
      {/* Active indicator — white left-edge strip */}
      {isActive && (
        <span
          className="absolute left-0 top-2 bottom-2 w-[2px] rounded-r"
          style={{ backgroundColor: '#ffffff' }}
        />
      )}
      {children}
    </button>
  )
}

export function ActivityBar({ activeCategory, sidebarOpen, onCategoryClick }: ActivityBarProps) {
  const { theme, toggle } = useTheme()

  return (
    <div
      className="flex w-12 shrink-0 flex-col items-center"
      style={{ backgroundColor: '#333333' }}
    >
      {CATEGORY_ORDER.map(cat => {
        const Icon = CATEGORY_ICONS[cat]
        const isActive = cat === activeCategory && sidebarOpen
        return (
          <ActivityItem
            key={cat}
            title={CATEGORY_LABELS[cat]}
            isActive={isActive}
            onClick={() => onCategoryClick(cat)}
          >
            <Icon className="h-6 w-6" />
          </ActivityItem>
        )
      })}

      <div className="mt-auto mb-1">
        <ActivityItem
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          isActive={false}
          onClick={toggle}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </ActivityItem>
      </div>
    </div>
  )
}
