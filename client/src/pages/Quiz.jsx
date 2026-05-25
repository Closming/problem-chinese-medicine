import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';

const LABELS = ['A', 'B', 'C', 'D'];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Quiz() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('start'); // start | active | result
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [fillInput, setFillInput] = useState('');
  const [essayInput, setEssayInput] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/questions').then(res => {
      setQuestions(res.data.questions);
    }).catch(() => {});
  }, []);

  const startQuiz = () => {
    if (questions.length === 0) return;
    setPhase('active');
    setIndex(0);
    setAnswers([]);
    setSelected(null);
    setFillInput('');
    setEssayInput('');
    setFeedback(null);
    setResult(null);
  };

  const currentQ = questions[index];
  const isLast = index === questions.length - 1;

  const submitAnswer = () => {
    let userAnswer = '';
    if (currentQ.type === 'choice') {
      if (selected === null) return;
      userAnswer = String(selected);
    } else if (currentQ.type === 'fill') {
      userAnswer = fillInput;
    } else {
      userAnswer = essayInput;
    }

    const newAnswers = [...answers, {
      question_id: currentQ.id,
      type: currentQ.type,
      user_answer: userAnswer,
      content: currentQ.content,
      options: currentQ.options,
      correct_answer: currentQ.answer,
      explanation: currentQ.explanation
    }];
    setAnswers(newAnswers);

    // Show feedback for auto-graded types
    if (currentQ.type === 'choice') {
      const isCorrect = String(selected) === String(currentQ.answer);
      setFeedback({ type: isCorrect ? 'correct' : 'wrong', isCorrect });
    } else if (currentQ.type === 'fill') {
      const ua = (fillInput || '').trim().toLowerCase();
      const ca = (currentQ.answer || '').trim().toLowerCase();
      const isCorrect = ua && ca.split(',').map(s => s.trim()).includes(ua);
      setFeedback({ type: isCorrect ? 'correct' : 'wrong', isCorrect });
    } else {
      setFeedback({ type: 'info', isCorrect: null });
    }
  };

  const nextQuestion = () => {
    if (isLast) {
      finishQuiz(answers);
    } else {
      setIndex(index + 1);
      setSelected(null);
      setFillInput('');
      setEssayInput('');
      setFeedback(null);
    }
  };

  const finishQuiz = async (finalAnswers) => {
    setLoading(true);
    try {
      const { data } = await api.post('/quiz/submit', { answers: finalAnswers });
      setResult(data);
      setPhase('result');
    } catch (err) {
      // If API fails, compute locally
      let score = 0;
      let total = 0;
      finalAnswers.forEach(a => {
        if (a.type === 'choice') {
          total++;
          if (String(a.user_answer) === String(a.correct_answer)) score++;
        } else if (a.type === 'fill') {
          total++;
          const ua = (a.user_answer || '').trim().toLowerCase();
          const ca = (a.correct_answer || '').trim().toLowerCase();
          if (ua && ca.split(',').map(s => s.trim()).includes(ua)) score++;
        }
      });
      const graded = finalAnswers.map(a => {
        let isCorrect = null;
        if (a.type === 'choice') {
          isCorrect = String(a.user_answer) === String(a.correct_answer);
        } else if (a.type === 'fill') {
          const ua = (a.user_answer || '').trim().toLowerCase();
          const ca = (a.correct_answer || '').trim().toLowerCase();
          isCorrect = ua && ca.split(',').map(s => s.trim()).includes(ua);
        }
        return { ...a, is_correct: isCorrect };
      });
      setResult({ score, total, answers: graded, session_id: null });
      setPhase('result');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <nav className="navbar">
        <Link to="/dashboard" className="navbar-brand">📝 题库做题</Link>
        <div className="navbar-links">
          <Link to="/dashboard">首页</Link>
          <Link to="/bank">题库管理</Link>
          <Link to="/quiz" className="active">开始做题</Link>
          <span className="navbar-user">{user?.name}</span>
          <button onClick={() => { logout(); navigate('/login'); }}>退出</button>
        </div>
      </nav>

      <div className="page">
        {phase === 'start' && (
          <div className="card" style={{textAlign:'center',padding:'48px 24px'}}>
            <div style={{fontSize:'3.5rem',marginBottom:'12px'}}>📋</div>
            <h2>准备开始做题</h2>
            <p style={{color:'var(--text-secondary)',margin:'8px 0 20px'}}>
              {questions.length === 0 ? '题库为空，请先添加题目' : `题库共 ${questions.length} 道题目，随机顺序作答`}
            </p>
            <button className="btn btn-primary btn-lg" onClick={startQuiz} disabled={questions.length === 0}>
              {questions.length === 0 ? '请先去题库管理添加题目' : '开始答题'}
            </button>
            {questions.length === 0 && (
              <div style={{marginTop:16}}>
                <Link to="/bank" className="btn btn-outline">去添加题目 →</Link>
              </div>
            )}
          </div>
        )}

        {phase === 'active' && currentQ && (
          <div>
            <div className="quiz-header">
              <span>第 {index + 1}/{questions.length} 题</span>
              <span style={{display:'flex',alignItems:'center',gap:4}}>
                <span className={`badge badge-${currentQ.type}`}>
                  {currentQ.type === 'choice' ? '选择题' : currentQ.type === 'fill' ? '填空题' : '主观题'}
                </span>
              </span>
            </div>
            <div className="quiz-progress-bar">
              <div className="quiz-progress-fill" style={{width:`${((index)/questions.length)*100}%`}} />
            </div>

            <div className="card">
              <div className="quiz-question">{currentQ.content}</div>

              {currentQ.type === 'choice' && (() => {
                const opts = JSON.parse(currentQ.options || '[]');
                return (
                  <div className="quiz-options">
                    {opts.map((opt, i) => (
                      <div key={i}
                        className={`quiz-option${selected === i ? ' selected' : ''}${feedback && String(i) === String(currentQ.answer) ? ' correct' : ''}${feedback && selected === i && String(i) !== String(currentQ.answer) ? ' wrong' : ''}${feedback ? ' disabled' : ''}`}
                        onClick={() => { if (!feedback) setSelected(i); }}>
                        <span className="opt-label">{LABELS[i]}</span>
                        <span>{opt}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {currentQ.type === 'fill' && (
                <div>
                  <input className="quiz-fill-input" placeholder="输入你的答案..."
                    value={fillInput} onChange={e => setFillInput(e.target.value)}
                    disabled={!!feedback} />
                </div>
              )}

              {currentQ.type === 'essay' && (
                <div>
                  <textarea className="quiz-essay-input" placeholder="请输入你的作答..."
                    value={essayInput} onChange={e => setEssayInput(e.target.value)}
                    disabled={!!feedback} />
                </div>
              )}

              {feedback && (
                <div className={`quiz-feedback ${feedback.type}`}>
                  {feedback.type === 'correct' && '✓ 回答正确！'}
                  {feedback.type === 'wrong' && `✗ 回答错误！正确答案是 ${currentQ.type === 'choice' ? LABELS[currentQ.answer] + '. ' + JSON.parse(currentQ.options || '[]')[currentQ.answer] : currentQ.answer}`}
                  {feedback.type === 'info' && '📝 已记录你的作答（主观题需人工评分）'}
                  {currentQ.explanation && (
                    <div style={{marginTop:6,fontWeight:400,fontSize:'.85rem'}}>解析：{currentQ.explanation}</div>
                  )}
                </div>
              )}

              <div className="quiz-nav">
                {!feedback ? (
                  <button className="btn btn-primary btn-lg"
                    onClick={submitAnswer}
                    disabled={(currentQ.type === 'choice' && selected === null) || loading}>
                    {isLast ? '提交' : '确认答案'}
                  </button>
                ) : (
                  <button className="btn btn-primary btn-lg" onClick={nextQuestion} disabled={loading}>
                    {loading ? '提交中...' : isLast ? '查看结果' : '下一题 →'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {phase === 'result' && result && (
          <div>
            <div className="card result-hero">
              <div className="result-emoji">
                {result.total > 0 && result.score/result.total >= 1 ? '🏆' :
                 result.total > 0 && result.score/result.total >= 0.8 ? '🎉' :
                 result.total > 0 && result.score/result.total >= 0.6 ? '📚' : '💪'}
              </div>
              <div className={`result-score ${
                result.total > 0 && result.score/result.total >= 0.8 ? 'great' :
                result.total > 0 && result.score/result.total >= 0.6 ? 'good' : 'ok'
              }`}>
                {result.score}/{result.total}
              </div>
              <div className="result-detail">
                {result.total > 0
                  ? `正确率 ${Math.round(result.score/result.total*100)}%（仅统计自动评分的题目）`
                  : '已提交作答'}
              </div>
              <div className="btn-group" style={{justifyContent:'center'}}>
                <button className="btn btn-primary" onClick={startQuiz}>再来一次</button>
                <Link to="/dashboard" className="btn btn-outline">返回首页</Link>
              </div>
            </div>

            <div className="card">
              <h3 style={{marginBottom:16}}>答题回顾</h3>
              {result.answers.map((a, i) => {
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
          </div>
        )}
      </div>
    </div>
  );
}
