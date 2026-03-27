import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { store } from './app/store'
import './styles/index.css'
import App from './app/App'

import { ToastProvider } from './infrastructure/context/ToastContext'
import { ConfirmProvider } from './infrastructure/context/ConfirmContext'
import { ErrorBoundary } from './infrastructure/ErrorBoundary'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <ToastProvider>
        <ConfirmProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </BrowserRouter>
        </ConfirmProvider>
      </ToastProvider>
    </Provider>
  </StrictMode>,
)
