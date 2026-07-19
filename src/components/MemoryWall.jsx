import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './MemoryWall.css';

const MOCK_COLORS = ['#ffd6e7', '#d4e8d4', '#d4d4e8', '#e8e4d4', '#e8d4d4', '#d4e4e8'];
const MOCK_EMOJIS = ['🌸', '💕', '🌟', '🌹', '🎀', '💫'];

// Compress image to a max dimension and quality before storing as Base64
function compressImage(dataUrl, maxWidth, quality) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = dataUrl;
  });
}

const MOCK_ITEMS = Array.from({ length: 6 }, (_, i) => ({
  id: `mock-${i}`,
  mock: true,
  color: MOCK_COLORS[i],
  emoji: MOCK_EMOJIS[i],
  caption: ['First Coffee ☕', 'Golden Hour 🌅', 'Movie Night 🎬', 'Our Playlist 🎵', 'Stargazing 🌌', 'Boba Run 🧋'][i],
  date: 'Soon™',
  tilt: `${(i % 2 === 0 ? 1 : -1) * (i + 1) * 0.8}deg`,
}));

export default function MemoryWall() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    supabase
      .from('memories')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data }) => { setMemories(data || []); setLoading(false); });
  }, []);

  const processFiles = (files) => {
    Array.from(files).slice(0, 10).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
        // Compress image to max 800px wide and 0.7 quality to stay under Supabase row limits
        const compressed = await compressImage(e.target.result, 800, 0.7);
        const newMemory = {
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          src: compressed,
          caption: '',
          date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          tilt: `${(Math.random() * 6 - 3).toFixed(1)}deg`,
        };
        const { data, error } = await supabase.from('memories').insert(newMemory).select().single();
        if (error) { console.error('Upload failed:', error.message); return; }
        setMemories(prev => [...prev, data]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const updateCaption = async (id, caption) => {
    setMemories(prev => prev.map(m => m.id === id ? { ...m, caption } : m));
    await supabase.from('memories').update({ caption }).eq('id', id);
  };

  const deleteMemory = async (id) => {
    await supabase.from('memories').delete().eq('id', id);
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  const displayItems = memories.length > 0 ? memories : (loading ? [] : MOCK_ITEMS);

  return (
    <div className="memory-wall">
      <h2>Memory Wall 📸</h2>
      <p className="subtitle">Upload your favourite moments together. Saved to the cloud forever.</p>

      <div
        className={`upload-area ${dragging ? 'drag-over' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload photos"
        onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" multiple accept="image/*" onChange={e => processFiles(e.target.files)} aria-hidden="true" />
        <span className="upload-icon">📷</span>
        <p className="upload-label">Drag & drop photos here, or <strong>browse files</strong></p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>Synced to Supabase — accessible from any device</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>⏳ Loading memories...</div>
      ) : (
        <div className="polaroid-grid">
          {displayItems.map(m => (
            <div key={m.id} style={{ '--tilt': m.tilt }}>
              <div className="polaroid">
                {!m.mock && (
                  <button className="polaroid-delete" onClick={() => deleteMemory(m.id)} aria-label="Delete photo">✕</button>
                )}
                {m.mock ? (
                  <div className="polaroid-placeholder" style={{ background: m.color }}>
                    <span style={{ fontSize: '2.5rem' }}>{m.emoji}</span>
                  </div>
                ) : (
                  <img src={m.src} alt={m.caption || 'Memory'} />
                )}
                <div className="polaroid-caption">{m.caption}</div>
                <div className="polaroid-date">{m.date}</div>
              </div>
              {!m.mock && (
                <div className="caption-editor">
                  <input
                    className="caption-input"
                    value={m.caption}
                    onChange={e => updateCaption(m.id, e.target.value)}
                    placeholder="Add a caption..."
                    maxLength={40}
                    aria-label="Photo caption"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
