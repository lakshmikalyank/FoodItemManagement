import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../utils/api";
import homebg from "../assets/homebg.png";
import {
  getExpiryStatus,
  getStockStatus,
  daysUntilExpiry,
  expiryLabel,
  formatDate,
} from "../utils/food";

function Home() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchFoods = async () => {
      try {
        const res = await api.get("/api/items");
        if (active) setFoods(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (active) setError(getErrorMessage(err, "Failed to load dashboard data"));
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchFoods();
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const expired = foods.filter((f) => getExpiryStatus(f.expiryDate) === "Expired");
    const soon = foods.filter((f) => getExpiryStatus(f.expiryDate) === "Expiring Soon");
    const fresh = foods.filter((f) => getExpiryStatus(f.expiryDate) === "Fresh");

    const lowStock = foods.filter((f) => getStockStatus(f.quantity) === "Low Stock");
    const outOfStock = foods.filter((f) => getStockStatus(f.quantity) === "Out of Stock");
    const inStock = foods.filter((f) => getStockStatus(f.quantity) === "In Stock");

    const recent = [...foods]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);

    const attention = [...soon, ...expired].sort(
      (a, b) => daysUntilExpiry(a.expiryDate) - daysUntilExpiry(b.expiryDate)
    );

    const categories = {};
    foods.forEach((f) => {
      const key = f.category.trim() || "Other";
      categories[key] = (categories[key] || 0) + 1;
    });
    const categoryList = Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return {
      total: foods.length,
      fresh: fresh.length,
      soon: soon.length,
      expired: expired.length,
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
      inStock: inStock.length,
      recent,
      attention,
      categoryList,
    };
  }, [foods]);

  const maxCategory = stats.categoryList.length ? stats.categoryList[0][1] : 1;

  const cards = [
    { title: "Total Food Items", value: stats.total, text: "All items in your inventory", bg: "#d9e4ef", color: "text-primary" },
    { title: "Fresh Items", value: stats.fresh, text: "Items are fresh and safe", bg: "#c3e3cd", color: "text-success" },
    { title: "Expiring Soon", value: stats.soon, text: "Items expiring in next 7 days", bg: "#f3e8bd", color: "text-warning" },
    { title: "Expired Items", value: stats.expired, text: "Items already expired", bg: "#e9bebe", color: "text-danger" },
  ];

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="row align-items-center home-hero g-3">
        <div className="col-md-6 text-center">
          <h5 className="text-success">Welcome to FoodNest</h5>

          <h1 className="fw-bold mb-0">Manage Food Smarter,</h1>

          <h1 className="text-success fw-bold">Live Healthier</h1>

          <p className="text-muted">
            Track your food items, monitor expiry dates, and reduce food waste with ease.
          </p>

          <Link to="/courses" className="btn btn-success px-4">
            Food Dashboard
          </Link>
        </div>

        <div className="col-md-6 text-center">
          <img className="img-fluid home-hero-img" src={homebg} alt="FoodNest" />
        </div>
      </section>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Alerts */}
      {!loading && !error && (stats.expired > 0 || stats.soon > 0 || stats.outOfStock > 0) && (
        <div className="alert alert-warning d-flex flex-wrap align-items-center gap-2" role="alert">
          <strong>⚠ Attention needed:</strong>
          {stats.expired > 0 && <span>{stats.expired} expired</span>}
          {stats.soon > 0 && <span>• {stats.soon} expiring within 7 days</span>}
          {stats.outOfStock > 0 && <span>• {stats.outOfStock} out of stock</span>}
          <Link to="/courses" className="ms-auto alert-link">
            Review inventory →
          </Link>
        </div>
      )}

      <h4 className="fw-bold text-success mb-3">Dashboard Overview</h4>

      {/* Expiry cards */}
      <div className="row g-3 mb-3">
        {cards.map((c) => (
          <div className="col-6 col-lg-3" key={c.title}>
            <div className="card stat-card border-0 shadow-sm h-100 rounded-4" style={{ background: c.bg }}>
              <div className="card-body text-center">
                <h6>{c.title}</h6>
                <h3 className={`${c.color} fw-bold`}>{loading ? "…" : c.value}</h3>
                <p className="text-muted small mb-0">{c.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stock row */}
      <div className="row g-3 mb-4">
        <div className="col-4">
          <div className="card border-0 shadow-sm rounded-4 text-center py-2">
            <small className="text-muted">In Stock</small>
            <h5 className="text-success fw-bold mb-0">{loading ? "…" : stats.inStock}</h5>
          </div>
        </div>
        <div className="col-4">
          <div className="card border-0 shadow-sm rounded-4 text-center py-2">
            <small className="text-muted">Low Stock</small>
            <h5 className="text-warning fw-bold mb-0">{loading ? "…" : stats.lowStock}</h5>
          </div>
        </div>
        <div className="col-4">
          <div className="card border-0 shadow-sm rounded-4 text-center py-2">
            <small className="text-muted">Out of Stock</small>
            <h5 className="text-danger fw-bold mb-0">{loading ? "…" : stats.outOfStock}</h5>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-3">
        {/* Recently added */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">Recently Added Food Items</h5>
                <Link to="/courses" className="small text-decoration-none">
                  View all
                </Link>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Qty</th>
                      <th>Added</th>
                      <th>Expiry</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent.map((f) => (
                      <tr key={f._id}>
                        <td>{f.name}</td>
                        <td>{f.category}</td>
                        <td>{f.quantity}</td>
                        <td>{f.createdAt ? formatDate(f.createdAt) : "—"}</td>
                        <td>{formatDate(f.expiryDate)}</td>
                      </tr>
                    ))}
                    {!loading && stats.recent.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center text-muted py-4">
                          No items yet. <Link to="/courses">Add your first food item</Link>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h5 className="fw-bold mb-3">Items by Category</h5>

              {stats.categoryList.length === 0 && (
                <p className="text-muted mb-0">No data yet.</p>
              )}

              {stats.categoryList.map(([name, count]) => (
                <div key={name} className="mb-3">
                  <div className="d-flex justify-content-between small">
                    <span>{name}</span>
                    <strong>{count}</strong>
                  </div>
                  <div className="progress" style={{ height: "8px" }}>
                    <div
                      className="progress-bar bg-success"
                      style={{ width: `${(count / maxCategory) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Expiry tracker */}
      {stats.attention.length > 0 && (
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <h5 className="fw-bold mb-3">⏰ Expiry Tracker</h5>
            <div className="row g-2">
              {stats.attention.slice(0, 6).map((f) => {
                const expired = getExpiryStatus(f.expiryDate) === "Expired";
                return (
                  <div className="col-md-6 col-xl-4" key={f._id}>
                    <div
                      className={`expiry-item d-flex justify-content-between align-items-center ${
                        expired ? "expired" : "soon"
                      }`}
                    >
                      <div>
                        <strong>{f.name}</strong>
                        <div className="small text-muted">
                          {f.category} • Qty {f.quantity}
                        </div>
                      </div>
                      <span className={`badge ${expired ? "bg-danger" : "bg-warning text-dark"}`}>
                        {expiryLabel(f.expiryDate)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
