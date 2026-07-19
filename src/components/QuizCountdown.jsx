import { useState, useEffect } from 'react';
import './QuizCountdown.css';

const COUNTDOWN_KEY = 'date-target';

const QUESTIONS = [
  {
    q: 'Ideal first date food?',
    options: ['Sushi 🍣', 'Boba & Snacks 🧋', 'Fine Dining 🍽️', 'Street Food 🌮'],
    answer: 1,
  },
  {
    q: 'Favourite movie genre for a date night?',
    options: ['Romantic Comedy 💕', 'Thriller 😱', 'Fantasy/Adventure 🧙', 'Animated 🎠'],
    answer: 0,
  },
  {
    q: 'Dream date location?',
    options: ['Cosy café ☕', 'Under the stars 🌌', 'Beach at sunset 🌅', 'Fancy rooftop 🏙️'],
    answer: 1,
  },
  {
    q: 'Perfect date playlist vibe?',
    options: ['Indie folk 🎸', 'Lo-fi chill 🎧', 'Pop hits 🎤', 'Jazz & soul 🎷'],
    answer: 1,
  },
  {
    q: 'End the night with?',
    options: ['Dessert run 🍦', 'Late night walk 🌙', 'More movies at home 🎬', 'Stargazing 🔭'],
    answer: 3,
  },
];

function getResultTier(score) {
  if (score === 5) return { emoji: '💎', title: 'Perfect Match!', msg: 'You know me like a book. This is going to be the best date ever.', cert: true };
  if (score >= 3) return { emoji: '💕', title: 'Pretty Close!', msg: 'You get the vibe. A few surprises await, but that\'s the fun part.', cert: false };
  if (score >= 1) return { emoji: '😄', title: 'Room to Discover!', msg: 'Looks like we have a lot to learn about each other — even more reason to go on that date!', cert: false };
  return { emoji: '🤔', title: 'Let\'s Start Fresh!', msg: 'Zero matches? Good thing we\'re going on a date so you can find out everything.', cert: false };
}

function useCountdown(target) {
  const [diff, setDiff] = useState(null);

  useEffect(() => {
    if (!target) { setDiff(null); return; }
    const calc = () => {
      const ms = new Date(target).getTime() - Date.now();
      if (ms <= 0) { setDiff({ passed: true }); return; }
      const total = Math.floor(ms / 1000);
      setDiff({
        days: Math.floor(total / 86400),
        hours: Math.floor((total % 86400) / 3600),
        minutes: Math.floor((total % 3600) / 60),
        seconds: total % 60,
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [target]);

  return diff;
}

export default function QuizCountdown() {
  const [target, setTarget] = useState(() => localStorage.getItem(COUNTDOWN_KEY) || '');
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const diff = useCountdown(target);

  const handleTargetChange = (e) => {
    setTarget(e.target.value);
    localStorage.setItem(COUNTDOWN_KEY, e.target.value);
  };

  const handleAnswer = (qIdx, optIdx) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleSubmitQuiz = () => {
    if (Object.keys(answers).length < QUESTIONS.length) return;
    setSubmitted(true);
  };

  const score = QUESTIONS.reduce((acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0), 0);
  const result = submitted ? getResultTier(score) : null;

  return (
    <div className="quiz-countdown">
      <h2>Quiz & Countdown 🎯</h2>
      <p className="subtitle">How well do you know your date? And how long until the big day?</p>

      {/* Countdown */}
      <div className="countdown-section">
        <h3>⏰ Countdown to Our Date</h3>
        <div className="date-input-row">
          <input
            type="datetime-local"
            value={target}
            onChange={handleTargetChange}
            aria-label="Set date and time"
          />
        </div>

        {diff && !diff.passed && (
          <div className="countdown-display" aria-live="polite">
            {[['days', 'Days'], ['hours', 'Hrs'], ['minutes', 'Mins'], ['seconds', 'Secs']].map(([k, l]) => (
              <div key={k} className="count-unit">
                <span className="count-number">{String(diff[k]).padStart(2, '0')}</span>
                <span className="count-label">{l}</span>
              </div>
            ))}
          </div>
        )}

        {diff?.passed && <p className="date-passed">🎉 The date has arrived (or passed)! Hope it was magical. ✨</p>}
        {!target && <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Set a date above to start the countdown.</p>}
      </div>

      {/* Quiz */}
      <div className="quiz-section">
        <h3>💕 How Well Do You Know Me?</h3>
        <p className="quiz-desc">5 questions. No cheating. Let's see how you do.</p>

        {!submitted ? (
          <>
            {QUESTIONS.map((q, qi) => (
              <div key={qi} className="question-card">
                <span className="q-number">Question {qi + 1} of {QUESTIONS.length}</span>
                <p className="question-text">{q.q}</p>
                <div className="options">
                  {q.options.map((opt, oi) => (
                    <button
                      key={oi}
                      className={`option-btn ${answers[qi] === oi ? 'correct' : ''}`}
                      onClick={() => handleAnswer(qi, oi)}
                      aria-pressed={answers[qi] === oi}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button
              className="btn-primary"
              onClick={handleSubmitQuiz}
              disabled={Object.keys(answers).length < QUESTIONS.length}
            >
              Submit Answers ✨
            </button>
            {Object.keys(answers).length < QUESTIONS.length && (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>
                Answer all {QUESTIONS.length} questions to submit.
              </p>
            )}
          </>
        ) : (
          <div className="quiz-results">
            {/* Re-show answers with correct highlights */}
            {QUESTIONS.map((q, qi) => (
              <div key={qi} className="question-card" style={{ textAlign: 'left' }}>
                <span className="q-number">Question {qi + 1}</span>
                <p className="question-text">{q.q}</p>
                <div className="options">
                  {q.options.map((opt, oi) => {
                    let cls = 'option-btn';
                    if (oi === q.answer) cls += ' correct';
                    else if (answers[qi] === oi) cls += ' wrong';
                    return <button key={oi} className={cls} disabled>{opt}</button>;
                  })}
                </div>
              </div>
            ))}

            <div className="score-circle">
              <span className="score-number">{score}</span>
              <span className="score-total">/ {QUESTIONS.length}</span>
            </div>

            <p className="result-title">{result.emoji} {result.title}</p>
            <p className="result-message">{result.msg}</p>

            {result.cert && (
              <div className="certificate">
                <p className="certificate-title">💌 Certificate of Perfect Match</p>
                <p className="certificate-text">
                  This certifies that you scored a perfect 5/5 and are hereby declared an Official Date Expert. 
                  The date is going to be absolutely wonderful. 🌹
                </p>
              </div>
            )}

            <button className="btn-ghost" style={{ marginTop: 16 }} onClick={() => { setAnswers({}); setSubmitted(false); }}>
              Retake Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
