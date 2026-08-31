import React, { useState } from 'react';
import { supabase, LOGIN_EMAIL } from '../lib/supabaseClient.js';

export default function Login() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({
      email: LOGIN_EMAIL,
      password,
    });
    setLoading(false);
    if (error) {
      setError('密碼錯誤，請再試一次');
    }
  };

  return (
    <div className="login-screen">
      <style>{`
        .login-screen {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #FBF7F2;
          font-family: 'Noto Sans TC', sans-serif;
          padding: 20px;
        }
        .login-card {
          background: #FFFFFF;
          border: 1px solid #E4DCD2;
          border-radius: 10px;
          padding: 40px 32px;
          width: 100%;
          max-width: 340px;
          box-shadow: 0 20px 50px rgba(74,59,50,0.12);
        }
        .login-brand {
          font-family: 'Noto Serif TC', serif;
          font-size: 22px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: #4A3B32;
          text-align: center;
          margin-bottom: 4px;
        }
        .login-sub {
          text-align: center;
          font-size: 13px;
          color: #9C8D82;
          margin-bottom: 28px;
        }
        .login-card input {
          width: 100%;
          font-family: inherit;
          font-size: 16px;
          padding: 12px 14px;
          border: 1px solid #E4DCD2;
          border-radius: 6px;
          background: #FBF7F2;
          color: #4A3B32;
          box-sizing: border-box;
        }
        .login-card button {
          width: 100%;
          margin-top: 14px;
          background: #B98077;
          color: #FFFFFF;
          border: none;
          border-radius: 6px;
          padding: 12px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }
        .login-card button:disabled { opacity: 0.6; cursor: not-allowed; }
        .login-error {
          color: #B15C52;
          font-size: 12px;
          margin-top: 10px;
          text-align: center;
        }
      `}</style>
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand">HSIN.EE</div>
        <div className="login-sub">工作室後台・請輸入密碼</div>
        <input
          type="password"
          inputMode="text"
          autoFocus
          placeholder="密碼"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" disabled={loading}>{loading ? '登入中…' : '登入'}</button>
        {error && <div className="login-error">{error}</div>}
      </form>
    </div>
  );
}
