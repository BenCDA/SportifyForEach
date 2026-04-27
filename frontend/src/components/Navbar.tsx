import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Dumbbell, Calendar, BookOpen, Users, ChevronDown, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

function NavLink({ to, children }: Readonly<{ to: string; children: React.ReactNode }>) {
  const { pathname } = useLocation();
  const active = pathname === to || pathname.startsWith(to + '/');
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-200',
        active
          ? 'text-accent bg-accent/10'
          : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800',
      )}
    >
      {children}
    </Link>
  );
}

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '';

  return (
    <nav className="sticky top-0 z-50 bg-[#0B0F19]/95 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Dumbbell className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg text-gray-100 tracking-tight">Sportify Pro</span>
          </Link>

          {user && (
            <div className="flex items-center gap-1">
              {user.role === 'CLIENT' && (
                <>
                  <NavLink to="/sessions"><Calendar className="w-4 h-4" />Séances</NavLink>
                  <NavLink to="/bookings"><BookOpen className="w-4 h-4" />Réservations</NavLink>
                </>
              )}
              {user.role === 'COACH' && (
                <NavLink to="/coach/planning"><Calendar className="w-4 h-4" />Mon planning</NavLink>
              )}
              {user.role === 'ADMIN' && (
                <>
                  <NavLink to="/sessions"><Calendar className="w-4 h-4" />Séances</NavLink>
                  <NavLink to="/admin/users"><Users className="w-4 h-4" />Utilisateurs</NavLink>
                </>
              )}
            </div>
          )}

          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors duration-200"
              >
                <div className="w-7 h-7 bg-accent/20 text-accent rounded-full flex items-center justify-center text-xs font-bold">
                  {initials}
                </div>
                <span className="text-sm text-gray-300 hidden sm:block">
                  {user.firstName}
                </span>
                <ChevronDown className={cn('w-3.5 h-3.5 text-gray-500 transition-transform duration-200', dropdownOpen && 'rotate-180')} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-brand-elevated border border-gray-700 rounded-xl shadow-xl shadow-black/40 animate-fade-in">
                  <div className="px-4 py-3 border-b border-gray-700">
                    <p className="text-sm font-medium text-gray-100">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <div className="p-1.5">
                    <div className="flex items-center gap-2 px-3 py-2">
                      <User className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-xs text-gray-500">{user.role}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors duration-200"
                    >
                      <LogOut className="w-4 h-4" />
                      Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
