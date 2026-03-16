import { Navigate } from 'react-router-dom';
import { getAuthToken, getHomePath, getSessionUser } from '../auth';

export default function AdminRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = getAuthToken();
  const user = getSessionUser();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.isAdmin) {
    return <Navigate to={getHomePath(user)} replace />;
  }

  return <>{children}</>;
}
