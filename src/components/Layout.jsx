import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { icon: "📊", label: "Dashboard", to: "/", end: true },
  { icon: "➕", label: "Yangi Test", to: "/create-test" },
];

export default function Layout() {
  const location = useLocation();

  // Joriy test ID ni path'dan olamiz
  const pathMatch = location.pathname.match(
    /\/(answer-key|students|results)\/(\d+)/
  );
  const currentTestId = pathMatch ? pathMatch[2] : null;

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">📐</div>
          <div>
            <div className="logo-text">RashModel</div>
            <span className="logo-sub">Milliy Sertifikat Tizimi</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-label">Asosiy</div>

          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {/* Agar test oqimi ichida bo'lsak — kontekstli navigatsiya */}
          {currentTestId && (
            <>
              <div className="nav-label">Joriy Test #{currentTestId}</div>
              <NavLink
                to={`/answer-key/${currentTestId}`}
                className={({ isActive }) =>
                  `nav-link${isActive ? " active" : ""}`
                }
              >
                <span className="nav-icon">🔑</span>
                Javob Kaliti
              </NavLink>
              <NavLink
                to={`/students/${currentTestId}`}
                className={({ isActive }) =>
                  `nav-link${isActive ? " active" : ""}`
                }
              >
                <span className="nav-icon">👥</span>
                Talabalar
              </NavLink>
              <NavLink
                to={`/results/${currentTestId}`}
                className={({ isActive }) =>
                  `nav-link${isActive ? " active" : ""}`
                }
              >
                <span className="nav-icon">🏆</span>
                Natijalar
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <span className="version-badge">RashModel v1.0 · Rasch IRT</span>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
