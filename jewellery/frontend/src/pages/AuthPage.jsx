import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { login, register } from "../services/api";
import useAuth from "../context/useAuth";

function AuthPage() {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "buyer", adminKey: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = isLogin
        ? { email: form.email, password: form.password }
        : {
            name: form.name,
            email: form.email,
            password: form.password,
            role: form.role,
            adminKey: form.role === "admin" ? form.adminKey : undefined,
          };
      const res = isLogin ? await login(payload) : await register(payload);
      loginUser(res.data.token, res.data.user);
      toast.success(isLogin ? "Login successful" : "Registration successful");
      navigate("/");
    } catch (err) {
      if (!err.response) {
        setError("Cannot connect to backend server. Start backend with: cd backend && npm run dev");
      } else {
        setError(err.response?.data?.message || "Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-4 auth-card">
      <h3>{isLogin ? "Buyer Login" : "Create Buyer Account"}</h3>
      {error ? <div className="alert alert-danger py-2">{error}</div> : null}
      <form onSubmit={submit}>
        {!isLogin && (
          <input
            className="form-control mb-2"
            placeholder="Name"
            value={form.name}
            required
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        )}
        <select
          className="form-select mb-2"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value="buyer">Buyer</option>
          <option value="admin">Admin</option>
        </select>
        <input
          type="email"
          className="form-control mb-2"
          placeholder="Email"
          value={form.email}
          required
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          type="password"
          className="form-control mb-2"
          placeholder="Password"
          value={form.password}
          minLength={6}
          required
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {!isLogin && form.role === "admin" ? (
          <input
            type="password"
            className="form-control mb-2"
            placeholder="Admin registration key"
            value={form.adminKey}
            required
            onChange={(e) => setForm({ ...form, adminKey: e.target.value })}
          />
        ) : null}
        {isLogin ? (
          <div className="text-end mb-3">
            <Link to="/forgot-password" className="small-link">Forgot password?</Link>
          </div>
        ) : null}
        <button disabled={loading} className="btn btn-warning w-100">
          {loading ? "Please wait..." : isLogin ? "Login" : "Register"}
        </button>
      </form>
      <button className="btn btn-link mt-2" onClick={() => setIsLogin((prev) => !prev)}>
        {isLogin ? "Need account? Register" : "Already have account? Login"}
      </button>
    </div>
  );
}

export default AuthPage;
