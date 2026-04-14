import { lazy } from 'react'
import { FileText } from 'lucide-react'
import type { ToolDefinition } from '../types'

const tool: ToolDefinition = {
  id: 'markdown-editor',
  name: 'Markdown Editor',
  category: 'markdown',
  description: 'Edit markdown with live preview',
  icon: FileText,
  component: lazy(() => import('./MarkdownEditor')),
}

export default tool
