import React from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/dashboard");
  };

  return (
    <div>
      <h2>Login Page</h2>
      <input placeholder="Enter Name" />
      <select>
        <option>Student</option>
        <option>Teacher</option>
      </select>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default Login;