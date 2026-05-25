import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('请填写邮箱和密码'); return; }
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>欢迎回来</h1>
        <p className="subtitle">登录以继续做题</p>
        {error && <div style={{background:'var(--danger-light)',color:'var(--danger)',padding:'10px 14px',borderRadius:'8px',marginBottom:'16px',fontSize:'.88rem',fontWeight:500}}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>邮箱</label>
            <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label>密码</label>
            <input type="password" placeholder="输入密码" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        <p style={{textAlign:'center',marginTop:'20px',fontSize:'.9rem',color:'var(--text-secondary)'}}>
          还没有账号？<Link to="/register" style={{color:'var(--primary)',fontWeight:600,textDecoration:'none'}}>立即注册</Link>
        </p>
      </div>
    </div>
  );
}
