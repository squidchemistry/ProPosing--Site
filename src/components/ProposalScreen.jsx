import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import './ProposalScreen.css';

const PARTICLES = ['💕', '✨', '🌸', '💫', '🌹', '💖', '⭐', '🦋'];
const NO_PROMPTS = [
  'No thanks',
  'Are you sure? 😢',
  'What if I buy you boba? 🧋',
  'Think of the food! 🍜',
  'Pretty please? 🥺',
  'Click Yes already! 💕',
];

function generateParticles(count = 20) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    emoji: PARTICLES[i % PARTICLES.length],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 8}s`,
    duration: `${6 + Math.random() * 8}s`,
    size: `${0.8 + Math.random() * 1.2}rem`,
  }));
}

export default function ProposalScreen({ onAccept }) {
  const [noIndex, setNoIndex] = useState(0);
  const [yesScale, setYesScale] = useState(1);
  const [noPos, setNoPos] = useState({ x: 0, y: 0 });
  const [particles] = useState(() => generateParticles(25));
  const containerRef = useRef(null);

  const handleNoHover = useCallback(() => {
    setNoIndex(i => Math.min(i + 1, NO_PROMPTS.length - 1));
    setYesScale(s => Math.min(s + 0.12, 1.8));

    const pad = 120;
    const maxX = (containerRef.current?.offsetWidth || 400) - pad;
    const maxY = (containerRef.current?.offsetHeight || 300) - pad;
    setNoPos({
      x: Math.random() * maxX * (Math.random() > 0.5 ? 1 : -1) * 0.5,
      y: Math.random() * maxY * (Math.random() > 0.5 ? 1 : -1) * 0.5,
    });
  }, []);

  const handleYes = useCallback(() => {
    confetti({
      particleCount: 180,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#b76e79', '#e8a0b0', '#d4b8e0', '#fff8f0', '#ffd6e7'],
    });
    setTimeout(() => {
      confetti({ particleCount: 80, angle: 60, spread: 80, origin: { x: 0 }, colors: ['#b76e79', '#e8a0b0'] });
      confetti({ particleCount: 80, angle: 120, spread: 80, origin: { x: 1 }, colors: ['#d4b8e0', '#9b72b8'] });
    }, 300);
    setTimeout(onAccept, 1200);
  }, [onAccept]);

  return (
    <div className="proposal-screen">
      {/* Floating particles */}
      <div className="particles">
        {particles.map(p => (
          <span
            key={p.id}
            className="particle"
            style={{
              left: p.left,
              bottom: '-5%',
              fontSize: p.size,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          >
            {p.emoji}
          </span>
        ))}
      </div>

      <div className="proposal-card" ref={containerRef}>
        <span className="proposal-emoji">💌</span>
        <h1 className="proposal-title">Will you go out with me?</h1>
        <p className="proposal-subtitle">
          I promise good vibes, great food, and a playlist curated entirely for you.
        </p>

        <div className="proposal-buttons">
          <button
            className="btn-yes"
            style={{ transform: `scale(${yesScale})` }}
            onClick={handleYes}
            aria-label="Yes, I will go out with you"
          >
            Yes! 💕
          </button>
          <button
            className="btn-no"
            style={{ transform: `translate(${noPos.x}px, ${noPos.y}px)` }}
            onMouseEnter={handleNoHover}
            onFocus={handleNoHover}
            aria-label={NO_PROMPTS[noIndex]}
          >
            {NO_PROMPTS[noIndex]}
          </button>
        </div>
      </div>
    </div>
  );
}
