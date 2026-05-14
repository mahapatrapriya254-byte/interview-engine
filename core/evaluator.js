class EvaluationResult {
  constructor({ score, complete, clear, engaged, topic, feedback }) {
    this.score    = score;
    this.complete = complete;
    this.clear    = clear;
    this.engaged  = engaged;
    this.topic    = topic;
    this.feedback = feedback;
  }

  toSignals() {
    return {
      score:    this.score,
      complete: this.complete,
      clear:    this.clear,
      engaged:  this.engaged,
      topic:    this.topic,
    };
  }
}

class Evaluator {
  evaluate(question, answer) {
    if (!answer || answer.trim().length === 0) {
      return new EvaluationResult({
        score: 0, complete: false, clear: false,
        engaged: false, topic: question.topic,
        feedback: 'No answer provided',
      });
    }

    const answerLower = answer.toLowerCase();
    const keywords = question.keywords || [];
    const matched = keywords.filter(k => answerLower.includes(k.toLowerCase()));
    const score = keywords.length > 0
      ? Math.round((matched.length / keywords.length) * 100) / 100
      : 0.5;

    return new EvaluationResult({
      score,
      complete: score >= 0.6,
      clear:    answer.trim().length > 20,
      engaged:  answer.trim().length > 10,
      topic:    question.topic,
      feedback: score >= 0.8 ? 'Excellent answer' :
                score >= 0.6 ? 'Good answer' :
                score >= 0.4 ? 'Partial answer' : 'Needs improvement',
    });
  }
}

module.exports = { Evaluator, EvaluationResult };