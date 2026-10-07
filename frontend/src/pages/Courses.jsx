import { useEffect, useMemo, useRef, useState } from "react";
import api, { getErrorMessage } from "../utils/api";
import { useToast } from "../components/ToastContext";
import {
  getExpiryStatus,
  getStockStatus,
  formatDate,
  toInputDate,
} from "../utils/food";

const PAGE_SIZE = 8;

const EMPTY_FORM = { name: "", category: "", quantity: "", expiryDate: "" };

const EXPIRY_ORDER = { Expired: 1, "Expiring Soon": 2, Fresh: 3 };

// Food Inventory page (route: /courses)
function Courses() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const formRef = useRef(null);
  const { showToast } = useToast();

  const fetchFoods = async () => {
    try {
      const res = await api.get("/api/items");
      setFoods(Array.isArray(res.data) ? res.data : []);
      setError("");
    } catch (err) {
      setFoods([]);
      setError(getErrorMessage(err, "Failed to load food items"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
  };

  const addFood = async (e) => {
    e.preventDefault();

    const payload = {
      name: formData.name.trim(),
      category: formData.category.trim(),
      quantity: Number(formData.quantity),
      expiryDate: formData.expiryDate,
    };

    if (!payload.name || !payload.category) {
      showToast("Name and category are required", "error");
      return;
    }

    if (Number.isNaN(payload.quantity) || payload.quantity < 0) {
      showToast("Quantity must be 0 or more", "error");
      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        await api.put(`/api/items/${editingId}`, payload);
        showToast("Food item updated successfully");
      } else {
        await api.post("/api/items", payload);
        showToast("Food item added successfully");
        setPage(1);
      }

      resetForm();
      await fetchFoods();
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to save item"), "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteFood = async (food) => {
    if (!window.confirm(`Delete "${food.name}" from your inventory?`)) return;

    try {
      await api.delete(`/api/items/${food._id}`);
      showToast("Food item deleted");
      if (editingId === food._id) resetForm();
      await fetchFoods();
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to delete item"), "error");
    }
  };

  const editFood = (food) => {
    setEditingId(food._id);

    setFormData({
      name: food.name,
      category: food.category,
      quantity: food.quantity,
      expiryDate: toInputDate(food.expiryDate),
    });

    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const foodList = useMemo(() => (Array.isArray(foods) ? foods : []), [foods]);

  const categories = useMemo(
    () => [...new Set(foodList.map((f) => f.category.trim()).filter(Boolean))].sort(),
    [foodList]
  );

  // summary counts
  const totalFoods = foodList.length;
  const inStock = foodList.filter((f) => getStockStatus(f.quantity) === "In Stock").length;
  const lowStock = foodList.filter((f) => getStockStatus(f.quantity) === "Low Stock").length;
  const outOfStock = foodList.filter((f) => getStockStatus(f.quantity) === "Out of Stock").length;

  const filteredFoods = useMemo(() => {
    const term = search.trim().toLowerCase();

    return foodList
      .filter((food) => {
        const matchesSearch =
          !term ||
          food.name.toLowerCase().includes(term) ||
          food.category.toLowerCase().includes(term);

        const matchesCategory =
          categoryFilter === "all" || food.category.trim() === categoryFilter;

        const stock = getStockStatus(food.quantity);
        const expiry = getExpiryStatus(food.expiryDate);
        const matchesStatus = statusFilter === "all" || stock === statusFilter || expiry === statusFilter;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        let result = 0;

        if (sortField === "name") result = a.name.localeCompare(b.name);
        else if (sortField === "category") result = a.category.localeCompare(b.category);
        else if (sortField === "quantity") result = a.quantity - b.quantity;
        else if (sortField === "expiry") result = new Date(a.expiryDate) - new Date(b.expiryDate);
        else if (sortField === "status")
          result = EXPIRY_ORDER[getExpiryStatus(a.expiryDate)] - EXPIRY_ORDER[getExpiryStatus(b.expiryDate)];
        else return 0;

        return sortOrder === "asc" ? result : -result;
      });
  }, [foodList, search, categoryFilter, statusFilter, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredFoods.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedFoods = filteredFoods.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortIcon = (field) =>
    sortField === field ? (sortOrder === "asc" ? "▲" : "▼") : "↕";

  const getExpiryBadge = (expiryDate) => {
    const status = getExpiryStatus(expiryDate);

    switch (status) {
      case "Expired":
        return <span className="badge bg-danger ms-1">Expired</span>;
      case "Expiring Soon":
        return <span className="badge bg-warning text-dark ms-1">Expiring Soon</span>;
      default:
        return <span className="badge bg-success ms-1">Fresh</span>;
    }
  };

  const getStockBadge = (qty) => {
    const status = getStockStatus(qty);
    if (status === "Out of Stock") return <span className="badge bg-danger">Out of Stock</span>;
    if (status === "Low Stock") return <span className="badge bg-warning text-dark">Low Stock</span>;
    return <span className="badge bg-success">In Stock</span>;
  };

  const exportCsv = () => {
    if (filteredFoods.length === 0) {
      showToast("Nothing to export", "info");
      return;
    }

    const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = [
      ["Name", "Category", "Quantity", "Stock Status", "Expiry Date", "Expiry Status"],
      ...filteredFoods.map((f) => [
        f.name,
        f.category,
        f.quantity,
        getStockStatus(f.quantity),
        toInputDate(f.expiryDate),
        getExpiryStatus(f.expiryDate),
      ]),
    ];

    const csv = rows.map((r) => r.map(escape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "foodnest-inventory.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container-fluid p-0 p-md-2">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h3 className="fw-bold text-primary mb-0">Food Inventory</h3>

        <button className="btn btn-outline-success btn-sm" onClick={exportCsv}>
          ⬇ Export CSV
        </button>
      </div>

      {/* Stock summary */}
      <div className="row g-2 mb-3">
        <div className="col-6 col-md-3">
          <div className="mini-stat">
            <span>Total</span>
            <strong className="text-primary">{totalFoods}</strong>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="mini-stat">
            <span>In Stock</span>
            <strong className="text-success">{inStock}</strong>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="mini-stat">
            <span>Low Stock</span>
            <strong className="text-warning">{lowStock}</strong>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="mini-stat">
            <span>Out of Stock</span>
            <strong className="text-danger">{outOfStock}</strong>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Add / Update form */}
      <div className="card border-0 shadow-sm mb-4" ref={formRef}>
        <div className="card-body">
          <h5 className="mb-3">{editingId ? "Update Food Item" : "Add Food Item"}</h5>

          <form onSubmit={addFood}>
            <div className="row g-3">
              <div className="col-md-6 col-lg-3">
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  placeholder="Food Name"
                  value={formData.name}
                  onChange={handleChange}
                  maxLength={80}
                  required
                />
              </div>

              <div className="col-md-6 col-lg-3">
                <input
                  type="text"
                  className="form-control"
                  name="category"
                  placeholder="Category (e.g. Dairy)"
                  list="category-options"
                  value={formData.category}
                  onChange={handleChange}
                  maxLength={40}
                  required
                />
                <datalist id="category-options">
                  {[...new Set(["Dairy", "Fruit", "Vegetable", "Bakery", "Meat", "Beverage", "Grains", "Snacks", ...categories])].map(
                    (c) => (
                      <option key={c} value={c} />
                    )
                  )}
                </datalist>
              </div>

              <div className="col-md-4 col-lg-2">
                <input
                  type="number"
                  className="form-control"
                  name="quantity"
                  placeholder="Quantity"
                  min="0"
                  step="1"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-4 col-lg-2">
                <input
                  type="date"
                  className="form-control"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-4 col-lg-2 d-flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className={`btn flex-fill ${editingId ? "btn-warning" : "btn-success"}`}
                >
                  {saving ? "Saving..." : editingId ? "Update" : "Add Food"}
                </button>

                {editingId && (
                  <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Search + filters */}
      <div className="row g-2 mb-3">
        <div className="col-12 col-md-5">
          <input
            type="text"
            className="form-control"
            placeholder="🥕🔍Search food or category..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="col-6 col-md-3">
          <select
            className="form-select"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="col-6 col-md-4">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Status</option>
            <optgroup label="Stock">
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </optgroup>
            <optgroup label="Expiry">
              <option value="Fresh">Fresh</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Expired">Expired</option>
            </optgroup>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover align-middle inventory-table mb-0">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => handleSort("name")}>
                    Food Name {sortIcon("name")}
                  </th>
                  <th className="sortable" onClick={() => handleSort("category")}>
                    Category {sortIcon("category")}
                  </th>
                  <th className="sortable" onClick={() => handleSort("quantity")}>
                    Quantity {sortIcon("quantity")}
                  </th>
                  <th>Added</th>
                  <th className="sortable" onClick={() => handleSort("expiry")}>
                    Expiry Date {sortIcon("expiry")}
                  </th>
                  <th className="sortable" onClick={() => handleSort("status")}>
                    Status {sortIcon("status")}
                  </th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {pagedFoods.map((food) => (
                  <tr key={food._id}>
                    <td className="fw-semibold">{food.name}</td>
                    <td>{food.category}</td>
                    <td>{food.quantity}</td>
                    <td>{food.createdAt ? formatDate(food.createdAt) : "—"}</td>
                    <td>{formatDate(food.expiryDate)}</td>
                    <td className="text-nowrap">
                      {getStockBadge(food.quantity)}
                      {getExpiryBadge(food.expiryDate)}
                    </td>
                    <td className="text-center text-nowrap">
                      <button className="btn btn-sm btn-primary me-2 action-btn" onClick={() => editFood(food)}>
                        Edit
                      </button>

                      <button className="btn btn-sm btn-danger action-btn" onClick={() => deleteFood(food)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {loading && (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      Loading food items...
                    </td>
                  </tr>
                )}

                {!loading && filteredFoods.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      No food items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredFoods.length > PAGE_SIZE && (
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-3">
              <small className="text-muted">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, filteredFoods.length)} of {filteredFoods.length}
              </small>

              <div className="btn-group">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  ‹ Prev
                </button>
                <button className="btn btn-outline-secondary btn-sm disabled">
                  {currentPage} / {totalPages}
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Next ›
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Courses;
