import { Outlet } from 'react-router-dom'
import { Link, useLocation } from 'react-router-dom'
import {
  Home, GitBranch, FileText, User, LogOut // ✅ Add FileText back
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const DashboardLayout = () => {
  const location = useLocation()
  const { logout } = useAuth()

  const navigation = [
    { name: 'Overview', href: '/dashboard/overview', icon: Home },
    { name: 'Repositories', href: '/dashboard/repositories', icon: GitBranch },
    { name: 'Documentation', href: '/dashboard/documentation', icon: FileText }, // ✅ ADD: Documentation link
    { name: 'Profile', href: '/dashboard/profile', icon: User },
  ]

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-card border-r border-border relative">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <img
                src="/codedoc-logo.png"
                alt="CodeDoc Logo"
                className="w-8 h-8 rounded-lg"
              />
              <h1 className="text-xl font-bold text-foreground">CodeDoc AI</h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="px-4 py-4 space-y-2 overflow-y-auto" style={{ height: 'calc(100vh - 140px)' }}>
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Logout button - fixed at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          <main className="p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout
