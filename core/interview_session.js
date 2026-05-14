const { Evaluator } = require('./evaluator');
const { generateSessionId } = require('../utils/helpers');
const { saveSession } = require('../utils/logger');
const config = require('../config/engine_config');
const fs = require('fs');
const path = require('path');

class InterviewSession {
  constructor(config2 = {}) {
    this.evaluator = new Evaluator();
    this.sessionId = generateSessionId();
    this.questionCount = 0;
    this.currentDifficulty = 2;
    this.followUpCount = 0;
    this.history = [];
    this.questionBank = this._loadQuestions();
    this.currentQuestion = null;
    this.askedIds = new Set();
  }

  _loadQuestions() {
    const dir = path.join(__dirname, '../data/questions');
    return fs.readdirSync(dir).flatMap(file =>
      JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'))
    );
  }

  start() {
    this.currentQuestion = this._pickQuestion(this.currentDifficulty);
    return {
      sessionId: this.sessionId,
      question: this.currentQuestion.question,
      topic: this.currentQuestion.topic,
      difficulty: this.currentQuestion.difficulty,
    };
  }

  answer(userAnswer) {
    const evaluation = this.evaluator.evaluate(this.currentQuestion, userAnswer);
    this.history.push({
      question: this.currentQuestion.question,
      answer: userAnswer,
      score: evaluation.score,
      feedback: evaluation.feedback,
    });

    this.askedIds.add(this.currentQuestion.id);
    this.questionCount++;

    if (this.questionCount >= config.MAX_QUESTIONS) {
      saveSession(this.sessionId, { sessionId: this.sessionId, history: this.history });
      return { status: 'END', summary: { totalQuestions: this.questionCount, history: this.history } };
    }

    if (evaluation.score < 0.5 && this.followUpCount < config.MAX_FOLLOW_UPS) {
      this.followUpCount++;
      this.currentQuestion = { ...this.currentQuestion, question: this.currentQuestion.follow_up };
      return { status: 'CONTINUE', question: this.currentQuestion.question, feedback: evaluation.feedback, decision: 'FOLLOW_UP' };
    }

    this.followUpCount = 0;
    if (evaluation.score >= 0.8 && this.currentDifficulty < config.DIFFICULTY.HARD) this.currentDifficulty++;
    if (evaluation.score < 0.4 && this.currentDifficulty > config.DIFFICULTY.EASY) this.currentDifficulty--;

    this.currentQuestion = this._pickQuestion(this.currentDifficulty);
    return { status: 'CONTINUE', question: this.currentQuestion.question, feedback: evaluation.feedback, decision: 'NEXT_QUESTION' };
  }

  _pickQuestion(difficulty) {
    const pool = this.questionBank.filter(q =>
      q.difficulty === difficulty && !this.askedIds.has(q.id)
    );
    return pool[Math.floor(Math.random() * pool.length)] || this.questionBank[0];
  }
}

module.exports = InterviewSession;