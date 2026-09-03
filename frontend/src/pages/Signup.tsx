import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../lib/api";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await api.post("/auth/signup/", { email, password, name });
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      navigate("/");
    } catch {
      setError("Signup failed. Email may already be in use.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="bg-gray-900 p-8 rounded-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-6">Create Account</h1>
        {error && <p className="text-red-400 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Name" value={name}
            onChange={e => setName(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700" />
          <input type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700" />
          <input type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700" />
          <button type="submit"
            className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold">
            Sign Up
          </button>
        </form>
        <p className="text-gray-400 mt-4 text-center">
          Have an account? <Link to="/login" className="text-blue-400">Login</Link>
        </p>
      </div>
    </div>
  );
}
