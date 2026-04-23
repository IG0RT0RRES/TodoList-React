import { BrowserRouter,Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import PrivacyPolicy from './components/PrivacyPolicy'
import DeveloperProfile from './components/DeveloperProfile'
import AuthForm from './components/AuthForm'
import LeaderBoard from './components/LeaderBoard'

function App() {
  return (
        <div>
          <BrowserRouter>
            <Routes>
              <Route path='/' element={<Home/>}/>
              <Route path="/privacidade" element={<PrivacyPolicy/>} />
              <Route path="/dev" element={<DeveloperProfile/>} />
              <Route path="*" element={<h1>404 - Página Não Encontrada</h1>} />
              <Route path="/Cadastro" element={<AuthForm/>}/>
              <Route path="/LeaderBoard" element={<LeaderBoard/>}/>
            </Routes>
          </BrowserRouter>
        </div>)
}
export default App
