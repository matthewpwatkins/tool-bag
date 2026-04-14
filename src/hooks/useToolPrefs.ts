import { useState } from 'react'

export type PanelMode = 'single' | 'dual'

interface ToolPrefs {
  panelMode: PanelMode
}

function getStoredPrefs(toolId: string): ToolPrefs {
  try {
    const raw = localStorage.getItem(`toolbox-prefs-${toolId}`)
    if (raw) return { panelMode: 'dual', ...JSON.parse(raw) }
  } catch {
    // ignore
  }
  return { panelMode: 'dual' }
}

function savePrefs(toolId: string, prefs: ToolPrefs) {
  localStorage.setItem(`toolbox-prefs-${toolId}`, JSON.stringify(prefs))
}

export function useToolPrefs(toolId: string) {
  const [prefs, setPrefs] = useState<ToolPrefs>(() => getStoredPrefs(toolId))

  function setPanelMode(mode: PanelMode) {
    const next = { ...prefs, panelMode: mode }
    setPrefs(next)
    savePrefs(toolId, next)
  }

  return { panelMode: prefs.panelMode, setPanelMode }
}
