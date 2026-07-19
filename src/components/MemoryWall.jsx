import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './MemoryWall.css';

const BUCKET = 'memories';
const MOCK_COLORS = ['#ffd6e7', '#d4e8d4', '#d4d4e8', '#e8e4d4', '#e8d4d4', '#d4e4e8'];
const MOCK_EMOJIS = ['🌸', '💕', '🌟', '🌹', '🎀', '💫'];

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
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    supabase
      .from('memories')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setMemories(data || []);
        setLoading(false);
      });
  }, []);

  const processFiles = async (files) => {
    setUploading(true);
    setError(null);

    for (const file of Array.from(files).slice(0, 10)) {
      if (!file.type.startsWith('image/')) continue;

      // Upload file to Supabase Storage
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filename, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        setError(`Upload failed: ${uploadError.message}`);
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filename);

      // Save metadata to memories table
      const newMemory = {
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        src: urlData.publicUrl,
        caption: '',
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        tilt: `${(Math.random() * 6 - 3).toFixed(1)}deg`,
      };

      const { data, error: dbError } = await supabase
        .from('memories')
        .insert(newMemory)
        .select()
        .single();

      if (dbError) {
        setError(`Save failed: ${dbError.message}`);
        continue;
      }

      setMemories(prev => [...prev, data]);
    }

    setUploading(false);
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

  const deleteMemory = async (id, src) => {
    // Delete from storage if it's a Supabase URL
    if (src?.includes('supabase')) {
      const path = src.split(`/${BUCKET}/`)[1];
      if (path) await supabase.storage.from(BUCKET).remove([path]);
    }
    await supabase.from('memories').delete().eq('id', id);
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  const displayItems = memories.length > 0 ? memories : (loading ? [] : MOCK_ITEMS);

  return (
    <div className="memory-wall">
      <h2>Memory Wall 📸</h2>
      <p className="subtitle">Upload your favourite moments. Saved to the cloud forever.</p>

      {error && (
        <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 10, padding: '10px 16px', marginBottom: 16, color: '#ff8080', fontSize: '0.85rem' }}>
          ⚠️ {error}
        </div>
      )}

      <div
        className={`upload-area ${dragging ? 'drag-over' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload photos"
        onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" multiple accept="image/*" onChange={e => processFiles(e.target.files)} aria-hidden="true" />
        <span className="upload-icon">{uploading ? '⏳' : '📷'}</span>
        <p className="upload-label">
          {uploading ? 'Uploading...' : <>Drag & drop photos here, or <strong>browse files</strong></>}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
          Stored in Supabase Storage — accessible from any device
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>⏳ Loading memories...</div>
      ) : (
        <div className="polaroid-grid">
          {displayItems.map(m => (
            <div key={m.id} style={{ '--tilt': m.tilt }}>
              <div className="polaroid">
                {!m.mock && (
                  <button className="polaroid-delete" onClick={() => deleteMemory(m.id, m.src)} aria-label="Delete photo">✕</button>
                )}
                {m.mock ? (
                  <div className="polaroid-placeholder" style={{ background: m.color }}>
                    <span style={{ fontSize: '2.5rem' }}>{m.emoji}</span>
                  </div>
                ) : (
                  <img src={m.src} alt={m.caption || 'Memory'} loading="lazy" />
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
