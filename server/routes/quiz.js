const express = require('express');
const db = require('../db');
const { authMiddleware } = require('./auth');

const router = express.Router();
router.use(authMiddleware);

router.post('/submit', (req, res) => {
  const { answers } = req.body;
  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: '请提交作答数据' });
  }

  let score = 0;
  const graded = answers.map(a => {
    const q = db.getQuestionById(a.question_id, req.user.id);
    if (!q) return { ...a, is_correct: false, correct_answer: '', type: a.type, content: a.content, options: a.options };

    let is_correct = null;
    if (q.type === 'choice') {
      is_correct = String(a.user_answer).trim() === String(q.answer).trim();
    } else if (q.type === 'fill') {
      const ua = (a.user_answer || '').trim().toLowerCase();
      const ca = (q.answer || '').trim().toLowerCase();
      is_correct = ua.length > 0 && ca.split(',').map(s => s.trim()).includes(ua);
    }

    if (is_correct === true) score++;
    return {
      question_id: q.id,
      type: q.type,
      content: q.content,
      options: q.options,
      user_answer: a.user_answer || '',
      correct_answer: q.answer,
      explanation: q.explanation,
      is_correct
    };
  });

  const autoTotal = graded.filter(g => g.is_correct !== null).length;
  const session = db.createQuizSession(req.user.id, score, autoTotal, JSON.stringify(graded));

  res.json({
    session_id: session.id,
    score,
    total: autoTotal,
    answers: graded
  });
});

router.get('/history', (req, res) => {
  const sessions = db.getQuizHistory(req.user.id);
  const list = sessions.map(s => ({
    id: s.id,
    score: s.score,
    total: s.total,
    created_at: s.created_at,
    answers: typeof s.answers_json === 'string' ? JSON.parse(s.answers_json) : s.answers_json
  }));
  res.json({ sessions: list });
});

module.exports = router;
