import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import loginImg from "../assets/Login.png";
import api, { getErrorMessage } from "../utils/api";
import { setAuth } from "../utils/auth";
import { useToast } from "../components/ToastContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/api/login", {
        email: email.trim(),
        password,
        remember,
      });

      setAuth(response.data.token, response.data.user, remember);
      showToast(response.data.message);
      navigate(location.state?.from || "/home", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Login Failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page container-fluid d-flex align-items-center justify-content-center">
      <div className="card shadow border-0 w-100 auth-card">
        <div className="row g-0">
          <div className="col-lg-6 d-none d-lg-flex align-items-center justify-content-center bg-light">
            <img src={loginImg} alt="Login" className="img-fluid p-4" style={{ maxHeight: "650px" }} />
          </div>

          <div className="col-lg-6 col-12">
            <div className="p-4 p-md-5">
              <h2 className="fw-bold mb-2">Welcome Back</h2>
              <p className="text-muted mb-4">Login to continue</p>

              {location.state?.registered && (
                <div className="alert alert-success py-2">
                  Registration successful! Please login.
                </div>
              )}

              {error && (
                <div className="alert alert-danger py-2" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="form-check mb-4">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="remember"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="remember">
                    Remember me
                  </label>
                </div>

                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </button>

                <p className="text-center mt-4 mb-0">
                  Don't have an account?{" "}
                  <Link to="/register" className="text-decoration-none">
                    Register
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
