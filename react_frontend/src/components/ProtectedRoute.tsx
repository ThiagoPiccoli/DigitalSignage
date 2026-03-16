import { Navigate } from 'react-router-dom';
import { getAuthToken } from '../auth';

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = getAuthToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
