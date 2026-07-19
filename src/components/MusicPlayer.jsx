import { useState, useEffect, useRef, useCallback } from 'react';
import './MusicPlayer.css';

// ─── Playlist: replace videoId with any YouTube video IDs you want ───────────
const PLAYLIST = [
  { title: 'Bloom',                artist: 'The Paper Kites',  videoId: 'AP-MniXNqJI' },
  { title: 'Electric Love',        artist: 'BØRNS',            videoId: 'lzDUfKd7v_U' },
  { title: 'Golden Hour',          artist: 'JVKE',             videoId: 'PEM0Vs8jf1w' },
  { title: 'Can I Call You Tonight?', artist: 'Dayglow',       videoId: 'r5mKVMNb2ks' },
  { title: 'Enchanted',            artist: 'Taylor Swift',     videoId: 'TpHCCwMtWFo' },
  { title: 'As It Was',            artist: 'Harry Styles',     videoId: 'H5v3kku4y6Q' },
];

// Load the YouTube IFrame API script once
function loadYTScript() {
  if (window.YT || document.getElementById('yt-iframe-api')) return;
  const tag = document.createElement('script');
  tag.id = 'yt-iframe-api';
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
}

export default function MusicPlayer() {
  const [trackIdx, setTrackIdx] = useState(0);
  const [playerState, setPlayerState] = useState('unstarted'); // unstarted | playing | paused | buffering
  const [volume, setVolume] = useState(70);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const playerRef = useRef(null);
  const iframeContainerId = 'yt-player-container';
  const tickRef = useRef(null);

  // Init YT API + player
  useEffect(() => {
    loadYTScript();

    const initPlayer = () => {
      playerRef.current = new window.YT.Player(iframeContainerId, {
        height: '0',
        width: '0',
        videoId: PLAYLIST[trackIdx].videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (e) => {
            e.target.setVolume(volume);
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
              goNext();
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      clearInterval(tickRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Tick progress every second while playing
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

  const goNext = useCallback(() => {
    setTrackIdx(i => {
      const next = (i + 1) % PLAYLIST.length;
      playerRef.current?.loadVideoById(PLAYLIST[next].videoId);
      setProgress(0);
      return next;
    });
  }, []);

  const goPrev = useCallback(() => {
    setTrackIdx(i => {
      const prev = (i - 1 + PLAYLIST.length) % PLAYLIST.length;
      playerRef.current?.loadVideoById(PLAYLIST[prev].videoId);
      setProgress(0);
      return prev;
    });
  }, []);

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (playerState === 'playing') {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleVolumeChange = (e) => {
    const v = Number(e.target.value);
    setVolume(v);
    playerRef.current?.setVolume(v);
  };

  const handleProgressClick = (e) => {
    if (!playerRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const seek = Math.round(ratio * duration);
    playerRef.current.seekTo(seek, true);
    setProgress(seek);
  };

  const handleTrackSelect = (idx) => {
    setTrackIdx(idx);
    setProgress(0);
    playerRef.current?.loadVideoById(PLAYLIST[idx].videoId);
  };

  const track = PLAYLIST[trackIdx];
  const isPlaying = playerState === 'playing';
  const progressPct = duration ? (progress / duration) * 100 : 0;

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  };

  return (
    <div className="music-player" role="region" aria-label="Music Player">
      {/* Hidden YT iframe mount point */}
      <div id={iframeContainerId} style={{ display: 'none' }} aria-hidden="true" />

      {/* Track info */}
      <div className="music-track-info">
        <div className="track-name">
          <span className="yt-badge">▶ YT</span> {track.title}
        </div>
        <div className="track-artist">{track.artist}</div>
      </div>

      {/* Controls */}
      <div className="music-controls">
        <button className="ctrl-btn" onClick={goPrev} aria-label="Previous track">⏮</button>
        <button
          className="ctrl-btn play-btn"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {playerState === 'buffering' ? '⏳' : isPlaying ? '⏸' : '▶'}
        </button>
        <button className="ctrl-btn" onClick={goNext} aria-label="Next track">⏭</button>
      </div>

      {/* Progress */}
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
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <span className="time-label">{duration ? fmt(duration) : '--:--'}</span>
      </div>

      {/* Volume */}
      <div className="volume-wrap">
        <span style={{ fontSize: '0.9rem' }}>
          {volume === 0 ? '🔇' : volume < 40 ? '🔉' : '🔊'}
        </span>
        <input
          type="range"
          className="volume-slider"
          min={0}
          max={100}
          value={volume}
          onChange={handleVolumeChange}
          aria-label="Volume"
        />
      </div>

      {/* Playlist toggle */}
      <button
        className="ctrl-btn"
        onClick={() => setExpanded(e => !e)}
        aria-label="Toggle playlist"
        aria-expanded={expanded}
      >
        🎵
      </button>

      {/* Expanded playlist */}
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
