import { useState, useEffect, useCallback } from 'react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '../lib/supabase';
import './Itinerary.css';

const PRESETS = [
  { emoji: '☕', title: 'Cozy Coffee',   location: 'Local Café',        description: 'Warm drinks and good conversation.' },
  { emoji: '🍽️', title: 'Fine Dining',  location: 'Favourite Restaurant', description: 'A candlelit dinner for two.' },
  { emoji: '🌅', title: 'Sunset Picnic', location: 'The Park',           description: 'Blanket, snacks, golden hour vibes.' },
  { emoji: '🌌', title: 'Stargazing',    location: 'Hilltop / Open Field', description: 'Find the constellations together.' },
  { emoji: '🎬', title: 'Movie Night',   location: 'Home / Cinema',      description: 'Cosy films and shared popcorn.' },
  { emoji: '🛍️', title: 'Shopping Trip', location: 'City Centre',        description: 'Browse shops, grab boba along the way.' },
];

const emptyForm = { emoji: '💕', title: '', date: '', time: '', location: '', description: '' };

function SortableCard({ item, onDelete, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div className="timeline-item" ref={setNodeRef} style={style}>
      <div className={`activity-card ${isDragging ? 'dragging' : ''}`} {...attributes} {...listeners}>
        <div className="activity-card-header">
          <div>
            <div className="activity-title">{item.emoji} {item.title}</div>
            <div className="activity-meta">
              {item.date && <span>📅 {item.date}</span>}
              {item.time && <span>🕐 {item.time}</span>}
              {item.location && <span>📍 {item.location}</span>}
            </div>
            {item.description && <p className="activity-desc">{item.description}</p>}
          </div>
          <div className="card-actions" onPointerDown={e => e.stopPropagation()}>
            <button className="icon-btn" onClick={() => onEdit(item)} aria-label="Edit">✏️</button>
            <button className="icon-btn delete" onClick={() => onDelete(item.id)} aria-label="Delete">🗑️</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Itinerary() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Load
  useEffect(() => {
    supabase
      .from('itinerary')
      .select('*')
      .order('position', { ascending: true })
      .then(({ data }) => {
        setItems(data || []);
        setLoading(false);
      });
  }, []);

  const handleDragEnd = useCallback(async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex(x => x.id === active.id);
    const newIdx = items.findIndex(x => x.id === over.id);
    const reordered = arrayMove(items, oldIdx, newIdx);
    setItems(reordered);
    // Persist new positions
    await Promise.all(
      reordered.map((item, i) =>
        supabase.from('itinerary').update({ position: i }).eq('id', item.id)
      )
    );
  }, [items]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (editId) {
      const { data } = await supabase
        .from('itinerary')
        .update({ ...form })
        .eq('id', editId)
        .select()
        .single();
      setItems(i => i.map(x => x.id === editId ? data : x));
      setEditId(null);
    } else {
      const newItem = { ...form, id: Date.now().toString(), position: items.length };
      const { data } = await supabase.from('itinerary').insert(newItem).select().single();
      setItems(i => [...i, data]);
    }
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleEdit = (item) => { setForm(item); setEditId(item.id); setShowForm(true); };

  const handleDelete = async (id) => {
    await supabase.from('itinerary').delete().eq('id', id);
    setItems(i => i.filter(x => x.id !== id));
  };

  const addPreset = async (preset) => {
    const newItem = { ...emptyForm, ...preset, id: Date.now().toString(), position: items.length };
    const { data } = await supabase.from('itinerary').insert(newItem).select().single();
    setItems(i => [...i, data]);
  };

  const f = field => e => setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="itinerary">
      <h2>Date Itinerary 📅</h2>
      <p className="subtitle">Plan every moment of your perfect day together.</p>

      <div className="quick-add">
        {PRESETS.map(p => (
          <button key={p.title} className="preset-btn" onClick={() => addPreset(p)}>
            {p.emoji} {p.title}
          </button>
        ))}
        <button
          className="preset-btn"
          style={{ borderColor: 'var(--rose-light)', color: 'var(--rose-light)' }}
          onClick={() => { setShowForm(s => !s); setEditId(null); setForm(emptyForm); }}
        >
          + Custom
        </button>
      </div>

      {showForm && (
        <form className="add-form" onSubmit={handleSubmit}>
          <h3>{editId ? 'Edit Activity' : 'Add Activity'}</h3>
          <div className="form-row three">
            <div className="form-group">
              <label>Emoji</label>
              <input value={form.emoji} onChange={f('emoji')} maxLength={4} />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Activity Title *</label>
              <input value={form.title} onChange={f('title')} placeholder="e.g. Sunset Walk" required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={form.date} onChange={f('date')} />
            </div>
            <div className="form-group">
              <label>Time</label>
              <input type="time" value={form.time} onChange={f('time')} />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label>Location</label>
            <input value={form.location} onChange={f('location')} placeholder="e.g. Central Park" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={f('description')} placeholder="What are you planning?" rows={2} />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">{editId ? 'Save Changes' : 'Add to Itinerary'}</button>
            <button type="button" className="btn-ghost" onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="empty-state"><span className="empty-icon">⏳</span><p>Loading...</p></div>
      ) : items.length === 0 ? (
        <div className="empty-state"><span className="empty-icon">📅</span><p>No activities yet. Add a preset or create a custom one above!</p></div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="timeline">
              {items.map(item => (
                <SortableCard key={item.id} item={item} onDelete={handleDelete} onEdit={handleEdit} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
