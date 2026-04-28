import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export function Layout() {
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-10 py-10">
        <Outlet />
      </main>
      <footer className="border-t border-ink/8 py-5 mt-4">
        <p className="text-center font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
          Sportify · {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
