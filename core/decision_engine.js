javascript
/**
 * ============================================================
 *  DECISION ENGINE — AI Interview Platform
 *  Controls overall interview flow dynamically.
 * ============================================================
 *
 *  4 Core Decisions:
 *    1. Next Question      — what topic/type to ask next
 *    2. Follow-Up          — should we dig deeper on this answer?
 *    3. Difficulty Change  — go harder, easier, or stay same?
 *    4. Interview End      — is it time to stop?
 * ============================================================
 */

'use strict';

const DIFFICULTY = { EASY: 1, MEDIUM: 2, HARD: 3 };

const DECISION = {
  NEXT_QUESTION:     "NEXT_QUESTION",
  FOLLOW_UP:        "FOLLOW_UP",
  INCREASE_DIFF:    "INCREASE_DIFFICULTY",
  DECREASE_DIFF:    "DECREASE_DIFFICULTY",
  END_INTERVIEW:    "END_INTERVIEW",
};

const ANSWER_QUALITY = { POOR: "poor", AVERAGE: "average", GOOD: "good", EXCELLENT: "excellent" };

function createSession(config = {}) {
  return {
    id:                   config.sessionId || crypto.randomUUID(),
    candidateName:        config.candidateName || "Candidate",
    role:                 config.role || "Software Engineer",
    totalQuestions:       config.totalQuestions || 10,
    maxDurationMinutes:   config.maxDurationMinutes || 45,
    startTime:            Date.now(),
    currentDifficulty:    config.startDifficulty || DIFFICULTY.MEDIUM,
    questionCount:        0,
    followUpCount:        0,
    maxFollowUpsPerQ:     config.maxFollowUpsPerQ || 2,
    coveredTopics:        new Set(),
    topicsQueue:          [...(config.topics || defaultTopics(config.role))],
    answers:              [],
    consecutivePoor:      0,
    consecutiveGood:      0,
    endReason:            null,
    ended:                false,
  };
}

function defaultTopics(role) {
  const map = {
    "Software Engineer": [
      "data structures", "algorithms", "system design",
      "OOP", "databases", "APIs", "testing", "git workflow",
    ],
    "Data Scientist": [
      "statistics", "machine learning", "python", "sql",
      "data cleaning", "model evaluation", "feature engineering",
    ],
    "Product Manager": [
      "product strategy", "user research", "prioritization",
      "metrics", "stakeholder management", "roadmapping",
    ],
  };
  return map[role] || ["general knowledge", "problem solving", "communication"];
}

function decideNextQuestion(session, questionBank) {
  const available = session.topicsQueue.filter(t => !session.coveredTopics.has(t));
  const topicPool = available.length > 0 ? available : [...defaultTopics(session.role)];
  const topic = topicPool[0] || topicPool[Math.floor(Math.random() * topicPool.length)];

  const candidates = questionBank.filter(q =>
    q.topic === topic &&
    q.difficulty === session.currentDifficulty &&
    !session.answers.some(a => a.questionId === q.id)
  );

  if (candidates.length === 0) {
    const fallback = questionBank.filter(q =>
      q.difficulty === session.currentDifficulty &&
      !session.answers.some(a => a.questionId === q.id)
    );
    return fallback[0] || null;
  }

  return candidates[0];
}

function decideFollowUp(session, lastAnswerQuality) {
  if (session.followUpCount >= session.maxFollowUpsPerQ) {
    return { shouldFollowUp: false, reason: "Max follow-ups reached for this question" };
  }

  const questionsRemaining = session.totalQuestions - session.questionCount;
  if (questionsRemaining <= 1) {
    return { shouldFollowUp: false, reason: "Too close to question limit" };
  }

  if (lastAnswerQuality === ANSWER_QUALITY.POOR || lastAnswerQuality === ANSWER_QUALITY.AVERAGE) {
    return {
      shouldFollowUp: true,
      reason: "Answer needs clarification or more depth",
      followUpType: "clarification",
    };
  }

  if (lastAnswerQuality === ANSWER_QUALITY.EXCELLENT && session.currentDifficulty < DIFFICULTY.HARD) {
    return {
      shouldFollowUp: true,
      reason: "Strong answer — probing deeper",
      followUpType: "deep_dive",
    };
  }

  return { shouldFollowUp: false, reason: "Answer was sufficient, move on" };
}

