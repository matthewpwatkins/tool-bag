import { lazy } from 'react'
import { GitCompare } from 'lucide-react'
import type { ToolDefinition } from '../types'

const tool: ToolDefinition = {
  id: 'diff',
  name: 'Diff',
  category: 'compare',
  description: 'Compare two text snippets with a VS Code-style diff view',
  icon: GitCompare,
  component: lazy(() => import('./DiffTool')),
}

export default tool
