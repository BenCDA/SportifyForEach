import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleRoute } from './routes/RoleRoute';
import { Layout } from './components/Layout';
import { Skeleton } from './components/Skeleton';

const Login        = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Register     = lazy(() => import('./pages/Register').then((m) => ({ default: m.Register })));
const Home         = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const Sessions     = lazy(() => import('./pages/Sessions').then((m) => ({ default: m.Sessions })));
const MyBookings   = lazy(() => import('./pages/MyBookings').then((m) => ({ default: m.MyBookings })));
const CoachPlanning = lazy(() => import('./pages/CoachPlanning').then((m) => ({ default: m.CoachPlanning })));
const AdminUsers   = lazy(() => import('./pages/AdminUsers').then((m) => ({ default: m.AdminUsers })));
const NotFound     = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })));

function PageFallback() {
  return (
    <div className="p-8 space-y-3">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />

                <Route element={<RoleRoute roles={['CLIENT', 'ADMIN']} />}>
                  <Route path="/sessions" element={<Sessions />} />
                </Route>

                <Route element={<RoleRoute roles={['CLIENT']} />}>
                  <Route path="/bookings" element={<MyBookings />} />
                </Route>

                <Route element={<RoleRoute roles={['COACH']} />}>
                  <Route path="/coach/planning" element={<CoachPlanning />} />
                </Route>

                <Route element={<RoleRoute roles={['ADMIN']} />}>
                  <Route path="/admin/users" element={<AdminUsers />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
