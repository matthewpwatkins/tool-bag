import { lazy } from 'react'
import { Braces } from 'lucide-react'
import type { ToolDefinition } from '../types'

const tool: ToolDefinition = {
  id: 'json-beautify',
  name: 'JSON Beautifier',
  category: 'format',
  description: 'Pretty-print JSON with indentation',
  icon: Braces,
  component: lazy(() => import('./JsonBeautify')),
}

export default tool
