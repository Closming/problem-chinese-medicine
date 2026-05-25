import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password) { setError('请填写所有信息'); return; }
    if (password.length < 6) { setError('密码至少6位'); return; }
    setLoading(true);
    try {
      await register(email, password, name);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>创建账号</h1>
        <p className="subtitle">注册后即可使用题库做题</p>
        {error && <div style={{background:'var(--danger-light)',color:'var(--danger)',padding:'10px 14px',borderRadius:'8px',marginBottom:'16px',fontSize:'.88rem',fontWeight:500}}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>姓名</label>
            <input type="text" placeholder="你的名字" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label>邮箱</label>
            <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label>密码</label>
            <input type="password" placeholder="至少6位密码" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? '注册中...' : '注册'}
          </button>
        </form>
        <p style={{textAlign:'center',marginTop:'20px',fontSize:'.9rem',color:'var(--text-secondary)'}}>
          已有账号？<Link to="/login" style={{color:'var(--primary)',fontWeight:600,textDecoration:'none'}}>去登录</Link>
        </p>
      </div>
    </div>
  );
}
