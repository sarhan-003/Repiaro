import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { BookingProvider } from './context/BookingContext'
import { ToastProvider } from './context/ToastContext'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <BookingProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </BookingProvider>
    </BrowserRouter>
  </StrictMode>,
)
