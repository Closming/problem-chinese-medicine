const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.json');

function readDB() {
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
  catch { return { users: [], questions: [], quiz_sessions: [], _next_id: 1 }; }
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function nextId(data) {
  const id = data._next_id || 1;
  data._next_id = id + 1;
  return id;
}

// ── Users ──
function findUserByEmail(email) {
  const db = readDB();
  return db.users.find(u => u.email === email) || null;
}

function findUserById(id) {
  const db = readDB();
  return db.users.find(u => u.id === id) || null;
}

function createUser(email, passwordHash, name) {
  const db = readDB();
  const id = nextId(db);
  const user = { id, email, password: passwordHash, name, created_at: new Date().toISOString() };
  db.users.push(user);
  writeDB(db);
  return user;
}

// ── Questions ──
function getQuestions(userId, type) {
  const db = readDB();
  let qs = db.questions.filter(q => q.user_id === userId);
  if (type) qs = qs.filter(q => q.type === type);
  return qs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function getQuestionById(id, userId) {
  const db = readDB();
  return db.questions.find(q => q.id === id && q.user_id === userId) || null;
}

function createQuestion(userId, data) {
  const db = readDB();
  const id = nextId(db);
  const q = {
    id,
    user_id: userId,
    type: data.type,
    content: data.content,
    options: data.options || null,
    answer: data.answer || '',
    explanation: data.explanation || '',
    created_at: new Date().toISOString()
  };
  db.questions.push(q);
  writeDB(db);
  return q;
}

function updateQuestion(id, userId, data) {
  const db = readDB();
  const idx = db.questions.findIndex(q => q.id === id && q.user_id === userId);
  if (idx === -1) return null;
  const q = db.questions[idx];
  if (data.type !== undefined) q.type = data.type;
  if (data.content !== undefined) q.content = data.content;
  if (data.options !== undefined) q.options = data.options;
  if (data.answer !== undefined) q.answer = data.answer;
  if (data.explanation !== undefined) q.explanation = data.explanation;
  writeDB(db);
  return q;
}

function deleteQuestion(id, userId) {
  const db = readDB();
  const idx = db.questions.findIndex(q => q.id === id && q.user_id === userId);
  if (idx === -1) return false;
  db.questions.splice(idx, 1);
  writeDB(db);
  return true;
}

// ── Quiz Sessions ──
function createQuizSession(userId, score, total, answersJson) {
  const db = readDB();
  const id = nextId(db);
  const session = {
    id,
    user_id: userId,
    score,
    total,
    answers_json: answersJson,
    created_at: new Date().toISOString()
  };
  db.quiz_sessions.push(session);
  writeDB(db);
  return session;
}

function getQuizHistory(userId, limit = 20) {
  const db = readDB();
  return db.quiz_sessions
    .filter(s => s.user_id === userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, limit);
}

module.exports = {
  findUserByEmail, findUserById, createUser,
  getQuestions, getQuestionById, createQuestion, updateQuestion, deleteQuestion,
  createQuizSession, getQuizHistory
};
