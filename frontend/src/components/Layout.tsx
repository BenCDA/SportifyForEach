import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export function Layout() {
  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-gray-800 py-4">
        <p className="text-center text-xs text-gray-600">
          © {new Date().getFullYear()} Sportify Pro — Tous droits réservés
        </p>
      </footer>
    </div>
  );
}
