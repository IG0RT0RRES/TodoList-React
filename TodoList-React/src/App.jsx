import { BrowserRouter,Routes, Route } from 'react-router-dom'
import Home from './components/Home'
// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'

function App() {
  return (
        <div>
          <BrowserRouter>
            <Routes>
              <Route path='/' element={<Home/>}/>
            </Routes>
          </BrowserRouter>
        </div>)
}
export default App
