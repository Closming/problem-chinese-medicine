import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';

const LABELS = ['A', 'B', 'C', 'D'];

export default function Results() {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/quiz/history').then(res => {
      setSessions(res.data.sessions);
      if (id && id !== 'latest') {
        const found = res.data.sessions.find(s => String(s.id) === String(id));
        if (found) setSession(found);
        else if (res.data.sessions.length > 0) setSession(res.data.sessions[0]);
      } else if (res.data.sessions.length > 0) {
        setSession(res.data.sessions[0]);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div>
      <nav className="navbar">
        <Link to="/dashboard" className="navbar-brand">📝 题库做题</Link>
        <div className="navbar-links">
          <Link to="/dashboard">首页</Link>
          <Link to="/bank">题库管理</Link>
          <Link to="/quiz">开始做题</Link>
          <span className="navbar-user">{user?.name}</span>
          <button onClick={() => { logout(); navigate('/login'); }}>退出</button>
        </div>
      </nav>
      <div className="page"><div className="loading-screen"><div className="spinner" /></div></div>
    </div>
  );

  return (
    <div>
      <nav className="navbar">
        <Link to="/dashboard" className="navbar-brand">📝 题库做题</Link>
        <div className="navbar-links">
          <Link to="/dashboard">首页</Link>
          <Link to="/bank">题库管理</Link>
          <Link to="/quiz">开始做题</Link>
          <span className="navbar-user">{user?.name}</span>
          <button onClick={() => { logout(); navigate('/login'); }}>退出</button>
        </div>
      </nav>

      <div className="page">
        {sessions.length === 0 ? (
          <div className="card" style={{textAlign:'center',padding:'48px 24px'}}>
            <div className="empty-state">
              <span className="icon">📋</span>
              <p>还没有做题记录</p>
              <Link to="/quiz" className="btn btn-primary" style={{marginTop:12}}>去做题</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="card-header">
              <h2>做题历史</h2>
              <p>查看过往的答题记录和回顾</p>
            </div>

            <div className="card" style={{marginBottom:20}}>
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                {sessions.map(s => (
                  <button key={s.id}
                    className={`btn ${session && session.id === s.id ? 'btn-primary' : 'btn-outline'} btn-sm`}
                    onClick={() => setSession(s)}>
                    {new Date(s.created_at + 'Z').toLocaleString('zh-CN')}
                    <span style={{marginLeft:6,opacity:.7}}>
                      {s.total > 0 ? Math.round(s.score/s.total*100) + '%' : 'N/A'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {session && (
              <>
                <div className="card result-hero">
                  <div className="result-emoji">
                    {session.total > 0 && session.score/session.total >= 1 ? '🏆' :
                     session.total > 0 && session.score/session.total >= 0.8 ? '🎉' :
                     session.total > 0 && session.score/session.total >= 0.6 ? '📚' : '💪'}
                  </div>
                  <div className={`result-score ${
                    session.total > 0 && session.score/session.total >= 0.8 ? 'great' :
                    session.total > 0 && session.score/session.total >= 0.6 ? 'good' : 'ok'
                  }`}>
                    {session.score}/{session.total}
                  </div>
                  <div className="result-detail">
                    {session.total > 0
                      ? `正确率 ${Math.round(session.score/session.total*100)}%`
                      : '已提交作答'}
                    <br />
                    <span style={{fontSize:'.82rem'}}>
                      {new Date(session.created_at + 'Z').toLocaleString('zh-CN')}
                    </span>
                  </div>
                </div>

                <div className="card">
                  <h3 style={{marginBottom:16}}>答题回顾</h3>
                  {session.answers.map((a, i) => {
                    const choiceOpts = a.type === 'choice' ? JSON.parse(a.options || '[]') : [];
                    return (
                      <div key={i} className={`review-item ${a.is_correct === true ? 'correct' : a.is_correct === false ? 'wrong' : 'pending'}`}>
                        <div className="review-q">
                          <span className={`badge badge-${a.type}`} style={{marginRight:8}}>
                            {a.type === 'choice' ? '选择' : a.type === 'fill' ? '填空' : '主观'}
                          </span>
                          {i + 1}. {a.content}
                        </div>
                        <div className="review-detail">
                          {a.type === 'choice' && (
                            <>
                              你的答案：<span className={a.is_correct ? 'review-correct' : 'review-user'}>
                                {LABELS[a.user_answer]}. {choiceOpts[a.user_answer] || '未作答'}
                              </span>
                              {!a.is_correct && (
                                <> | 正确答案：<span className="review-correct">
                                  {LABELS[a.correct_answer]}. {choiceOpts[a.correct_answer]}
                                </span></>
                              )}
                            </>
                          )}
                          {a.type === 'fill' && (
                            <>
                              你的答案：<span className={a.is_correct ? 'review-correct' : 'review-user'}>{a.user_answer || '未作答'}</span>
                              {!a.is_correct && <> | 正确答案：<span className="review-correct">{a.correct_answer}</span></>}
                            </>
                          )}
                          {a.type === 'essay' && (
                            <>
                              你的作答：<span style={{color:'var(--text)'}}>{a.user_answer || '未作答'}</span>
                              <span style={{color:'var(--text-muted)',marginLeft:8}}>（主观题，待评分）</span>
                            </>
                          )}
                          {a.explanation && <div style={{marginTop:4,color:'var(--text-muted)'}}>解析：{a.explanation}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
