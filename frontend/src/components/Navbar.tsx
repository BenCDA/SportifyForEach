import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

interface NavLinkProps { to: string; children: React.ReactNode }

function NavLink({ to, children }: Readonly<NavLinkProps>) {
  const { pathname } = useLocation();
  const active = pathname === to || pathname.startsWith(to + '/');
  return (
    <Link
      to={to}
      className={cn(
        'font-mono text-[11px] uppercase tracking-[0.12em] transition-colors duration-150',
        active ? 'text-ink' : 'text-muted hover:text-ink',
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
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '';

  return (
    <nav
      className={cn(
        'sticky top-0 z-50 border-b transition-colors duration-200',
        scrolled ? 'bg-surface border-ink/12' : 'bg-paper border-ink/8',
      )}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between h-14">
          {/* Wordmark */}
          <Link to="/" className="font-serif italic text-2xl text-ink leading-none select-none">
            Sportify
          </Link>

          {/* Nav links */}
          {user && (
            <div className="flex items-center gap-7">
              {user.role === 'CLIENT' && (
                <>
                  <NavLink to="/sessions">Séances</NavLink>
                  <NavLink to="/bookings">Réservations</NavLink>
                </>
              )}
              {user.role === 'COACH' && (
                <NavLink to="/coach/planning">Planning</NavLink>
              )}
              {user.role === 'ADMIN' && (
                <>
                  <NavLink to="/sessions">Séances</NavLink>
                  <NavLink to="/admin/users">Utilisateurs</NavLink>
                </>
              )}
            </div>
          )}

          {/* User menu */}
          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2 focus:outline-none"
              >
                <span className="w-7 h-7 bg-ink text-paper rounded-full flex items-center justify-center font-mono text-[10px] font-medium select-none">
                  {initials}
                </span>
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 text-muted transition-transform duration-200',
                    dropdownOpen && 'rotate-180',
                  )}
                  strokeWidth={1.5}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-surface border border-ink/12 shadow-[0_8px_24px_rgba(26,26,26,0.08)] z-50">
                  <div className="px-4 py-3 border-b border-ink/8">
                    <p className="text-sm font-medium text-ink leading-tight">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted mt-0.5 truncate">
                      {user.role}
                    </p>
                  </div>
                  <div className="p-1.5">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-accent hover:bg-accent/5 transition-colors duration-150 font-mono uppercase tracking-[0.08em]"
                    >
                      <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
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
