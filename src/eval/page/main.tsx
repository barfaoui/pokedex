import '@fontsource/press-start-2p/latin-400.css'
import '@fontsource/vt323/latin-400.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/global.scss'
import { EvalPage } from './EvalPage/EvalPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <EvalPage />
  </StrictMode>,
)
