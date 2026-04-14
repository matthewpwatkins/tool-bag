import type { ComponentType, LazyExoticComponent } from 'react'
import type { LucideIcon } from 'lucide-react'

export type ToolCategory = 'format' | 'convert' | 'markdown' | 'transform'

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  format: 'Format',
  convert: 'Convert',
  markdown: 'Markdown',
  transform: 'Transform',
}

export interface ToolDefinition {
  id: string
  name: string
  category: ToolCategory
  description: string
  icon: LucideIcon
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: LazyExoticComponent<ComponentType<any>>
}
