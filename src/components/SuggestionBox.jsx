import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './SuggestionBox.css';

const CATEGORIES = [
  { value: 'food',     label: '🍜 Food Preference' },
  { value: 'music',    label: '🎵 Song Request' },
  { value: 'activity', label: '🎉 Activity Idea' },
  { value: 'note',     label: '💌 Sweet Note' },
  { value: 'other',    label: '✨ Other' },
];

export default function SuggestionBox() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('note');
  const [text, setText] = useState('');
  const [mailOpen, setMailOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    supabase
      .from('suggestions')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setNotes(data || []); setLoading(false); });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setMailOpen(true);
    setTimeout(() => setMailOpen(false), 800);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);

    const newNote = {
      id: Date.now().toString(),
      category,
      text: text.trim(),
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    };
    const { data } = await supabase.from('suggestions').insert(newNote).select().single();
    setNotes(prev => [data, ...prev]);
    setText('');
  };

  const deleteNote = async (id) => {
    await supabase.from('suggestions').delete().eq('id', id);
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const catLabel = val => CATEGORIES.find(c => c.value === val)?.label || val;

  return (
    <div className="suggestion-box">
      <h2>Suggestion Box 💌</h2>
      <p className="subtitle">Drop a note — food picks, song requests, sweet thoughts, anything.</p>

      <div className="mailbox-wrap">
        <div className="mailbox" onClick={() => setMailOpen(o => !o)} role="presentation" aria-hidden="true">
          <div className="mailbox-body">
            <div className="mailbox-slot" />
            <div className="mailbox-label">NOTES</div>
          </div>
          <div className={`mailbox-flap ${mailOpen ? 'open' : ''}`}>
            <svg className="mailbox-flap-svg" viewBox="0 0 120 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0 L60 36 L120 0 L120 44 L0 44 Z" fill="url(#flap-grad)" />
              <defs>
                <linearGradient id="flap-grad" x1="0" y1="0" x2="120" y2="44" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#c87a8a" />
                  <stop offset="1" stopColor="#8a60a8" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        {submitted && (
          <p style={{ color: 'var(--rose-light)', fontSize: '0.9rem', marginTop: 12, animation: 'slideIn 0.3s ease' }}>
            💌 Note received!
          </p>
        )}
      </div>

      <form className="note-form" onSubmit={handleSubmit}>
        <h3>Write a Note</h3>
        <div className="category-select">
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 5 }}>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} aria-label="Note category">
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <textarea
          className="note-textarea"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type your message here..."
          rows={4}
          required
          aria-label="Note content"
        />
        <button type="submit" className="btn-primary">Send Note 💌</button>
      </form>

      {!loading && notes.length > 0 && (
        <div className="notes-list">
          <h3>Received Notes ({notes.length})</h3>
          {notes.map(n => (
            <div key={n.id} className="note-item">
              <div className="note-header">
                <span className="note-category">{catLabel(n.category)}</span>
                <span className="note-date">{n.date}</span>
              </div>
              <p className="note-text">{n.text}</p>
              <button className="note-delete" onClick={() => deleteNote(n.id)} aria-label="Delete note">✕</button>
              <div className="stamp">✉ delivered</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
