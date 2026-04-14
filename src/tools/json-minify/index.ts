import { lazy } from 'react'
import { Minimize2 } from 'lucide-react'
import type { ToolDefinition } from '../types'

const tool: ToolDefinition = {
  id: 'json-minify',
  name: 'JSON Minifier',
  category: 'format',
  description: 'Minify JSON by removing whitespace',
  icon: Minimize2,
  component: lazy(() => import('./JsonMinify')),
}

export default tool