function decideDifficultyChange(session) {
  if (session.followUpCount > 0) {
    return { change: null, newDifficulty: session.currentDifficulty, reason: "Mid follow-up — no change" };
  }

  if (session.consecutiveGood >= 2 && session.currentDifficulty < DIFFICULTY.HARD) {
    const newDiff = session.currentDifficulty + 1;
    return {
      change: DECISION.INCREASE_DIFF,
      newDifficulty: newDiff,
      reason: session.consecutiveGood + ' good answers in a row increasing difficulty',
    };
  }

  if (session.consecutivePoor >= 2 && session.currentDifficulty > DIFFICULTY.EASY) {
    const newDiff = session.currentDifficulty - 1;
    return {
      change: DECISION.DECREASE_DIFF,
      newDifficulty: newDiff,
      reason: session.consecutivePoor + ' poor answers in a row decreasing difficulty',
    };
  }

  return { change: null, newDifficulty: session.currentDifficulty, reason: "Performance stable — no change" };
}

function decideInterviewEnd(session) {
  const elapsedMinutes = (Date.now() - session.startTime) / 60000;

  if (elapsedMinutes >= session.maxDurationMinutes) {
    return { shouldEnd: true, reason: "Time limit reached", endType: "time_limit" };
  }

  if (session.questionCount >= session.totalQuestions) {
    return { shouldEnd: true, reason: "Maximum questions reached", endType: "question_limit" };
  }

  const allTopicsCovered = session.topicsQueue.every(t => session.coveredTopics.has(t));
  if (allTopicsCovered && session.questionCount >= Math.floor(session.totalQuestions / 2)) {
    return { shouldEnd: true, reason: "All topics covered", endType: "coverage_complete" };
  }

  if (session.consecutivePoor >= 3 && session.currentDifficulty === DIFFICULTY.EASY) {
    return {
      shouldEnd: true,
      reason: "Candidate struggling significantly at easy difficulty",
      endType: "early_exit_poor_performance",
    };
  }

  return { shouldEnd: false };
}

function processAnswer(session, answerQuality, questionBank) {
  if (session.ended) throw new Error("Session already ended");

  if (answerQuality === ANSWER_QUALITY.GOOD || answerQuality === ANSWER_QUALITY.EXCELLENT) {
    session.consecutiveGood++;
    session.consecutivePoor = 0;
  } else if (answerQuality === ANSWER_QUALITY.POOR) {
    session.consecutivePoor++;
    session.consecutiveGood = 0;
  } else {
    session.consecutiveGood = Math.max(0, session.consecutiveGood - 1);
    session.consecutivePoor = Math.max(0, session.consecutivePoor - 1);
  }

  session.answers.push({
    questionCount: session.questionCount,
    quality:       answerQuality,
    difficulty:    session.currentDifficulty,
    timestamp:     Date.now(),
  });

  const endDecision = decideInterviewEnd(session);
  if (endDecision.shouldEnd) {
    session.ended = true;
    session.endReason = endDecision.reason;
    return { action: DECISION.END_INTERVIEW, ...endDecision };
  }

  const diffDecision = decideDifficultyChange(session);
  if (diffDecision.change) {
    session.currentDifficulty = diffDecision.newDifficulty;
    session.consecutiveGood = 0;
    session.consecutivePoor = 0;
  }

  const followUp = decideFollowUp(session, answerQuality);
  if (followUp.shouldFollowUp) {
    session.followUpCount++;
    return {
      action:         DECISION.FOLLOW_UP,
      followUpType:   followUp.followUpType,
      reason:         followUp.reason,
      difficultyInfo: diffDecision,
    };
  }

  session.followUpCount = 0;
  session.questionCount++;

  const nextQ = decideNextQuestion(session, questionBank);
  if (!nextQ) {
    session.ended = true;
    session.endReason = "No more questions available";
    return { action: DECISION.END_INTERVIEW, reason: "Question bank exhausted" };
  }

  if (nextQ.topic) session.coveredTopics.add(nextQ.topic);

  return {
    action:         DECISION.NEXT_QUESTION,
    question:       nextQ,
    difficultyInfo: diffDecision,
    sessionStats: {
      questionCount:     session.questionCount,
      currentDifficulty: session.currentDifficulty,
      coveredTopics:     [...session.coveredTopics],
    },
  };
}

module.exports = {
  DIFFICULTY,
  DECISION,
  ANSWER_QUALITY,
  createSession,
  processAnswer,
  decideNextQuestion,
  decideFollowUp,
  decideDifficultyChange,
  decideInterviewEnd,
};

