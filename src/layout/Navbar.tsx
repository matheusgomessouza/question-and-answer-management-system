import { Link, useLocation } from 'react-router-dom'

export function Navbar() {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="glass-card-solid" role="navigation" aria-label="Main navigation">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg text-white flex items-center justify-center font-bold">?</div>
            <h1 className="text-xl font-bold text-gray-800">Q&A Management</h1>
          </div>

          <div className="flex space-x-1" role="menubar">
            <Link
              to="/questions"
              role="menuitem"
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                isActive('/questions')
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-current={isActive('/questions') ? 'page' : undefined}
            >
              Questions
            </Link>
            <Link
              to="/answers"
              role="menuitem"
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                isActive('/answers')
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-current={isActive('/answers') ? 'page' : undefined}
            >
              Answers
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
