import { lazy } from 'react'
import { Wand2 } from 'lucide-react'
import type { ToolDefinition } from '../types'

const tool: ToolDefinition = {
  id: 'js-transform',
  name: 'JS Transform',
  category: 'transform',
  description: 'Transform JSON/YAML/XML data with a custom JS function',
  icon: Wand2,
  component: lazy(() => import('./JsTransform')),
}

export default tool
