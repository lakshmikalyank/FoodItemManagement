import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import SideNav from "./SideNav";

function Layout() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="app-shell">
      <Header onToggleNav={() => setNavOpen((o) => !o)} />

      <div className="app-body">
        <SideNav open={navOpen} onClose={() => setNavOpen(false)} />
        <main className="app-main">
          <Outlet />
        </main>
      </div>

      <Footer />
    </div>
  );
}

export default Layout;
