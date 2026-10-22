import type { Metadata } from 'next'
import { Bricolage_Grotesque, Figtree } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/components/auth-provider'

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--f-display' })
const body = Figtree({ subsets: ['latin'], variable: '--f-body' })

export const metadata: Metadata = {
  title: 'Mio · Pedidos de tus lives',
  description: 'Registra y sigue los pedidos que vendes por TikTok Live.',
}

const themeScript = `try{var t=localStorage.getItem('mio.theme');if(t==='fucsia'||t==='azul')document.documentElement.dataset.theme=t}catch(e){}`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="fucsia" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
