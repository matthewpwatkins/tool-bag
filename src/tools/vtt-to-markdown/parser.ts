export interface VttCue {
  start: string
  speaker: string
  text: string
}

export interface ConversionOptions {
  includeTimestamps: boolean
}

function formatTimestamp(ts: string): string {
  // Strip milliseconds, remove leading "00:" (hours) if zero
  const noMs = ts.split('.')[0]
  return noMs.replace(/^00:/, '')
}

export function parseVtt(raw: string): VttCue[] {
  const lines = raw.split(/\r?\n/)
  const cues: VttCue[] = []
  let i = 0

  // Skip WEBVTT header and any preamble until first timestamp
  while (i < lines.length && !lines[i].includes('-->')) i++

  while (i < lines.length) {
    const line = lines[i]
    if (!line.includes('-->')) { i++; continue }

    const [startRaw] = line.split('-->')
    const start = formatTimestamp(startRaw.trim())

    // Collect text lines after the timestamp line
    const textLines: string[] = []
    i++
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].includes('-->')) {
      textLines.push(lines[i].trim())
      i++
    }

    const fullText = textLines.join(' ')
    // Extract speaker from <v Speaker Name>text</v> format
    const speakerMatch = fullText.match(/^<v ([^>]+)>([\s\S]*?)(?:<\/v>)?$/)

    if (speakerMatch) {
      cues.push({
        start,
        speaker: speakerMatch[1].trim(),
        text: speakerMatch[2].trim(),
      })
    } else if (fullText.trim()) {
      cues.push({ start, speaker: '', text: fullText.trim() })
    }
  }

  return cues
}

export function mergeConsecutiveSpeakers(cues: VttCue[]): VttCue[] {
  const merged: VttCue[] = []
  for (const cue of cues) {
    const last = merged[merged.length - 1]
    if (last && last.speaker === cue.speaker && cue.speaker !== '') {
      last.text = last.text + ' ' + cue.text
    } else {
      merged.push({ ...cue })
    }
  }
  return merged
}

export function parseSrt(raw: string): VttCue[] {
  const lines = raw.split(/\r?\n/)
  const cues: VttCue[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()

    if (!line || /^\d+$/.test(line)) { i++; continue }

    if (line.includes('-->')) {
      // Normalize SRT timestamps (commas → periods for ms separator)
      const normalized = line.replace(/,/g, '.')
      const [startRaw] = normalized.split('-->')
      const start = formatTimestamp(startRaw.trim())

      const textLines: string[] = []
      i++
      while (i < lines.length && lines[i].trim() !== '') {
        // Strip HTML-like tags some SRT files include
        textLines.push(lines[i].trim().replace(/<[^>]+>/g, ''))
        i++
      }

      const fullText = textLines.join(' ').trim()
      if (!fullText) continue

      // Detect "Speaker Name: text" — speaker must be 1-4 word-like tokens
      const speakerMatch = fullText.match(/^((?:[\w-]+(?:\s+[\w-]+){0,3})):\s+(.+)$/)
      if (speakerMatch) {
        cues.push({ start, speaker: speakerMatch[1].trim(), text: speakerMatch[2].trim() })
      } else {
        cues.push({ start, speaker: '', text: fullText })
      }
    } else {
      i++
    }
  }

  return cues
}

export function detectFormat(raw: string): 'vtt' | 'srt' {
  return raw.trimStart().startsWith('WEBVTT') ? 'vtt' : 'srt'
}

export function vttToMarkdown(raw: string, opts: ConversionOptions): string {
  const cues = detectFormat(raw) === 'vtt' ? parseVtt(raw) : parseSrt(raw)
  const merged = mergeConsecutiveSpeakers(cues)

  return merged
    .map(cue => {
      const speaker = cue.speaker || 'Unknown'
      // Timestamps go inside the bold name section: **Speaker (0:00:32)**: text
      const boldLabel = opts.includeTimestamps
        ? `**${speaker} (${cue.start})**`
        : `**${speaker}**`
      return `${boldLabel}: ${cue.text}`
    })
    .join('\n\n')
}
