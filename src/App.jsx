import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Auth from './pages/Auth.jsx'
import NotFound from './pages/NotFound.jsx'

function App() {
  const location = useLocation()
  const isAuth = location.pathname.startsWith('/auth')

  return (
    <div >
      {!isAuth && (
        <header className="border-b border-white/10">
          <div className="mx-auto ">
            <div className="text-sm font-semibold tracking-wide">EWITH JWELLARY</div>
            <nav className="flex items-center gap-4 text-sm">
              <NavLink
                to="/"
                className={({ isActive }) => (isActive ? 'text-white' : 'text-zinc-300 hover:text-white')}
                end
              >
                Home
              </NavLink>
              <NavLink
                to="/auth"
                className={({ isActive }) => (isActive ? 'text-white' : 'text-zinc-300 hover:text-white')}
              >
                Auth
              </NavLink>
            </nav>
          </div>
        </header>
      )}

      <main >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
