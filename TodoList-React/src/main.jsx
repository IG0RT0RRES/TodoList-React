import { Buffer } from 'buffer';
window.Buffer = Buffer;
window.global = window;

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// 👇 Adicione esta linha importando o CSS do Tailwind
import './css/index.css' // (ou './css/index.css', dependendo de onde criou o arquivo)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)