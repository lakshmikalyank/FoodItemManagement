import { NavLink, useNavigate } from "react-router-dom";
import { clearAuth } from "../utils/auth";

const links = [
  { to: "/home", label: "Home", icon: "🏠" },
  { to: "/about", label: "About", icon: "ℹ️" },
  { to: "/contact", label: "Contact", icon: "✉️" },
];

const appLinks = [
  { to: "/courses", label: "Food Inventory", icon: "🥫" },
  { to: "/profile", label: "Profile", icon: "👤" },
];

function SideNav({ open, onClose }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  const renderLink = ({ to, label, icon }) => (
    <NavLink
      key={to}
      to={to}
      onClick={onClose}
      className={({ isActive }) => `side-link${isActive ? " active" : ""}`}
    >
      <span className="side-icon">{icon}</span>
      {label}
    </NavLink>
  );

  return (
    <>
      {open && <div className="side-backdrop d-lg-none" onClick={onClose} />}

      <aside className={`side-nav${open ? " open" : ""}`}>
        <h2 className="text-warning fw-bold mb-4 side-title">Dashboard</h2>

        <nav className="d-flex flex-column">
          {links.map(renderLink)}

          <hr className="side-divider" />

          {appLinks.map(renderLink)}
        </nav>

        <button className="btn btn-danger mt-4 side-logout" onClick={handleLogout}>
          Logout
        </button>
      </aside>
    </>
  );
}

export default SideNav;
