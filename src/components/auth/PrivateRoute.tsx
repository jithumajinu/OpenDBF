import { Navigate } from "react-router";

interface PrivateRouteProps {
  children: React.ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const isAuthenticated = localStorage.getItem("isAdmin") === "true";
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/signin" replace />;
}