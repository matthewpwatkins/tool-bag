import { useEffect, useRef } from 'react'
import { useMenubarContext, type MenubarActions } from '@/contexts/MenubarContext'
import type { PanelMode } from '@/hooks/useToolPrefs'

export function useMenubarActions(actions: MenubarActions) {
  const { register } = useMenubarContext()
  const ref = useRef(actions)
  ref.current = actions

  const hasFileOpen = !!actions.fileOpen
  const hasFileSave = !!actions.fileSave
  const hasEditCopy = !!actions.editCopy
  const hasPanelMode = !!actions.onPanelModeChange

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    register({
      // Proxy functions always call the latest handler (stale-closure safety)
      fileOpen: hasFileOpen ? () => ref.current.fileOpen?.() : undefined,
      fileOpenAccept: ref.current.fileOpenAccept,
      fileSave: hasFileSave ? () => ref.current.fileSave?.() : undefined,
      fileSaveDisabled: ref.current.fileSaveDisabled,
      editCopy: hasEditCopy ? () => ref.current.editCopy?.() : undefined,
      editCopyDisabled: ref.current.editCopyDisabled,
      panelMode: ref.current.panelMode,
      onPanelModeChange: hasPanelMode
        ? (m: PanelMode) => ref.current.onPanelModeChange?.(m)
        : undefined,
    })
    return () => register({})
  }, [
    register,
    hasFileOpen,
    actions.fileOpenAccept,
    hasFileSave,
    actions.fileSaveDisabled,
    hasEditCopy,
    actions.editCopyDisabled,
    actions.panelMode,
    hasPanelMode,
  ])
}
