'use client'
import { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'fucsia' | 'azul'
const Ctx = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: 'fucsia',
  setTheme: () => {},
})
export const useTheme = () => useContext(Ctx)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('fucsia')

  useEffect(() => {
    const t = localStorage.getItem('mio.theme') as Theme | null
    if (t === 'fucsia' || t === 'azul') setThemeState(t)
  }, [])

  const setTheme = (t: Theme) => {
    setThemeState(t)
    document.documentElement.dataset.theme = t
    localStorage.setItem('mio.theme', t)
  }

  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const opts: { id: Theme; label: string; color: string }[] = [
    { id: 'fucsia', label: 'Tema fucsia', color: '#e91e8c' },
    { id: 'azul', label: 'Tema azul', color: '#1f627b' },
  ]
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-line bg-surface p-1" role="group" aria-label="Color de la app">
      {opts.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => setTheme(o.id)}
          aria-label={o.label}
          aria-pressed={theme === o.id}
          title={o.label}
          className={`h-6 w-6 rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${
            theme === o.id ? 'ring-2 ring-offset-2 ring-ink/70' : 'opacity-70 hover:opacity-100'
          }`}
          style={{ background: o.color }}
        />
      ))}
    </div>
  )
}
