import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../features/auth/AuthProvider';

interface Props {
  children: ReactNode;
}

export const AdminRoute = ({ children }: Props) => {
  const { hasRole } = useAuth();

  return (
    <ProtectedRoute>
      {hasRole('admin') ? children : <Navigate to="/" replace />}
    </ProtectedRoute>
  );
};
