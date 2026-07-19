import { useState, useEffect, useRef, useCallback } from 'react';
import './MusicPlayer.css';

const PLAYLIST = [
  { title: 'Bloom',                   artist: 'The Paper Kites', videoId: 'AP-MniXNqJI' },
  { title: 'Electric Love',           artist: 'BØRNS',           videoId: 'lzDUfKd7v_U' },
  { title: 'Golden Hour',             artist: 'JVKE',            videoId: 'PEM0Vs8jf1w' },
  { title: 'Can I Call You Tonight?', artist: 'Dayglow',         videoId: 'r5mKVMNb2ks' },
  { title: 'Enchanted',               artist: 'Taylor Swift',    videoId: 'TpHCCwMtWFo' },
  { title: 'As It Was',               artist: 'Harry Styles',    videoId: 'H5v3kku4y6Q' },
];

let ytScriptLoaded = false;
const ytReadyCallbacks = [];

function loadYTScript() {
  if (ytScriptLoaded) return;
  ytScriptLoaded = true;

  // Override the global callback to flush any waiting inits
  window.onYouTubeIframeAPIReady = () => {
    ytReadyCallbacks.forEach(cb => cb());
    ytReadyCallbacks.length = 0;
  };

  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
}

function onYTReady(cb) {
  if (window.YT?.Player) {
    cb();
  } else {
    ytReadyCallbacks.push(cb);
    loadYTScript();
  }
}

export default function MusicPlayer() {
  const [trackIdx, setTrackIdx] = useState(0);
  const [playerState, setPlayerState] = useState('unstarted');
  const [volume, setVolume] = useState(70);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [ytReady, setYtReady] = useState(false);
  const playerRef = useRef(null);
  const tickRef = useRef(null);
  const containerRef = useRef(null);
  const trackIdxRef = useRef(trackIdx);
  trackIdxRef.current = trackIdx;

  useEffect(() => {
    onYTReady(() => {
      if (!containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '1',
        width: '1',
        videoId: PLAYLIST[0].videoId,
        playerVars: { autoplay: 0, controls: 0, rel: 0, playsinline: 1 },
        events: {
          onReady: (e) => {
            e.target.setVolume(volume);
            setYtReady(true);
          },
          onStateChange: (e) => {
            const S = window.YT.PlayerState;
            if (e.data === S.PLAYING) {
              setPlayerState('playing');
              setDuration(Math.round(playerRef.current.getDuration()));
            } else if (e.data === S.PAUSED) {
              setPlayerState('paused');
            } else if (e.data === S.BUFFERING) {
              setPlayerState('buffering');
            } else if (e.data === S.ENDED) {
              const next = (trackIdxRef.current + 1) % PLAYLIST.length;
              setTrackIdx(next);
              playerRef.current?.loadVideoById(PLAYLIST[next].videoId);
              setProgress(0);
            }
          },
        },
      });
    });

    return () => {
      clearInterval(tickRef.current);
      playerRef.current?.destroy?.();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    clearInterval(tickRef.current);
    if (playerState === 'playing') {
      tickRef.current = setInterval(() => {
        if (playerRef.current?.getCurrentTime) {
          setProgress(Math.round(playerRef.current.getCurrentTime()));
        }
      }, 1000);
    }
    return () => clearInterval(tickRef.current);
  }, [playerState]);

  const togglePlay = () => {
    if (!playerRef.current || !ytReady) return;
    playerState === 'playing'
      ? playerRef.current.pauseVideo()
      : playerRef.current.playVideo();
  };

  const goPrev = useCallback(() => {
    const prev = (trackIdxRef.current - 1 + PLAYLIST.length) % PLAYLIST.length;
    setTrackIdx(prev);
    setProgress(0);
    playerRef.current?.loadVideoById(PLAYLIST[prev].videoId);
  }, []);

  const goNext = useCallback(() => {
    const next = (trackIdxRef.current + 1) % PLAYLIST.length;
    setTrackIdx(next);
    setProgress(0);
    playerRef.current?.loadVideoById(PLAYLIST[next].videoId);
  }, []);

  const handleTrackSelect = (idx) => {
    setTrackIdx(idx);
    setProgress(0);
    playerRef.current?.loadVideoById(PLAYLIST[idx].videoId);
  };

  const handleVolumeChange = (e) => {
    const v = Number(e.target.value);
    setVolume(v);
    playerRef.current?.setVolume(v);
  };

  const handleProgressClick = (e) => {
    if (!playerRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const seek = Math.round(((e.clientX - rect.left) / rect.width) * duration);
    playerRef.current.seekTo(seek, true);
    setProgress(seek);
  };

  const track = PLAYLIST[trackIdx];
  const isPlaying = playerState === 'playing';
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="music-player" role="region" aria-label="Music Player">
      {/* YT mounts here — must be a real visible element (even 1x1px) */}
      <div
        ref={containerRef}
        style={{ width: 1, height: 1, overflow: 'hidden', flexShrink: 0 }}
        aria-hidden="true"
      />

      <div className="music-track-info">
        <div className="track-name">
          <span className="yt-badge">▶ YT</span> {track.title}
        </div>
        <div className="track-artist">
          {!ytReady ? 'Loading player...' : track.artist}
        </div>
      </div>

      <div className="music-controls">
        <button className="ctrl-btn" onClick={goPrev} aria-label="Previous">⏮</button>
        <button className="ctrl-btn play-btn" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'} disabled={!ytReady}>
          {!ytReady ? '⏳' : playerState === 'buffering' ? '⏳' : isPlaying ? '⏸' : '▶'}
        </button>
        <button className="ctrl-btn" onClick={goNext} aria-label="Next">⏭</button>
      </div>

      <div className="progress-bar-wrap">
        <span className="time-label">{fmt(progress)}</span>
        <div className="progress-bar" onClick={handleProgressClick} role="slider" aria-valuemin={0} aria-valuemax={duration} aria-valuenow={progress} aria-label="Track progress">
          <div className="progress-fill" style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }} />
        </div>
        <span className="time-label">{duration ? fmt(duration) : '--:--'}</span>
      </div>

      <div className="volume-wrap">
        <span style={{ fontSize: '0.9rem' }}>{volume === 0 ? '🔇' : volume < 40 ? '🔉' : '🔊'}</span>
        <input type="range" className="volume-slider" min={0} max={100} value={volume} onChange={handleVolumeChange} aria-label="Volume" />
      </div>

      <button className="ctrl-btn" onClick={() => setExpanded(e => !e)} aria-label="Toggle playlist" aria-expanded={expanded}>🎵</button>

      {expanded && (
        <div className="playlist-dropdown" role="listbox" aria-label="Playlist">
          {PLAYLIST.map((t, i) => (
            <button
              key={t.videoId}
              className={`playlist-item ${i === trackIdx ? 'active' : ''}`}
              onClick={() => handleTrackSelect(i)}
              role="option"
              aria-selected={i === trackIdx}
            >
              <span>{i === trackIdx && isPlaying ? '▶ ' : ''}{t.title}</span>
              <span className="playlist-artist">{t.artist}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
