const { Evaluator } = require('../core/evaluator');

const evaluator = new Evaluator();

const mockQuestion = {
  id: 'arr_2',
  topic: 'arrays',
  difficulty: 2,
  question: 'How would you find duplicates in an array in O(n) time?',
  follow_up: 'What data structure would you use and why?',
  keywords: ['hashmap', 'hashset', 'O(n)', 'space tradeoff']
};

test('returns score 0 for empty answer', () => {
  const result = evaluator.evaluate(mockQuestion, '   ');
  expect(result.score).toBe(0);
  expect(result.feedback).toBe('No answer provided');
});

test('returns excellent score for answer with all keywords', () => {
  const result = evaluator.evaluate(mockQuestion, 'Use a hashmap or hashset to find duplicates in O(n) time with space tradeoff');
  expect(result.score).toBe(1);
  expect(result.feedback).toBe('Excellent answer');
});

test('returns partial score for answer with some keywords', () => {
  const result = evaluator.evaluate(mockQuestion, 'Use a hashmap to check duplicates');
  expect(result.score).toBeGreaterThan(0);
  expect(result.score).toBeLessThan(1);
});

test('returns complete true when score is above 0.6', () => {
  const result = evaluator.evaluate(mockQuestion, 'Use a hashmap or hashset to find duplicates in O(n) time with space tradeoff');
  expect(result.complete).toBe(true);
});

test('returns engaged false for very short answer', () => {
  const result = evaluator.evaluate(mockQuestion, 'hashmap');
  expect(result.engaged).toBe(false);
});