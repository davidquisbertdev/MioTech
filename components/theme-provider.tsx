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
    { id: 'fucsia', label: 'Tema fucsia', color: '#e0218a' },
    { id: 'azul', label: 'Tema azul', color: '#2a7a96' },
  ]
  return (
    <div className="inline-flex items-center gap-2.5 p-1" role="group" aria-label="Color de la app">
      {opts.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => setTheme(o.id)}
          aria-label={o.label}
          aria-pressed={theme === o.id}
          title={o.label}
          className={`h-5 w-5 cursor-pointer rounded-full transition-opacity duration-150 ${
            theme === o.id ? 'outline-2 outline-offset-2 outline-current' : 'opacity-60 hover:opacity-100'
          }`}
          style={{ background: o.color }}
        />
      ))}
    </div>
  )
}
