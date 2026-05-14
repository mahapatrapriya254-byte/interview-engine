const { Evaluator } = require('../core/evaluator');
const InterviewSession = require('../core/interview_session');

test('session starts with a question', () => {
  const session = new InterviewSession();
  const result = session.start();
  expect(result.sessionId).toBeDefined();
  expect(result.question).toBeDefined();
  expect(result.topic).toBeDefined();
  expect(result.difficulty).toBeDefined();
});

test('answer returns CONTINUE status', () => {
  const session = new InterviewSession();
  session.start();
  const result = session.answer('Use a hashmap to find duplicates in O(n) time');
  expect(result.status).toBe('CONTINUE');
  expect(result.question).toBeDefined();
});

test('session ends after max questions', () => {
  const session = new InterviewSession();
  session.start();
  let result;
  for (let i = 0; i < 10; i++) {
    result = session.answer('hashmap O(n) space tradeoff hashset');
  }
  expect(result.status).toBe('END');
});