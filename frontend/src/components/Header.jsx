import { useEffect, useState } from "react";
import logo from "../assets/logo.png";
import { getUser, USER_UPDATED_EVENT } from "../utils/auth";

function Header({ onToggleNav }) {
  const [user, setUser] = useState(getUser());

  // refresh the name instantly when the profile is edited
  useEffect(() => {
    const refresh = () => setUser(getUser());
    window.addEventListener(USER_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(USER_UPDATED_EVENT, refresh);
  }, []);

  return (
    <header className="app-header">
      <div className="d-flex align-items-center">
        <button
          type="button"
          className="nav-toggle d-lg-none"
          onClick={onToggleNav}
          aria-label="Toggle navigation"
        >
          ☰
        </button>

        <img src={logo} alt="FoodNest Logo" className="header-logo" />

        <div className="ms-3">
          <h1 className="header-title fw-bold mb-0">
            <span className="text-success">Food</span>
            <span className="text-warning">Nest</span>
          </h1>
          <p className="header-tagline text-dark mb-0 d-none d-sm-block">
          Give every food item a place, and every ingredient a purpose.
          </p>
        </div>
      </div>

      <div className="header-welcome text-end">
        <h5 className="mb-0">
          Welcome, <span className="text-success fw-bold">{user?.fullname}</span>
        </h5>
      </div>
    </header>
  );
}

export default Header;
