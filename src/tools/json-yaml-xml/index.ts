import { lazy } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import type { ToolDefinition } from '../types'

const tool: ToolDefinition = {
  id: 'json-yaml-xml',
  name: 'JSON / YAML / XML',
  category: 'convert',
  description: 'Convert between JSON, YAML, and XML formats',
  icon: ArrowLeftRight,
  component: lazy(() => import('./JsonYamlXml')),
}

export default tool
