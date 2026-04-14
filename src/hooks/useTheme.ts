import { useState, useEffect } from 'react'

type Theme = 'light' | 'dark'

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getStoredTheme(): Theme | null {
  const v = localStorage.getItem('toolbox-theme')
  return v === 'light' || v === 'dark' ? v : null
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme() ?? getSystemTheme())

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    localStorage.setItem('toolbox-theme', theme)
  }, [theme])

  function toggle() {
    setThemeState(t => (t === 'dark' ? 'light' : 'dark'))
  }

  return { theme, toggle }
}
