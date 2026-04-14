import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { PanelMode } from '@/hooks/useToolPrefs'

export interface MenubarActions {
  fileOpen?: () => void | Promise<void>
  fileOpenAccept?: string
  fileSave?: () => void
  fileSaveDisabled?: boolean
  editCopy?: () => void | Promise<void>
  editCopyDisabled?: boolean
  panelMode?: PanelMode
  onPanelModeChange?: (mode: PanelMode) => void
}

interface ContextValue {
  actions: MenubarActions
  register: (actions: MenubarActions) => void
}

const MenubarContext = createContext<ContextValue>({
  actions: {},
  register: () => {},
})

export function MenubarProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<MenubarActions>({})
  const register = useCallback((a: MenubarActions) => setActions(a), [])
  return (
    <MenubarContext.Provider value={{ actions, register }}>
      {children}
    </MenubarContext.Provider>
  )
}

export function useMenubarContext() {
  return useContext(MenubarContext)
}
