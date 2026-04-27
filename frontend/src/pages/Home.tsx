import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Home() {
  const { user } = useAuth();

  if (user?.role === 'CLIENT') return <Navigate to="/sessions" replace />;
  if (user?.role === 'COACH') return <Navigate to="/coach/planning" replace />;
  if (user?.role === 'ADMIN') return <Navigate to="/admin/users" replace />;

  return <Navigate to="/login" replace />;
}
