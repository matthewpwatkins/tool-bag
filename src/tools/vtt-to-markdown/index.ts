import { lazy } from 'react'
import { Captions } from 'lucide-react'
import type { ToolDefinition } from '../types'

const tool: ToolDefinition = {
  id: 'vtt-to-markdown',
  name: 'VTT to Markdown',
  category: 'transform',
  description: 'Convert WebVTT meeting transcripts to Markdown',
  icon: Captions,
  component: lazy(() => import('./VttToMarkdown')),
}

export default tool
