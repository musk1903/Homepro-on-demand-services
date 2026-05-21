import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './dark-theme.css'
import App from './App.tsx'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ToastProvider } from '@/components/ToastProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="homepro-theme">
      <App />
      <ToastProvider />
    </ThemeProvider>
  </StrictMode>,
)

