import { lazy } from 'react'
import { Captions } from 'lucide-react'
import type { ToolDefinition } from '../types'

const tool: ToolDefinition = {
  id: 'vtt-to-markdown',
  name: 'Transcript to Markdown',
  category: 'transform',
  description: 'Convert VTT or SRT meeting transcripts to Markdown',
  icon: Captions,
  component: lazy(() => import('./VttToMarkdown')),
}

export default tool
