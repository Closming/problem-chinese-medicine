const express = require('express');
const db = require('../db');
const { authMiddleware } = require('./auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const { type } = req.query;
  const questions = db.getQuestions(req.user.id, type && ['choice','fill','essay'].includes(type) ? type : null);
  res.json({ questions });
});

router.post('/', (req, res) => {
  const { type, content, options, answer, explanation } = req.body;
  if (!type || !content) return res.status(400).json({ error: '请填写题目类型和内容' });
  if (!['choice','fill','essay'].includes(type)) return res.status(400).json({ error: '无效的题目类型' });

  const opts = type === 'choice' ? JSON.stringify(options || ['','','','']) : null;
  const ans = type === 'essay' ? '' : (answer || '');

  const question = db.createQuestion(req.user.id, { type, content, options: opts, answer: ans, explanation: explanation || '' });
  res.status(201).json({ question });
});

router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const question = db.getQuestionById(id, req.user.id);
  if (!question) return res.status(404).json({ error: '题目不存在' });

  const { type, content, options, answer, explanation } = req.body;
  const updates = {};
  if (type) updates.type = type;
  if (content) updates.content = content;
  if (type === 'choice') updates.options = JSON.stringify(options || ['','','','']);
  else if (options) updates.options = options;
  if (type === 'essay') updates.answer = '';
  else if (answer !== undefined) updates.answer = answer;
  if (explanation !== undefined) updates.explanation = explanation;

  const updated = db.updateQuestion(id, req.user.id, updates);
  res.json({ question: updated });
});

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const ok = db.deleteQuestion(id, req.user.id);
  if (!ok) return res.status(404).json({ error: '题目不存在' });
  res.json({ success: true });
});

module.exports = router;
