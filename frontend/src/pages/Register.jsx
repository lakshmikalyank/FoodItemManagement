import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import registerImg from "../assets/Register.png";
import api, { getErrorMessage } from "../utils/api";

function Register() {
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!agree) {
      setError("Please agree to the Terms & Conditions");
      return;
    }

    setLoading(true);

    try {
      await api.post("/api/register", {
        fullname: fullname.trim(),
        email: email.trim(),
        password,
      });

      navigate("/login", { replace: true, state: { registered: true } });
    } catch (err) {
      setError(getErrorMessage(err, "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page container-fluid d-flex align-items-center justify-content-center">
      <div className="card shadow border-0 w-100 auth-card">
        <div className="row g-0 flex-lg-row-reverse">
          <div className="col-lg-6 d-none d-lg-flex align-items-center justify-content-center bg-light">
            <img src={registerImg} alt="Register" className="img-fluid p-4" style={{ maxHeight: "450px" }} />
          </div>

          <div className="col-lg-6 col-12">
            <div className="p-4 p-md-5">
              <h2 className="fw-bold mb-2">Create Account</h2>
              <p className="text-muted mb-4">Create your account to continue</p>

              {error && (
                <div className="alert alert-danger py-2" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleRegister}>
                <div className="mb-3">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter your name"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>

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
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      minLength={6}
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

                <div className="mb-3">
                  <label className="form-label">Confirm Password</label>
                  <div className="input-group">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="form-control"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="form-check mb-4">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="terms"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="terms">
                    I agree to the{" "}
                    <span className="text-primary fw-semibold">Terms & Conditions</span> and{" "}
                    <span className="text-primary fw-semibold">Privacy Policy</span>
                  </label>
                </div>

                <button type="submit" className="btn btn-primary w-100" disabled={!agree || loading}>
                  {loading ? "Creating account..." : "Register"}
                </button>

                <p className="text-center mt-4 mb-0">
                  Already have an account?{" "}
                  <Link to="/login" className="text-decoration-none">
                    Login
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

export default Register;
