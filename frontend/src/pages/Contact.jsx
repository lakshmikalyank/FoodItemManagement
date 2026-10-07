import { useState } from "react";
import api, { getErrorMessage } from "../utils/api";
import { getUser } from "../utils/auth";
import { useToast } from "../components/ToastContext";

function Contact() {
  const saved = getUser();

  const [form, setForm] = useState({
    name: saved?.fullname || "",
    email: saved?.email || "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const { showToast } = useToast();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      showToast("Please fill in all fields", "error");
      return;
    }

    setSending(true);

    try {
      const res = await api.post("/api/contact", form);
      showToast(res.data.message);
      setForm({ ...form, message: "" });
    } catch (error) {
      showToast(getErrorMessage(error, "Failed to send message"), "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container-fluid p-0 p-md-2">
      <div className="text-center mb-4">
        <h2 className="fw-bold text-success">Contact Us</h2>
        <p className="text-secondary">
          We'd love to hear from you. Reach out to us for any queries or information.
        </p>
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-5">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <h4 className="fw-bold mb-3 text-success">Get In Touch</h4>

              <div className="mb-3">
                <h6 className="fw-bold">📍 Address</h6>
                <p className="text-secondary mb-0">
                  432 pramellamma Street, Nellore City, 524137
                </p>
              </div>

              <div className="mb-3">
                <h6 className="fw-bold">📞 Phone</h6>
                <p className="text-secondary mb-0">+91 9876543210</p>
              </div>

              <div className="mb-3">
                <h6 className="fw-bold">✉️ Email</h6>
                <p className="text-secondary mb-0">info@foodnest2026.com</p>
              </div>

              <div>
                <h6 className="fw-bold">🕒 Office Hours</h6>
                <p className="text-secondary mb-0">
                  Monday - Saturday <br />
                  9:00 AM - 6:00 PM
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h4 className="fw-bold text-primary mb-3">Send a Message</h4>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    placeholder="Enter your email address"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Message</label>
                  <textarea
                    rows="4"
                    name="message"
                    className="form-control"
                    placeholder="Write your message here..."
                    value={form.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-success" disabled={sending}>
                  {sending ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;
