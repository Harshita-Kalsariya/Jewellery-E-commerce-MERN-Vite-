import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { resetPassword } from "../services/api";
import useAuth from "../context/useAuth";

function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await resetPassword(token, { password });
      loginUser(res.data.token, res.data.user);
      toast.success("Password reset successful");
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Reset link is invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-4 auth-card">
      <h3>Reset Password</h3>
      {error ? <div className="alert alert-danger py-2">{error}</div> : null}
      <form onSubmit={submit}>
        <input
          type="password"
          className="form-control mb-2"
          placeholder="New Password"
          minLength={6}
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          className="form-control mb-3"
          placeholder="Confirm Password"
          minLength={6}
          value={confirmPassword}
          required
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button className="btn btn-warning w-100" disabled={loading}>
          {loading ? "Updating..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}

export default ResetPasswordPage;
