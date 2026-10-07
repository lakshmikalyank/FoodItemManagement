import { Link } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";

function NotFound() {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center text-center vh-100 px-3">
      <h1 className="display-1 fw-bold text-success">404</h1>
      <h4 className="mb-2">Oops! This page went past its expiry date.</h4>
      <p className="text-muted mb-4">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to={isAuthenticated() ? "/home" : "/"} className="btn btn-success px-4">
        Back to {isAuthenticated() ? "Home" : "Start"}
      </Link>
    </div>
  );
}

export default NotFound;
