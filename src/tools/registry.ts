import type { ToolDefinition } from './types'
import jsonMinify from './json-minify'
import jsonBeautify from './json-beautify'
import jsMinify from './js-minify'
import jsPretty from './js-pretty'
import jsonYamlXml from './json-yaml-xml'
import markdownEditor from './markdown-editor'
import markdownLinter from './markdown-linter'
import vttToMarkdown from './vtt-to-markdown'
import jsTransform from './js-transform'

export const registry: ToolDefinition[] = [
  jsonMinify,
  jsonBeautify,
  jsMinify,
  jsPretty,
  jsonYamlXml,
  markdownEditor,
  markdownLinter,
  vttToMarkdown,
  jsTransform,
]
