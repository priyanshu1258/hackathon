import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

function Navbar() {
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const isActive = (path) => {
    return location.pathname === path
  }

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleLinkClick = () => {
    setIsMenuOpen(false)
  }

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [location])

  return (
    <nav className="modern-card sticky top-0 z-50 backdrop-blur-xl bg-opacity-95 border-b-2">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-3 font-bold text-xl gradient-text hover:scale-105 transition-transform duration-300">
            <span className="text-3xl">🌱</span>
           ReVibe
          </Link>
          
          <div className="flex items-center gap-4">
            {/* Desktop Navigation */}
            <ul className="hidden md:flex gap-2">
              <li>
                <Link 
                  to="/" 
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 premium-btn ${
                    isActive('/') 
                      ? 'gradient-bg-primary text-white shadow-lg' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={handleLinkClick}
                >
                  <span className="text-xl">📊</span>
                  <span className="font-medium">Dashboard</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/electricity" 
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 premium-btn ${
                    isActive('/electricity')
                      ? 'gradient-bg-electricity text-white shadow-lg' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={handleLinkClick}
                >
                  <span className="text-xl">⚡</span>
                  <span className="font-medium">Electricity</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/water" 
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 premium-btn ${
                    isActive('/water')
                      ? 'gradient-bg-water text-white shadow-lg' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={handleLinkClick}
                >
                  <span className="text-xl">💧</span>
                  <span className="font-medium">Water</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/food-waste" 
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 premium-btn ${
                    isActive('/food-waste')
                      ? 'gradient-bg-food text-white shadow-lg' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={handleLinkClick}
                >
                  <span className="text-xl">🍽️</span>
                  <span className="font-medium">Food Waste</span>
                </Link>
              </li>
            </ul>
            
            {/* Theme Toggle */}
            <button 
              className="p-2.5 rounded-xl gradient-bg-primary text-white shadow-md hover:shadow-xl transition-all duration-300 hover:scale-110 hover-glow premium-btn"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              <div className="text-xl transition-all duration-500" style={{ transform: theme === 'dark' ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                {theme === 'light' ? '🌙' : '☀️'}
              </div>
            </button>
            
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden flex flex-col justify-center items-center w-10 h-10 relative transition-all"
              onClick={handleMenuToggle}
              aria-label="Toggle menu"
            >
              <span className={`block h-0.5 w-6 bg-gray-800 dark:bg-white transition-all ${isMenuOpen ? 'rotate-45 translate-y-0.5' : 'mb-1.5'}`}></span>
              <span className={`block h-0.5 w-6 bg-gray-800 dark:bg-white transition-all ${isMenuOpen ? 'opacity-0' : 'opacity-100 mb-1.5'}`}></span>
              <span className={`block h-0.5 w-6 bg-gray-800 dark:bg-white transition-all ${isMenuOpen ? '-rotate-45 -translate-y-0.5' : ''}`}></span>
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <ul className={`md:hidden flex-col gap-2 pb-4 animate-fade-in ${isMenuOpen ? 'flex' : 'hidden'}`}>
          <li>
            <Link 
              to="/" 
              className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ${
                isActive('/') 
                  ? 'gradient-bg-primary text-white shadow-md' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={handleLinkClick}
            >
              <span className="text-xl">📊</span>
              <span className="font-medium">Dashboard</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/electricity" 
              className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ${
                isActive('/electricity')
                  ? 'gradient-bg-electricity text-white shadow-md' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={handleLinkClick}
            >
              <span className="text-xl">⚡</span>
              <span className="font-medium">Electricity</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/water" 
              className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ${
                isActive('/water')
                  ? 'gradient-bg-water text-white shadow-md' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={handleLinkClick}
            >
              <span className="text-xl">💧</span>
              <span className="font-medium">Water</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/food-waste" 
              className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ${
                isActive('/food-waste')
                  ? 'gradient-bg-food text-white shadow-md' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={handleLinkClick}
            >
              <span className="text-xl">🍽️</span>
              <span className="font-medium">Food Waste</span>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  )
}

export default Navbar
