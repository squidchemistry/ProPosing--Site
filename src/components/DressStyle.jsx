import { useState } from 'react';
import './DressStyle.css';

const STYLES = [
  {
    id: 'casual',
    icon: '🧸',
    name: 'Casual Cozy',
    desc: 'Relaxed fits, soft fabrics, effortless charm.',
    palette: [
      { hex: '#e8c9a0', name: 'Warm Sand' },
      { hex: '#c8b89a', name: 'Dusty Taupe' },
      { hex: '#a0c4b8', name: 'Sage Mint' },
      { hex: '#f5e6d3', name: 'Cream' },
    ],
    his: ['Relaxed jeans', 'Soft knit sweater', 'White tee', 'Clean sneakers'],
    hers: ['Oversized cardigan', 'High-waist jeans', 'Floral top', 'Canvas shoes'],
    items: ['Reusable tote', 'Lip balm', 'Sunglasses', 'Baseball cap'],
  },
  {
    id: 'elegant',
    icon: '🥂',
    name: 'Elegant Dinner',
    desc: 'Polished, refined, with a touch of romance.',
    palette: [
      { hex: '#b76e79', name: 'Rose Gold' },
      { hex: '#2c2c3e', name: 'Midnight Navy' },
      { hex: '#c9a96e', name: 'Champagne' },
      { hex: '#1a1a2e', name: 'Deep Noir' },
    ],
    his: ['Tailored blazer', 'Fitted trousers', 'Dress shirt', 'Oxford shoes'],
    hers: ['Midi slip dress', 'Block heels', 'Delicate earrings', 'Clutch bag'],
    items: ['Perfume', 'Minimalist watch', 'Handkerchief', 'Breath mints'],
  },
  {
    id: 'adventure',
    icon: '🏕️',
    name: 'Adventure Ready',
    desc: 'Functional meets stylish for outdoor exploration.',
    palette: [
      { hex: '#6b8f71', name: 'Forest Green' },
      { hex: '#c4a35a', name: 'Golden Brown' },
      { hex: '#3d2b1f', name: 'Earth Brown' },
      { hex: '#87ceeb', name: 'Sky Blue' },
    ],
    his: ['Hiking boots', 'Cargo pants', 'Breathable tee', 'Lightweight jacket'],
    hers: ['Trail shoes', 'Leggings', 'Moisture-wicking top', 'Windbreaker'],
    items: ['Water bottle', 'Sunscreen', 'Portable speaker', 'Snack bag'],
  },
  {
    id: 'cafe',
    icon: '☕',
    name: 'Café Chic',
    desc: 'Urban aesthetic meets cosy afternoon energy.',
    palette: [
      { hex: '#c4956a', name: 'Latte Brown' },
      { hex: '#e8ddd0', name: 'Oat Milk' },
      { hex: '#8b7355', name: 'Espresso' },
      { hex: '#d4b8e0', name: 'Lavender Mist' },
    ],
    his: ['Chinos', 'Linen button-up', 'Loafers', 'Simple watch'],
    hers: ['Linen co-ord set', 'Strappy sandals', 'Shoulder bag', 'Dainty necklace'],
    items: ['Book / journal', 'Earphones', 'Polaroid camera', 'Lip gloss'],
  },
  {
    id: 'picnic',
    icon: '🌸',
    name: 'Picnic Dreamy',
    desc: 'Soft florals, breezy layers, golden hour glow.',
    palette: [
      { hex: '#f9a8c9', name: 'Blush Pink' },
      { hex: '#b5d5c5', name: 'Mint Green' },
      { hex: '#fef9c3', name: 'Butter Yellow' },
      { hex: '#c8b8e8', name: 'Soft Lilac' },
    ],
    his: ['Light linen shirt', 'Rolled-up chinos', 'Espadrilles', 'Woven hat'],
    hers: ['Floral sundress', 'Denim jacket', 'Straw tote', 'Strappy flats'],
    items: ['Picnic blanket', 'Sunglasses', 'Insect repellent', 'Reusable cutlery'],
  },
  {
    id: 'night',
    icon: '🌙',
    name: 'Night Out Glam',
    desc: 'Bold, confident, and a little bit dazzling.',
    palette: [
      { hex: '#9b72b8', name: 'Deep Violet' },
      { hex: '#1a1a2e', name: 'Midnight Black' },
      { hex: '#e0c080', name: 'Gold Shimmer' },
      { hex: '#e8a0b0', name: 'Dusty Rose' },
    ],
    his: ['Black slim-fit jeans', 'Satin shirt', 'Chelsea boots', 'Statement belt'],
    hers: ['Sequin mini skirt', 'Bodysuit', 'Strappy heels', 'Evening bag'],
    items: ['Mini perfume', 'Lip touch-up kit', 'Cards', 'Portable charger'],
  },
];

