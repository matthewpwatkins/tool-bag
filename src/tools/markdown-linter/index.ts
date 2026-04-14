import { lazy } from 'react'
import { CheckSquare } from 'lucide-react'
import type { ToolDefinition } from '../types'

const tool: ToolDefinition = {
  id: 'markdown-linter',
  name: 'Markdown Linter',
  category: 'markdown',
  description: 'Lint markdown files for style issues',
  icon: CheckSquare,
  component: lazy(() => import('./MarkdownLinter')),
}

export default tool
