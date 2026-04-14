import type { ToolDefinition } from './types'
import formatter from './formatter'
import jsonYamlXml from './json-yaml-xml'
import markdownEditor from './markdown-editor'
import vttToMarkdown from './vtt-to-markdown'
import jsTransform from './js-transform'

export const registry: ToolDefinition[] = [
  formatter,
  jsonYamlXml,
  markdownEditor,
  vttToMarkdown,
  jsTransform,
]
