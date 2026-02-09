import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useContext(AuthContext);

  if (!isAuthenticated) {
    // لو مش مسجل دخول، يرجعه للوج إن
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // لو مسجل بس ملوش صلاحية (مثلاً مريض بيحاول يدخل للأدمن)
    return <Navigate to="/access-denied" />;
  }

  return children;
};

export default ProtectedRoute;