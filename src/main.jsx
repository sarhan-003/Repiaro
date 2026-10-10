import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { BookingProvider } from './context/BookingContext'
import { CustomerProvider } from './context/CustomerContext'
import { PlatformProvider } from './context/PlatformContext'
import { ToastProvider } from './context/ToastContext'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <PlatformProvider>
        <CustomerProvider>
          <BookingProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </BookingProvider>
        </CustomerProvider>
      </PlatformProvider>
    </BrowserRouter>
  </StrictMode>,
)
