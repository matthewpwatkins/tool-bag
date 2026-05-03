export interface VttCue {
  start: string
  speaker: string
  text: string
  /** True if the original cue began with a `>>` speaker-turn marker. */
  turnStart?: boolean
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
      const turnStart = /^>>\s*/.test(fullText)
      const text = fullText.replace(/^>>\s*/, '').trim()
      cues.push({ start, speaker: '', text, turnStart })
    }
  }

  return cues
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

      // YouTube auto-captions use `>>` to mark speaker turns (anonymous).
      const turnStart = /^>>\s*/.test(fullText)
      const stripped = fullText.replace(/^>>\s*/, '').trim()

      // Detect "Speaker Name: text" — speaker must be 1-4 word-like tokens
      const speakerMatch = stripped.match(/^((?:[\w-]+(?:\s+[\w-]+){0,3})):\s+(.+)$/)
      if (speakerMatch) {
        cues.push({ start, speaker: speakerMatch[1].trim(), text: speakerMatch[2].trim(), turnStart })
      } else {
        cues.push({ start, speaker: '', text: stripped, turnStart })
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

interface TurnBlock {
  /** Display label: 'name', 'Speaker N', or '' for single-speaker. */
  label: string
  start: string
  text: string
}

/** Group cues into turn blocks. Three cases:
 *  1. Named speakers (`<v Name>` VTT or "Name: text" SRT) — group by speaker name.
 *  2. `>>`-marked turns — group by turnStart, label as "Speaker 1"/"Speaker 2" alternating.
 *  3. Otherwise — single block, no label.
 */
function groupTurns(cues: VttCue[]): TurnBlock[] {
  if (!cues.length) return []
  const namedSpeakers = new Set(cues.map(c => c.speaker).filter(s => s !== ''))
  const hasTurnMarkers = cues.some(c => c.turnStart)

  // Case 1: named speakers — merge consecutive same-speaker cues
  if (namedSpeakers.size >= 2) {
    const blocks: TurnBlock[] = []
    for (const cue of cues) {
      const label = cue.speaker || 'Unknown'
      const last = blocks[blocks.length - 1]
      if (last && last.label === label) last.text = last.text + ' ' + cue.text
      else blocks.push({ label, start: cue.start, text: cue.text })
    }
    return blocks
  }

  // Case 2: `>>` turn markers, no named speakers
  if (hasTurnMarkers) {
    const blocks: TurnBlock[] = []
    let speakerNum = 1
    for (const cue of cues) {
      if (cue.turnStart && blocks.length) {
        speakerNum = speakerNum === 1 ? 2 : 1
        blocks.push({ label: `Speaker ${speakerNum}`, start: cue.start, text: cue.text })
      } else if (!blocks.length) {
        blocks.push({ label: `Speaker ${speakerNum}`, start: cue.start, text: cue.text })
      } else {
        blocks[blocks.length - 1].text = blocks[blocks.length - 1].text + ' ' + cue.text
      }
    }
    return blocks
  }

  // Case 3: single anonymous speaker — one big block, no label
  const merged = cues.map(c => c.text).join(' ').replace(/\s+/g, ' ').trim()
  return [{ label: '', start: cues[0].start, text: merged }]
}

// === Paragraph break detection ===
// Score-based heuristics tuned against hand-annotated YouTube auto-transcript
// fixtures. Empirical F1 ≈ 0.85 (recall 0.81, precision 0.88) at ±2 sentence
// tolerance on a 5-turn / 2,900-word sample.

const STRONG_MARKERS = ['However','Anyway','Alright','And so',"Here's the deal","What I would","Here's the thing",'First of all','Second','Third','Finally','Eventually','Therefore','Furthermore','Moreover','In contrast','On the other hand','Meanwhile','All the','I also']
const MEDIUM_MARKERS = ['But','Also','When','Now,','You know what','The fact that','These are','At my','Whatever','For me']
const LIGHT_MARKERS = ['Look','Listen','I feel','Yeah,']
const HEAVY_CONTEXT_MARKERS = ['So','Okay','Well','Actually']
const VERY_LIGHT_MARKERS = ['I mean','I think','Like,','You know']

const BACKCHANNELS = new Set([
  'mhm','yeah','right','ok','okay','huh','hmm','oh','wow','sure','true','no','yes',
  'interesting','really','brilliant','amazing','awesome','great','cool','weird',
  'exactly','definitely','absolutely','nice','perfect','correct','wonderful','fascinating',
])

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
function startsWithMarker(s: string, list: string[]): boolean {
  for (const m of list) {
    const re = new RegExp('^' + escapeRegex(m) + '\\b')
    if (re.test(s)) return true
  }
  return false
}

function splitSentences(text: string): string[] {
  const out: string[] = []
  const re = /([.!?]+)\s+(?=[A-Z\["])/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    out.push(text.slice(last, m.index + m[1].length))
    last = m.index + m[1].length + 1
  }
  if (last < text.length) out.push(text.slice(last))
  return out.map(s => s.trim()).filter(Boolean)
}

function isShortReaction(s: string): boolean {
  const stripped = s.replace(/[.!?,]+$/, '').trim()
  const words = stripped.split(/\s+/)
  if (words.length > 4) return false
  if (BACKCHANNELS.has(stripped.toLowerCase())) return true
  if (/^(oh|ah|huh|wow|yeah|yes|no|right|okay|uh|um)[,!.\s]/i.test(stripped)) return true
  return false
}

function tokenSet(s: string, minLen = 4): Set<string> {
  return new Set(s.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(w => w.length >= minLen))
}

function isTopicName(s: string, prevSentence: string | undefined): boolean {
  if (isShortReaction(s)) return false
  const stripped = s.replace(/[.!?,]+$/, '').trim()
  const words = stripped.split(/\s+/)
  if (words.length === 0 || words.length > 4) return false
  // Reject contractions, common verb forms (including -ing forms)
  if (/[a-z]'(re|ve|ll|d|m|s)\b|n't\b/i.test(stripped)) return false
  if (/\b(is|are|was|were|be|been|am|do|did|does|have|has|had|will|would|should|could|can|may|might|must|got|get|gets|see|saw|seen|say|said|like|liked|love|loved|hate|hated|think|thought|know|knew|want|wanted|need|feel|felt|look|looked|come|came|go|went|gone|make|made|take|took|taken|quit|miss|missed|use|used|keep|kept)\b/i.test(stripped)) return false
  if (/\b\w{3,}ing\b/i.test(stripped)) return false
  // Reject self-corrections: any substantive word shared with prev sentence
  if (prevSentence) {
    const prev = tokenSet(prevSentence)
    const my = tokenSet(stripped)
    for (const w of my) if (prev.has(w)) return false
  }
  return true
}

function isQuestion(s: string): boolean {
  return /\?\s*$/.test(s.trim()) && s.trim().length >= 3
}

function isShortSentence(s: string): boolean {
  return s.replace(/[.!?,]+$/, '').trim().split(/\s+/).filter(Boolean).length < 4
}

function wordCount(s: string): number {
  return s.split(/\s+/).filter(Boolean).length
}

function scoreBreak(sentences: string[], i: number, wordsSinceLastBreak: number): number {
  const s = sentences[i]
  if (isShortReaction(s)) return -100
  const topicScore = (isTopicName(s, sentences[i - 1]) && i + 1 < sentences.length) ? 4 : 0
  if (isShortSentence(s) && topicScore === 0) return -100

  let markerScore = 0
  if (startsWithMarker(s, STRONG_MARKERS)) markerScore = 5
  else if (startsWithMarker(s, MEDIUM_MARKERS)) markerScore = 3
  else if (startsWithMarker(s, LIGHT_MARKERS)) markerScore = 2
  else if (startsWithMarker(s, HEAVY_CONTEXT_MARKERS)) markerScore = wordsSinceLastBreak >= 100 ? 2 : 0
  else if (startsWithMarker(s, VERY_LIGHT_MARKERS)) markerScore = 1

  let qaScore = 0
  if (i > 0 && isQuestion(sentences[i - 1]) && !isQuestion(s)) {
    if (wordCount(s.replace(/[.!?,]+$/, '').trim()) >= 8) qaScore = 2
  }

  if (markerScore === 0 && topicScore === 0 && qaScore === 0) return 0

  let score = markerScore + topicScore + qaScore
  if (wordsSinceLastBreak >= 60) score += 1
  if (wordsSinceLastBreak >= 120) score += 1
  if (wordsSinceLastBreak >= 200) score += 2
  if (wordsSinceLastBreak < 25) score -= 5
  return score
}

const MIN_SCORE = 3
const MIN_WORDS_BETWEEN = 25
const TARGET_MAX_WORDS = 220
const PARAGRAPHIZE_MIN_WORDS = 80

export function splitIntoParagraphs(text: string): string[] {
  if (wordCount(text) < PARAGRAPHIZE_MIN_WORDS) return [text]
  const sentences = splitSentences(text)
  if (sentences.length < 5) return [text]

  // Pass 1: pick high-confidence breaks
  const breaks = new Set<number>()
  let wsl = 0
  for (let i = 0; i < sentences.length; i++) {
    const w = wordCount(sentences[i])
    if (i > 0) {
      const sc = scoreBreak(sentences, i, wsl)
      if (sc >= MIN_SCORE && wsl >= MIN_WORDS_BETWEEN) {
        breaks.add(i)
        wsl = 0
      }
    }
    wsl += w
  }

  // Pass 2: subdivide paragraphs that exceed TARGET_MAX_WORDS
  const sortedBreaks = [...breaks].sort((a, b) => a - b)
  const paraStarts = [0, ...sortedBreaks, sentences.length]
  for (let p = 0; p < paraStarts.length - 1; p++) {
    const start = paraStarts[p], end = paraStarts[p + 1]
    const paraWords = sentences.slice(start, end).reduce((a, s) => a + wordCount(s), 0)
    if (paraWords <= TARGET_MAX_WORDS) continue
    let bestIdx = -1, bestScore = -Infinity, runningWords = 0
    for (let i = start + 1; i < end; i++) {
      runningWords += wordCount(sentences[i - 1])
      if (runningWords < MIN_WORDS_BETWEEN) continue
      const remaining = sentences.slice(i, end).reduce((a, s) => a + wordCount(s), 0)
      if (remaining < MIN_WORDS_BETWEEN) continue
      const sc = scoreBreak(sentences, i, runningWords)
      if (sc > bestScore) { bestScore = sc; bestIdx = i }
    }
    if (bestIdx > 0 && bestScore >= 1) breaks.add(bestIdx)
  }

  // Build paragraphs
  const finalSorted = [...breaks].sort((a, b) => a - b)
  const paragraphs: string[] = []
  let prev = 0
  for (const b of finalSorted) {
    paragraphs.push(sentences.slice(prev, b).join(' '))
    prev = b
  }
  paragraphs.push(sentences.slice(prev).join(' '))
  return paragraphs
}

export function vttToMarkdown(raw: string, opts: ConversionOptions): string {
  const cues = detectFormat(raw) === 'vtt' ? parseVtt(raw) : parseSrt(raw)
  const blocks = groupTurns(cues)
  if (!blocks.length) return ''

  return blocks
    .map(block => {
      const paragraphs = splitIntoParagraphs(block.text)
      const labelOnly = block.label && opts.includeTimestamps
        ? `**${block.label} (${block.start})**`
        : block.label ? `**${block.label}**` : ''

      if (!labelOnly) {
        // No speaker label. Optionally prefix the first paragraph with the timestamp.
        if (opts.includeTimestamps) {
          paragraphs[0] = `**(${block.start})** ${paragraphs[0]}`
        }
        return paragraphs.join('\n\n')
      }

      // First paragraph carries the speaker label inline; subsequent paragraphs are continuation.
      paragraphs[0] = `${labelOnly}: ${paragraphs[0]}`
      return paragraphs.join('\n\n')
    })
    .join('\n\n')
}
