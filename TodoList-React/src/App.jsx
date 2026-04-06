import { BrowserRouter,Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import PrivacyPolicy from './components/PrivacyPolicy'

function App() {
  return (
        <div>
          <BrowserRouter>
            <Routes>
              <Route path='/' element={<Home/>}/>
              <Route path="/privacidade" element={<PrivacyPolicy/>} />
            </Routes>
          </BrowserRouter>
        </div>)
}
export default App
