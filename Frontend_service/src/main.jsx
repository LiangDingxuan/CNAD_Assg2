// Frontend_service/src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import TaskTestPage from './pages/TaskTestPage.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <TaskTestPage />
    </BrowserRouter>
  </React.StrictMode>,
)
