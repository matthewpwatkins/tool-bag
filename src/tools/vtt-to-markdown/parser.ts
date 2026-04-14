export interface VttCue {
  start: string
  speaker: string
  text: string
}

export interface ConversionOptions {
  includeTimestamps: boolean
}

function formatTimestamp(ts: string): string {
  // Trim to HH:MM:SS or MM:SS — drop milliseconds for readability
  const parts = ts.split('.')
  return parts[0].replace(/^00:/, '') // strip leading "00:" if hours are 0
}

export function parseVtt(raw: string): VttCue[] {
  const lines = raw.split(/\r?\n/)
  const cues: VttCue[] = []
  let i = 0

  // Skip WEBVTT header line
  while (i < lines.length && !lines[i].includes('-->')) i++

  while (i < lines.length) {
    const line = lines[i]
    if (!line.includes('-->')) { i++; continue }

    const [startRaw] = line.split('-->')
    const start = startRaw.trim()

    // Collect text lines after the timestamp
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
        start: formatTimestamp(start),
        speaker: speakerMatch[1].trim(),
        text: speakerMatch[2].trim(),
      })
    } else if (fullText.trim()) {
      cues.push({ start: formatTimestamp(start), speaker: '', text: fullText.trim() })
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

export function vttToMarkdown(raw: string, opts: ConversionOptions): string {
  const cues = parseVtt(raw)
  const merged = mergeConsecutiveSpeakers(cues)

  return merged
    .map(cue => {
      const speaker = cue.speaker ? `**${cue.speaker}**` : '*Unknown*'
      const timestamp = opts.includeTimestamps ? ` (${cue.start})` : ''
      return `${speaker}${timestamp}: ${cue.text}`
    })
    .join('\n\n')
}
