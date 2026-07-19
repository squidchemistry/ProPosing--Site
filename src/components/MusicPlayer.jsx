import { useState, useEffect, useRef, useCallback } from 'react';
import './MusicPlayer.css';

// These are official audio/lyric videos confirmed to allow embedding
const PLAYLIST = [
  { title: 'Bloom',                   artist: 'The Paper Kites', videoId: 'AP-MniXNqJI' },
  { title: 'Electric Love',           artist: 'BØRNS',           videoId: 'lzDUfKd7v_U' },
  { title: 'Golden Hour',             artist: 'JVKE',            videoId: 'PEM0Vs8jf1w' },
  { title: 'Can I Call You Tonight?', artist: 'Dayglow',         videoId: 'r5mKVMNb2ks' },
  { title: 'Enchanted',               artist: 'Taylor Swift',    videoId: 'TpHCCwMtWFo' },
  { title: 'As It Was',               artist: 'Harry Styles',    videoId: 'H5v3kku4y6Q' },
];

export default function MusicPlayer() {
  const [trackIdx, setTrackIdx] = useState(0);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [volume, setVolume] = useState(70);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [embedError, setEmbedError] = useState(false);

  const playerRef = useRef(null);
  const tickRef = useRef(null);
  const idxRef = useRef(trackIdx);
  idxRef.current = trackIdx;

  useEffect(() => {
    // Inject YT script if not already present
    if (!document.getElementById('yt-api')) {
      const s = document.createElement('script');
      s.id = 'yt-api';
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }

    const init = () => {
      playerRef.current = new window.YT.Player('yt-iframe', {
        events: {
          onReady: (e) => {
            e.target.setVolume(volume);
            setReady(true);
          },
          onStateChange: (e) => {
            const S = window.YT.PlayerState;
            if (e.data === S.PLAYING) {
              setPlaying(true);
              setBuffering(false);
              setEmbedError(false);
              setDuration(Math.round(e.target.getDuration()));
            } else if (e.data === S.PAUSED) {
              setPlaying(false);
              setBuffering(false);
            } else if (e.data === S.BUFFERING) {
              setBuffering(true);
            } else if (e.data === S.ENDED) {
              advance(1);
            } else if (e.data === S.UNSTARTED || e.data === -1) {
              setBuffering(false);
            }
          },
          onError: () => {
            // Video can't be embedded — skip to next
            setEmbedError(true);
            setBuffering(false);
            setPlaying(false);
          },
        },
      });
    };

    if (window.YT?.Player) {
      init();
    } else {
      window.onYouTubeIframeAPIReady = init;
    }

    return () => clearInterval(tickRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Progress ticker
  useEffect(() => {
    clearInterval(tickRef.current);
    if (playing) {
      tickRef.current = setInterval(() => {
        const t = playerRef.current?.getCurrentTime?.();
        if (t != null) setProgress(Math.round(t));
      }, 1000);
    }
    return () => clearInterval(tickRef.current);
  }, [playing]);

  const advance = useCallback((dir) => {
    const next = (idxRef.current + dir + PLAYLIST.length) % PLAYLIST.length;
    idxRef.current = next;
    setTrackIdx(next);
    setProgress(0);
    setDuration(0);
    setEmbedError(false);
    playerRef.current?.loadVideoById(PLAYLIST[next].videoId);
  }, []);

  const togglePlay = () => {
    if (!ready || !playerRef.current) return;
    playing ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
  };

  const handleVolumeChange = (e) => {
    const v = Number(e.target.value);
    setVolume(v);
    playerRef.current?.setVolume(v);
  };

  const handleProgressClick = (e) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const seek = Math.round(((e.clientX - rect.left) / rect.width) * duration);
    playerRef.current?.seekTo(seek, true);
    setProgress(seek);
  };

  const selectTrack = (i) => {
    setTrackIdx(i);
    setProgress(0);
    setDuration(0);
    setEmbedError(false);
    playerRef.current?.loadVideoById(PLAYLIST[i].videoId);
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const track = PLAYLIST[trackIdx];
  const pct = duration ? (progress / duration) * 100 : 0;

  return (
    <div className="music-player" role="region" aria-label="Music Player">

      {/* The actual YT iframe — positioned off screen but fully rendered */}
      <iframe
        id="yt-iframe"
        src={`https://www.youtube.com/embed/${track.videoId}?enablejsapi=1&controls=0&rel=0&playsinline=1`}
        allow="autoplay; encrypted-media"
        allowFullScreen
        title="YouTube player"
        style={{
          position: 'fixed',
          bottom: 80,
          right: 0,
          width: 320,
          height: 180,
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />

      <div className="music-track-info">
        <div className="track-name">
          <span className="yt-badge">▶ YT</span> {track.title}
        </div>
        <div className="track-artist" style={{ color: embedError ? '#ff8080' : undefined }}>
          {!ready ? 'Loading...' : embedError ? 'Cannot embed — try next ▶' : track.artist}
        </div>
      </div>

      <div className="music-controls">
        <button className="ctrl-btn" onClick={() => advance(-1)} aria-label="Previous">⏮</button>
        <button
          className="ctrl-btn play-btn"
          onClick={togglePlay}
          disabled={!ready}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {buffering ? '⏳' : playing ? '⏸' : '▶'}
        </button>
        <button className="ctrl-btn" onClick={() => advance(1)} aria-label="Next">⏭</button>
      </div>

      <div className="progress-bar-wrap">
        <span className="time-label">{fmt(progress)}</span>
        <div
          className="progress-bar"
          onClick={handleProgressClick}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={progress}
          aria-label="Track progress"
        >
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="time-label">{duration ? fmt(duration) : '--:--'}</span>
      </div>

      <div className="volume-wrap">
        <span style={{ fontSize: '0.9rem' }}>{volume === 0 ? '🔇' : volume < 40 ? '🔉' : '🔊'}</span>
        <input
          type="range" className="volume-slider"
          min={0} max={100} value={volume}
          onChange={handleVolumeChange}
          aria-label="Volume"
        />
      </div>

      <button className="ctrl-btn" onClick={() => setExpanded(e => !e)} aria-label="Playlist" aria-expanded={expanded}>🎵</button>

      {expanded && (
        <div className="playlist-dropdown" role="listbox" aria-label="Playlist">
          {PLAYLIST.map((t, i) => (
            <button
              key={t.videoId}
              className={`playlist-item ${i === trackIdx ? 'active' : ''}`}
              onClick={() => selectTrack(i)}
              role="option"
              aria-selected={i === trackIdx}
            >
              <span>{i === trackIdx && playing ? '▶ ' : ''}{t.title}</span>
              <span className="playlist-artist">{t.artist}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
