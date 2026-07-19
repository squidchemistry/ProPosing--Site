import { useState } from 'react';
import { supabase } from '../lib/supabase';
import MusicPlayer from './MusicPlayer';
import Itinerary from './Itinerary';
import DressStyle from './DressStyle';
import MemoryWall from './MemoryWall';
import SuggestionBox from './SuggestionBox';
import QuizCountdown from './QuizCountdown';
import './Dashboard.css';

const TABS = [
  { id: 'itinerary', label: '📅 Itinerary' },
  { id: 'style', label: '👗 Style Guide' },
  { id: 'memories', label: '📸 Memories' },
  { id: 'suggestions', label: '💌 Suggestion Box' },
  { id: 'quiz', label: '🎯 Quiz & Countdown' },
];

export default function Dashboard({ onReset }) {
  const [activeTab, setActiveTab] = useState('itinerary');

  const handleReset = async () => {
    await supabase
      .from('proposal')
      .update({ accepted: false, updated_at: new Date().toISOString() })
      .eq('id', 'singleton');
    onReset();
  };

  return (
    <div className="dashboard">
      <nav className="dash-nav" aria-label="Main navigation">
        <span className="nav-logo">Our Date 💕</span>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`nav-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
            aria-current={activeTab === t.id ? 'page' : undefined}
          >
            {t.label}
          </button>
        ))}
        <button
          className="nav-tab reset-btn"
          onClick={handleReset}
          aria-label="Ask again"
          title="Reset proposal — ask again 💌"
          style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '1rem', padding: '20px 12px' }}
        >
          💌
        </button>
      </nav>

      <main className="dash-content">
        {activeTab === 'itinerary' && <Itinerary />}
        {activeTab === 'style' && <DressStyle />}
        {activeTab === 'memories' && <MemoryWall />}
        {activeTab === 'suggestions' && <SuggestionBox />}
        {activeTab === 'quiz' && <QuizCountdown />}
      </main>

      <MusicPlayer />
    </div>
  );
}
