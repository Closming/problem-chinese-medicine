import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.get('/questions').then(res => {
      const qs = res.data.questions;
      setStats({
        total: qs.length,
        choice: qs.filter(q => q.type === 'choice').length,
        fill: qs.filter(q => q.type === 'fill').length,
        essay: qs.filter(q => q.type === 'essay').length
      });
    }).catch(() => {});
    api.get('/quiz/history').then(res => {
      setHistory(res.data.sessions.slice(0, 5));
    }).catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div>
      <nav className="navbar">
        <Link to="/dashboard" className="navbar-brand">📝 题库做题</Link>
        <div className="navbar-links">
          <Link to="/dashboard" className="active">首页</Link>
          <Link to="/bank">题库管理</Link>
          <Link to="/quiz">开始做题</Link>
          <span className="navbar-user">{user?.name}</span>
          <button onClick={handleLogout}>退出</button>
        </div>
      </nav>

      <div className="page">
        <div className="card-header" style={{marginBottom:16}}>
          <h2>你好，{user?.name}</h2>
          <p>欢迎使用在线题库做题系统</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{background:'var(--primary-light)',color:'var(--primary)'}}>📋</div>
            <div className="stat-value">{stats?.total ?? '--'}</div>
            <div className="stat-label">总题目数</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{background:'#dbeafe',color:'#1d4ed8'}}>🔤</div>
            <div className="stat-value">{stats?.choice ?? '--'}</div>
            <div className="stat-label">选择题</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{background:'#fef3c7',color:'#b45309'}}>✏️</div>
            <div className="stat-value">{stats?.fill ?? '--'}</div>
            <div className="stat-label">填空题</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{background:'#ede9fe',color:'#7c3aed'}}>📝</div>
            <div className="stat-value">{stats?.essay ?? '--'}</div>
            <div className="stat-label">主观题</div>
          </div>
        </div>

        <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
          <Link to="/quiz" className="btn btn-primary btn-lg" style={{fontSize:'1.05rem',padding:'16px 36px'}}>
            开始做题 →
          </Link>
          <Link to="/bank" className="btn btn-outline btn-lg" style={{fontSize:'1.05rem',padding:'16px 36px'}}>
            管理题库
          </Link>
        </div>

        {history.length > 0 && (
          <div className="card" style={{marginTop:28}}>
            <h3 style={{marginBottom:14}}>最近做题记录</h3>
            {history.map(s => (
              <div key={s.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid var(--border)'}}
                   onClick={() => navigate(`/results/${s.id}`)} title="点击查看详情">
                <div>
                  <span style={{fontWeight:600}}>
                    得分 {s.score}/{s.total}
                  </span>
                  <span style={{color:'var(--text-muted)',fontSize:'.82rem',marginLeft:10}}>
                    {new Date(s.created_at + 'Z').toLocaleString('zh-CN')}
                  </span>
                </div>
                <span style={{
                  fontSize:'.85rem',fontWeight:600,
                  color: s.total > 0 && (s.score/s.total) >= 0.8 ? 'var(--success)' :
                         s.total > 0 && (s.score/s.total) >= 0.6 ? 'var(--warning)' : 'var(--text-secondary)'
                }}>
                  {s.total > 0 ? Math.round(s.score/s.total*100) + '%' : 'N/A'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
