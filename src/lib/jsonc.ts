/**
 * Parse JSON with Comments (JSONC).
 * Strips // line comments and /* block comments * / before parsing,
 * correctly ignoring comment-like sequences inside strings.
 */
export function parseJsonc(text: string): unknown {
  return JSON.parse(stripComments(text))
}

function stripComments(src: string): string {
  let out = ''
  let i = 0
  let inString = false
  let escaped = false

  while (i < src.length) {
    const ch = src[i]

    if (escaped) {
      out += ch
      escaped = false
      i++
      continue
    }

    if (ch === '\\' && inString) {
      out += ch
      escaped = true
      i++
      continue
    }

    if (ch === '"') {
      inString = !inString
      out += ch
      i++
      continue
    }

    if (!inString) {
      // Line comment
      if (ch === '/' && src[i + 1] === '/') {
        while (i < src.length && src[i] !== '\n' && src[i] !== '\r') i++
        continue
      }
      // Block comment
      if (ch === '/' && src[i + 1] === '*') {
        i += 2
        while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++
        i += 2
        continue
      }
    }

    out += ch
    i++
  }

  return out
}
