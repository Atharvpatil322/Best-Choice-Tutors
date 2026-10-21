import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import './index.css'
import './styles/Profile.css'
import { initCache } from './utils/cache.js'
import { loadSubjectSlugs } from './hooks/useSubjectSlugs.js'

// Initialize cache (sets up logout listener)
initCache();

// Current subject page URLs, so subject links follow the admin's slugs.
loadSubjectSlugs();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>,
)
