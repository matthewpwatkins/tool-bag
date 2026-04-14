import { lazy } from 'react'
import { Braces } from 'lucide-react'
import type { ToolDefinition } from '../types'

const tool: ToolDefinition = {
  id: 'formatter',
  name: 'Formatter',
  category: 'format',
  description: 'Format, beautify, or minify code in many languages',
  icon: Braces,
  component: lazy(() => import('./Formatter')),
}

export default tool
