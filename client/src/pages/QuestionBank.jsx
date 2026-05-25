import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';

const LABELS = ['A', 'B', 'C', 'D'];
const TYPES = [
  { key: '', label: '全部' },
  { key: 'choice', label: '选择题' },
  { key: 'fill', label: '填空题' },
  { key: 'essay', label: '主观题' }
];

export default function QuestionBank() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState('');

  const [form, setForm] = useState({ type: 'choice', content: '', options: ['', '', '', ''], answer: '0', explanation: '' });

  const fetchQuestions = useCallback(() => {
    const params = filter ? `?type=${filter}` : '';
    api.get(`/questions${params}`).then(res => setQuestions(res.data.questions)).catch(() => {});
  }, [filter]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const openAdd = () => {
    setEditing(null);
    setForm({ type: 'choice', content: '', options: ['', '', '', ''], answer: '0', explanation: '' });
    setShowModal(true);
  };

  const openEdit = (q) => {
    setEditing(q);
    setForm({
      type: q.type,
      content: q.content,
      options: q.options ? JSON.parse(q.options) : ['', '', '', ''],
      answer: q.answer || '0',
      explanation: q.explanation || ''
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.content.trim()) { setToast('请输入题目内容'); return; }
    if (form.type === 'choice' && form.options.some(o => !o.trim())) { setToast('请填写所有选项'); return; }
    if (form.type === 'fill' && !form.answer.trim()) { setToast('请填写正确答案'); return; }

    const payload = {
      type: form.type,
      content: form.content,
      options: form.type === 'choice' ? form.options : null,
      answer: form.type === 'essay' ? '' : form.answer,
      explanation: form.explanation
    };

    try {
      if (editing) {
        await api.put(`/questions/${editing.id}`, payload);
      } else {
        await api.post('/questions', payload);
      }
      setShowModal(false);
      fetchQuestions();
      setToast(editing ? '题目已更新' : '题目已添加');
    } catch (err) {
      setToast(err.response?.data?.error || '操作失败');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定删除这道题目吗？')) return;
    try {
      await api.delete(`/questions/${id}`);
      fetchQuestions();
      setToast('题目已删除');
    } catch (err) {
      setToast('删除失败');
    }
  };

  const filtered = search ? questions.filter(q => q.content.toLowerCase().includes(search.toLowerCase())) : questions;

  return (
    <div>
      <nav className="navbar">
        <Link to="/dashboard" className="navbar-brand">📝 题库做题</Link>
        <div className="navbar-links">
          <Link to="/dashboard">首页</Link>
          <Link to="/bank" className="active">题库管理</Link>
          <Link to="/quiz">开始做题</Link>
          <span className="navbar-user">{user?.name}</span>
          <button onClick={() => { logout(); navigate('/login'); }}>退出</button>
        </div>
      </nav>

      <div className="page">
        <div className="card-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <h2>题库管理</h2>
            <p>管理你的题目，支持选择题、填空题、主观题</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>+ 添加题目</button>
        </div>

        <div className="card">
          <div className="search-bar">
            <input placeholder="搜索题目..." value={search} onChange={e => setSearch(e.target.value)} />
            <span style={{fontSize:'.85rem',color:'var(--text-muted)',whiteSpace:'nowrap'}}>共 {questions.length} 题</span>
          </div>
          <div className="tabs">
            {TYPES.map(t => (
              <button key={t.key} className={`tab ${filter === t.key ? 'active' : ''}`} onClick={() => setFilter(t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <span className="icon">📝</span>
              <p>{questions.length === 0 ? '还没有题目，点击上方按钮添加' : '没有匹配的题目'}</p>
            </div>
          ) : (
            filtered.map(q => {
              const opts = q.type === 'choice' ? JSON.parse(q.options || '[]') : [];
              return (
                <div key={q.id} className="q-item">
                  <div className="q-item-top">
                    <div>
                      <span className={`badge badge-${q.type}`}>
                        {q.type === 'choice' ? '选择' : q.type === 'fill' ? '填空' : '主观'}
                      </span>
                      <span className="q-item-content" style={{marginLeft:8}}>{q.content}</span>
                      <div className="q-item-meta">
                        {q.type === 'choice' && `答案：${LABELS[q.answer]}. ${opts[q.answer] || ''}`}
                        {q.type === 'fill' && `答案：${q.answer}`}
                        {q.type === 'essay' && '主观题（人工评分）'}
                      </div>
                    </div>
                    <div className="q-item-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(q)}>编辑</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(q.id)}>删除</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal">
            <h3>{editing ? '编辑题目' : '添加题目'}</h3>

            <div className="form-group">
              <label>题目类型</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="choice">选择题</option>
                <option value="fill">填空题</option>
                <option value="essay">主观题</option>
              </select>
            </div>

            <div className="form-group">
              <label>题目内容</label>
              <textarea rows="3" placeholder="请输入题目内容..." value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })} />
            </div>

            {form.type === 'choice' && (
              <>
                {[0,1,2,3].map(i => (
                  <div className="form-group" key={i}>
                    <label>选项 {LABELS[i]}</label>
                    <input placeholder={`选项 ${LABELS[i]}`} value={form.options[i]}
                      onChange={e => {
                        const opts = [...form.options];
                        opts[i] = e.target.value;
                        setForm({ ...form, options: opts });
                      }} />
                  </div>
                ))}
                <div className="form-group">
                  <label>正确答案</label>
                  <select value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })}>
                    {[0,1,2,3].map(i => (
                      <option key={i} value={i}>{LABELS[i]}. {form.options[i] || '(空)'}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {form.type === 'fill' && (
              <div className="form-group">
                <label>正确答案（多个答案用逗号分隔）</label>
                <input placeholder="例如：光合作用 或 光合作用,photosynthesis" value={form.answer}
                  onChange={e => setForm({ ...form, answer: e.target.value })} />
              </div>
            )}

            {form.type === 'essay' && (
              <p style={{fontSize:'.85rem',color:'var(--text-muted)',marginBottom:14}}>
                主观题无需设置标准答案，学生提交后由教师手动评分。
              </p>
            )}

            <div className="form-group">
              <label>解析（可选）</label>
              <textarea rows="2" placeholder="题目解析，做题后展示" value={form.explanation}
                onChange={e => setForm({ ...form, explanation: e.target.value })} />
            </div>

            <div className="btn-group" style={{justifyContent:'flex-end'}}>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSave}>{editing ? '保存' : '添加'}</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast" onAnimationEnd={() => setTimeout(() => setToast(''), 2000)} style={{animation:'toastIn .25s'}}>
          {toast}
        </div>
      )}
    </div>
  );
}
