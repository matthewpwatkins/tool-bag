import { lazy } from 'react'
import { PackageMinus } from 'lucide-react'
import type { ToolDefinition } from '../types'

const tool: ToolDefinition = {
  id: 'js-minify',
  name: 'JS Minifier',
  category: 'format',
  description: 'Minify JavaScript using Terser',
  icon: PackageMinus,
  component: lazy(() => import('./JsMinify')),
}

export default tool