const ACTIVITY_MAP = {
  picnic: 'picnic',
  coffee: 'cafe',
  café: 'cafe',
  cafe: 'cafe',
  dinner: 'elegant',
  restaurant: 'elegant',
  hike: 'adventure',
  hiking: 'adventure',
  outdoors: 'adventure',
  stargazing: 'adventure',
  movie: 'casual',
  cozy: 'casual',
  shopping: 'cafe',
  night: 'night',
  club: 'night',
  bar: 'night',
};

function getSuggestion(query) {
  const lower = query.toLowerCase();
  for (const [kw, id] of Object.entries(ACTIVITY_MAP)) {
    if (lower.includes(kw)) return STYLES.find(s => s.id === id);
  }
  return null;
}

export default function DressStyle() {
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [suggestion, setSuggestion] = useState(null);

  const handleSearch = () => {
    if (!query.trim()) return;
    const result = getSuggestion(query);
    setSuggestion(result || { notFound: true });
  };

  const activeStyle = selected ? STYLES.find(s => s.id === selected) : null;

  return (
    <div className="dress-style">
      <h2>Style & Dress Guide 👗</h2>
      <p className="subtitle">Pick a vibe, see the palette, dress to impress.</p>

      <div className="style-cards">
        {STYLES.map(style => (
          <div
            key={style.id}
            className={`style-card ${selected === style.id ? 'selected' : ''}`}
            onClick={() => setSelected(selected === style.id ? null : style.id)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && setSelected(selected === style.id ? null : style.id)}
            aria-pressed={selected === style.id}
          >
            <span className="style-card-icon">{style.icon}</span>
            <h3>{style.name}</h3>
            <p>{style.desc}</p>
            <div className="palette">
              {style.palette.map(sw => (
                <div key={sw.hex} className="swatch" style={{ background: sw.hex }}>
                  <div className="swatch-tooltip">{sw.name} {sw.hex}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Selected style detail */}
      {activeStyle && (
        <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 24, marginBottom: 32 }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', color: 'var(--rose-light)', marginBottom: 20, fontSize: '1.2rem' }}>
            {activeStyle.icon} {activeStyle.name} — What to Wear
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
            <div>
              <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Him 👔</h4>
              {activeStyle.his.map(i => <div key={i} className="suggestion-tag">{i}</div>)}
            </div>
            <div>
              <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Her 👒</h4>
              {activeStyle.hers.map(i => <div key={i} className="suggestion-tag">{i}</div>)}
            </div>
            <div>
              <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Don't Forget 🎒</h4>
              {activeStyle.items.map(i => <div key={i} className="suggestion-tag">{i}</div>)}
            </div>
          </div>
        </div>
      )}

      {/* Suggestion engine */}
      <div className="suggestion-engine">
        <h3>✨ Outfit Suggestion Engine</h3>
        <div className="suggestion-input-row">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type an activity (e.g. picnic, dinner, hiking...)"
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button className="btn-primary" onClick={handleSearch}>Suggest</button>
        </div>

        {suggestion && (
          suggestion.notFound ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Hmm, I don't have a match for that. Try: picnic, dinner, coffee, hiking, night out...
            </p>
          ) : (
            <div className="suggestion-results">
              <div>
                <h4>Outfit Style</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: '1.5rem' }}>{suggestion.icon}</span>
                  <span style={{ fontWeight: 600, color: 'var(--rose-light)' }}>{suggestion.name}</span>
                </div>
                <div className="palette">
                  {suggestion.palette.map(sw => (
                    <div key={sw.hex} className="swatch" style={{ background: sw.hex, width: 30, height: 30 }}>
                      <div className="swatch-tooltip">{sw.name}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4>Bring Along</h4>
                {suggestion.items.map(i => <span key={i} className="suggestion-tag">{i}</span>)}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
