import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/design-system.css'
import App from './App.tsx'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { PremiumProvider } from './lib/premium'
import { ToastProvider } from './contexts/ToastContext'
import { handleGoogleRedirect } from './lib/googleAuth'

handleGoogleRedirect()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <PremiumProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </PremiumProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
