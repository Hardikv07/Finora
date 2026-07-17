import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './hooks/useToast'
import { FinanceProvider } from './hooks/useFinanceData'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <FinanceProvider>
        <App />
      </FinanceProvider>
    </ToastProvider>
  </StrictMode>,
)
