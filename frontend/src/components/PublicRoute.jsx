import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";

// Landing / Login / Register: already logged in users go straight to the app
function PublicRoute({ children }) {
  if (isAuthenticated()) {
    return <Navigate to="/home" replace />;
  }

  return children;
}

export default PublicRoute;
