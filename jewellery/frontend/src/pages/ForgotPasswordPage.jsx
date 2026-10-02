import { useState } from "react";
import { forgotPassword } from "../services/api";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await forgotPassword({ email, newPassword });
      setMessage(res.data?.message || "Password changed successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-4 auth-card">
      <h3>Forgot Password</h3>
      <p className="mb-3">Enter your registered email and set a new password.</p>
      {message ? <div className="alert alert-success py-2">{message}</div> : null}
      {error ? <div className="alert alert-danger py-2">{error}</div> : null}
      <form onSubmit={submit}>
        <input
          type="email"
          className="form-control mb-3"
          placeholder="Email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="form-control mb-3"
          placeholder="New Password"
          value={newPassword}
          minLength={6}
          required
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <input
          type="password"
          className="form-control mb-3"
          placeholder="Confirm New Password"
          value={confirmPassword}
          minLength={6}
          required
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button disabled={loading} className="btn btn-warning w-100">
          {loading ? "Updating..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}

export default ForgotPasswordPage;
