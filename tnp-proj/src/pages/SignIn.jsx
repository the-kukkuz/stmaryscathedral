import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { jwtDecode } from "jwt-decode";
import "../css/signin.css"
import API_BASE from "../api";

const SignIn = () => {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isTokenValid = (token) => {
    if (!token) return false;
    try {
      const decoded = jwtDecode(token);
      if (!decoded?.exp) return false;
      const now = Math.floor(Date.now() / 1000);
      return decoded.exp > now;
    } catch {
      return false;
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Basic validation
    if (!username || !password) {
      setError('Please enter both username and password')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok || !data?.token) {
        throw new Error('Invalid username or password');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username || username);
      navigate('/');
    } catch (err) {
      setError('Invalid username or password');
      setLoading(false);
    }
  }

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (isTokenValid(token)) {
      navigate('/');
    }
  }, [navigate]);

  return (
<section class="add-card page">
  <form class="form" onSubmit={handleSignIn}>
    {error && <div style={{color: 'red', marginBottom: '10px'}}>{error}</div>}
    <label for="name" class="label">
      <span class="title">USER NAME</span>
      <input
        class="input-field"
        type="text"
        name="input-name"
        title="Input title"
        placeholder="User Name"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
    </label>
    <label for="serialCardNumber" class="label">
      <span class="title">PASSWORD</span>
      <input
        id="serialCardNumber"
        class="input-field"
        type="password"
        name="input-name"
        title="Input title"
        placeholder="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
    </label>
 
    <input class="checkout-btn" type="submit" value={loading ? "SIGNING IN..." : "SIGN IN"} disabled={loading} />
  </form>
</section>
  )
}

export default SignIn
