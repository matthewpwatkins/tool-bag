import { lazy } from 'react'
import { Code2 } from 'lucide-react'
import type { ToolDefinition } from '../types'

const tool: ToolDefinition = {
  id: 'js-pretty',
  name: 'JS Formatter',
  category: 'format',
  description: 'Format JavaScript with Prettier',
  icon: Code2,
  component: lazy(() => import('./JsPretty')),
}

export default tool
