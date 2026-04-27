import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleRoute } from './routes/RoleRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Home } from './pages/Home';
import { Sessions } from './pages/Sessions';
import { MyBookings } from './pages/MyBookings';
import { CoachPlanning } from './pages/CoachPlanning';
import { AdminUsers } from './pages/AdminUsers';
import { NotFound } from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
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
      </BrowserRouter>
    </AuthProvider>
  );
}
