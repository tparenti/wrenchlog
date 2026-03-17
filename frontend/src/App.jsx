import React from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Home from './pages/Home'
import PeoplePage from './pages/PeoplePage'
import VehiclesPage from './pages/VehiclesPage'
import VehicleDetail from './pages/VehicleDetail'
import EquipmentPage from './pages/EquipmentPage'
import EquipmentDetail from './pages/EquipmentDetail'
import PersonDetail from './pages/PersonDetail'
import ThemeToggle from './components/ThemeToggle'

function App(){
  const navItemClass = ({ isActive }) => isActive ? 'nav-link active' : 'nav-link'

  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="app-header">
          <div className="brand-lockup">
            <div className="brand-mark">WL</div>
            <div className="brand-copy">
              <h1 className="brand-title">WrenchLog</h1>
              <p className="brand-subtitle">Track owners, assets, and service history in one place.</p>
            </div>
          </div>

          <nav className="app-nav">
            <NavLink to="/" className={navItemClass}>Home</NavLink>
            <NavLink to="/people" className={navItemClass}>People</NavLink>
            <NavLink to="/vehicles" className={navItemClass}>Vehicles</NavLink>
            <NavLink to="/equipment" className={navItemClass}>Equipment</NavLink>
            <ThemeToggle />
          </nav>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home/>} />
            <Route path="/people" element={<PeoplePage/>} />
            <Route path="/people/:id" element={<PersonDetail/>} />
            <Route path="/vehicles" element={<VehiclesPage/>} />
            <Route path="/vehicles/:id" element={<VehicleDetail/>} />
            <Route path="/equipment" element={<EquipmentPage/>} />
            <Route path="/equipment/:id" element={<EquipmentDetail/>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
