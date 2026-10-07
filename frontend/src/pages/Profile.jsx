import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../utils/api";
import { clearAuth, getUser, updateStoredUser } from "../utils/auth";
import { useToast } from "../components/ToastContext";

function PasswordInput({ label, value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = useState(false);

  return (
    <div className="mb-3">
      <label className="form-label fw-semibold">{label}</label>
      <div className="input-group">
        <input
          type={show ? "text" : "password"}
          className="form-control"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
        />
        <button type="button" className="btn btn-outline-secondary" onClick={() => setShow(!show)}>
          {show ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}

function Profile() {
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [user, setUser] = useState({});
  const [fullname, setFullname] = useState("");
  const [editProfile, setEditProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;

    const fetchProfile = async () => {
      try {
        const res = await api.get("/api/profile");
        if (!active) return;
        setUser(res.data);
        setFullname(res.data.fullname || "");
      } catch (error) {
        if (!active) return;
        // fall back to the locally saved user so the page is never blank
        const saved = getUser();
        if (saved) {
          setUser({ _id: saved.id, ...saved });
          setFullname(saved.fullname || "");
        }
        showToast(getErrorMessage(error, "Failed to load profile"), "error");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetPasswordFields = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("Please fill all password fields", "error");
      return;
    }

    if (newPassword.length < 6) {
      showToast("New password must be at least 6 characters", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    setSaving(true);

    try {
      const res = await api.put("/api/change-password", {
        currentPassword,
        newPassword,
      });

      showToast(res.data.message);
      resetPasswordFields();
      setShowPasswordFields(false);
    } catch (error) {
      showToast(getErrorMessage(error, "Failed to update password"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!fullname.trim()) {
      showToast("Name cannot be empty", "error");
      return;
    }

    setSaving(true);

    try {
      const res = await api.put("/api/update-profile", { fullname: fullname.trim() });

      const updatedUser = { ...user, fullname: res.data.user.fullname };
      setUser(updatedUser);
      setFullname(res.data.user.fullname);

      const saved = getUser() || {};
      updateStoredUser({ ...saved, fullname: res.data.user.fullname });

      setEditProfile(false);
      showToast(res.data.message);
    } catch (error) {
      showToast(getErrorMessage(error, "Failed to update profile"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  const initials = (user.fullname || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");

  return (
    <div className="container-fluid p-0 p-md-3">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-xl-7">
          <div className="card shadow border-0">
            <div className="card-body p-4">
              <div className="text-center mb-4">
                <div className="avatar mx-auto">{initials}</div>
                <h3 className="mt-2 text-success fw-bold">My Profile</h3>
              </div>

              {loading ? (
                <p className="text-center text-muted">Loading profile...</p>
              ) : (
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={fullname}
                      readOnly={!editProfile}
                      onChange={(e) => setFullname(e.target.value)}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Email</label>
                    <input type="email" className="form-control" value={user.email || ""} readOnly />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">User ID</label>
                    <input type="text" className="form-control" value={user._id || ""} readOnly />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Joined On</label>
                    <input
                      type="text"
                      className="form-control"
                      value={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""}
                      readOnly
                    />
                  </div>
                </div>
              )}

              {showPasswordFields && (
                <>
                  <hr />
                  <h5 className="text-primary mb-3">Change Password</h5>

                  <div className="row">
                    <div className="col-12">
                      <PasswordInput
                        label="Current Password"
                        placeholder="Enter Current Password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        autoComplete="current-password"
                      />
                    </div>
                    <div className="col-md-6">
                      <PasswordInput
                        label="New Password"
                        placeholder="At least 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="col-md-6">
                      <PasswordInput
                        label="Confirm Password"
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="d-flex justify-content-center flex-wrap gap-3 mt-3">
                <button
                  type="button"
                  disabled={saving || loading}
                  className={`btn ${editProfile ? "btn-success" : "btn-warning"}`}
                  onClick={() => (editProfile ? handleUpdateProfile() : setEditProfile(true))}
                >
                  {editProfile ? "Save Profile" : "Edit Profile"}
                </button>

                {editProfile && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setEditProfile(false);
                      setFullname(user.fullname || "");
                    }}
                  >
                    Cancel
                  </button>
                )}

                {showPasswordFields && (
                  <button
                    type="button"
                    className="btn btn-success px-4"
                    disabled={saving}
                    onClick={handleChangePassword}
                  >
                    Update Password
                  </button>
                )}

                <button
                  type="button"
                  className={`btn ${showPasswordFields ? "btn-secondary" : "btn-primary"}`}
                  onClick={() => {
                    setShowPasswordFields(!showPasswordFields);
                    resetPasswordFields();
                  }}
                >
                  {showPasswordFields ? "Cancel" : "Change Password"}
                </button>

                <button type="button" className="btn btn-outline-danger" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
