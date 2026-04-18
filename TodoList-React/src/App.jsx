import { BrowserRouter,Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import PrivacyPolicy from './components/PrivacyPolicy'
import Developer from './components/Developer'

function App() {
  return (
        <div>
          <BrowserRouter>
            <Routes>
              <Route path='/' element={<Home/>}/>
              <Route path="/privacidade" element={<PrivacyPolicy/>} />
              <Route path="/dev" element={<Developer/>} />
            </Routes>
          </BrowserRouter>
        </div>)
}
export default App
