import { useState, useCallback, useEffect, useRef } from 'react'
import { Play } from 'lucide-react'
import { vttToMarkdown } from './parser'
import { CodeEditor } from '@/components/editor/CodeEditor'
import { FileIOBar } from '@/components/editor/FileIOBar'
import { DualPanelLayout } from '@/components/layout/DualPanelLayout'
import { Button } from '@/components/ui/button'
import { useFileIO } from '@/hooks/useFileIO'
import { useMenubarActions } from '@/hooks/useMenubarActions'

const STAR_WARS_VTT = `WEBVTT

1
00:00:01.000 --> 00:00:03.500
<v Luke Skywalker>Father, I can feel the conflict within you. Let go of your hate.</v>

2
00:00:04.200 --> 00:00:06.800
<v Darth Vader>It is too late for me, son.</v>

3
00:00:07.500 --> 00:00:09.200
<v Luke Skywalker>Then my father is truly dead.</v>

4
00:00:10.000 --> 00:00:14.500
<v Emperor Palpatine>Ha ha ha. So be it, Jedi. If you will not be turned, you will be destroyed.</v>

5
00:00:15.000 --> 00:00:17.500
<v Luke Skywalker>I'll never turn to the dark side.</v>

6
00:00:18.000 --> 00:00:22.000
<v Luke Skywalker>You've failed, Your Highness. I am a Jedi, like my father before me.</v>

7
00:00:23.000 --> 00:00:27.500
<v Emperor Palpatine>Then you will die. Strike him down with all of your hatred and your journey towards the dark side will be complete.</v>

8
00:00:28.500 --> 00:00:31.000
<v Darth Vader>Luke, help me take this mask off.</v>

9
00:00:31.500 --> 00:00:33.000
<v Luke Skywalker>But you'll die.</v>

10
00:00:33.500 --> 00:00:38.000
<v Darth Vader>Nothing can stop that now. Just for once, let me look on you with my own eyes.</v>

11
00:00:39.000 --> 00:00:43.000
<v Darth Vader>You were right about me. Tell your sister, you were right.</v>

12
00:00:44.000 --> 00:00:46.500
<v Luke Skywalker>I've got to save you.</v>

13
00:00:47.000 --> 00:00:50.000
<v Obi-Wan Kenobi>Luke, you can't save him. The Emperor will show you the true nature of the Force.</v>`

export default function VttToMarkdown() {
  const [input, setInput] = useState(STAR_WARS_VTT)
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [includeTimestamps, setIncludeTimestamps] = useState(false)
  const didAutoRun = useRef(false)
  const { openFile, downloadFile, copyToClipboard } = useFileIO()

  const runWith = useCallback((text: string, timestamps: boolean) => {
    setError('')
    if (!text.trim()) return
    try {
      setOutput(vttToMarkdown(text, { includeTimestamps: timestamps }))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setOutput('')
    }
  }, [])

  const run = useCallback(() => runWith(input, includeTimestamps), [input, includeTimestamps, runWith])

  useEffect(() => {
    if (!didAutoRun.current) {
      didAutoRun.current = true
      runWith(STAR_WARS_VTT, false)
    }
  }, [runWith])

  const handleOpen = useCallback(async () => {
    try {
      const text = await openFile('.vtt,.txt')
      setInput(text)
      runWith(text, includeTimestamps)
    } catch { /* cancelled */ }
  }, [openFile, includeTimestamps, runWith])

  const handleSave = useCallback(() => {
    downloadFile(output, 'transcript.md', 'text/markdown')
  }, [downloadFile, output])

  const handleCopy = useCallback(async () => {
    await copyToClipboard(output)
  }, [copyToClipboard, output])

  useMenubarActions({
    fileOpen: handleOpen,
    fileOpenAccept: '.vtt,.txt',
    fileSave: handleSave,
    fileSaveDisabled: !output,
    editCopy: handleCopy,
    editCopyDisabled: !output,
  })

  return (
    <DualPanelLayout
      left={
        <>
          <FileIOBar
            label="Input VTT"
            actions={
              <div className="flex items-center gap-2">
                {error && <span className="text-[11px] text-destructive max-w-[180px] truncate">{error}</span>}
                <label className="flex cursor-pointer items-center gap-1.5 select-none text-[11px] text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={includeTimestamps}
                    onChange={e => {
                      setIncludeTimestamps(e.target.checked)
                      runWith(input, e.target.checked)
                    }}
                    className="h-3 w-3"
                  />
                  Timestamps
                </label>
                <Button size="sm" onClick={run} className="h-6 px-2 text-xs gap-1">
                  <Play className="h-3 w-3" />
                  Convert
                </Button>
              </div>
            }
          />
          <div className="flex-1 overflow-hidden">
            <CodeEditor value={input} onChange={setInput} language="plaintext" />
          </div>
        </>
      }
      right={
        <>
          <FileIOBar label="Output Markdown" />
          <div className="flex-1 overflow-hidden">
            <CodeEditor value={output} language="markdown" readOnly />
          </div>
        </>
      }
    />
  )
}
