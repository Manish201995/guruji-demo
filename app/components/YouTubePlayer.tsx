"use client"

import { useEffect, useRef, useState } from "react"

// Define YouTube Player API types
declare global {
  interface Window {
    YT: {
      Player: any;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
        BUFFERING: number;
      };
      loaded: number;
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
  videoId: string;
  onProgressChange?: (currentTime: number, duration: number) => void;
}

export default function YouTubePlayer({ 
  videoId, 
  onProgressChange 
}: YouTubePlayerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load YouTube API
  useEffect(() => {
    // Only load the script once
    if (!document.getElementById('youtube-api')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // Initialize player when API is ready
    const initPlayer = () => {
      if (window.YT && window.YT.Player && playerContainerRef.current) {
        playerInstanceRef.current = new window.YT.Player(playerRef.current, {
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            rel: 0,
            modestbranding: 1,
            showinfo: 0,
          },
          events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
          },
        });
      }
    };

    // Handle API ready callback
    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      // Clean up
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy();
      }
    };
  }, [videoId]);

  // Player event handlers
  const onPlayerReady = (event: any) => {
    setIsLoaded(true);
    setDuration(event.target.getDuration());
  };

  const onPlayerStateChange = (event: any) => {
    const playerState = event.data;

    if (playerState === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);

      // Start tracking progress
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      progressIntervalRef.current = setInterval(() => {
        if (playerInstanceRef.current) {
          const newTime = playerInstanceRef.current.getCurrentTime();
          setCurrentTime(newTime);

          if (onProgressChange) {
            onProgressChange(newTime, duration);
          }
        }
      }, 1000);
    } else {
      setIsPlaying(false);

      // Stop tracking progress
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }
  };

  // Player control functions
  const playVideo = () => {
    if (playerInstanceRef.current) {
      playerInstanceRef.current.playVideo();
    }
  };

  const pauseVideo = () => {
    if (playerInstanceRef.current) {
      playerInstanceRef.current.pauseVideo();
    }
  };

  const seekTo = (seconds: number) => {
    if (playerInstanceRef.current) {
      playerInstanceRef.current.seekTo(seconds, true);
      setCurrentTime(seconds);

      if (onProgressChange) {
        onProgressChange(seconds, duration);
      }
    }
  };

  // Handle slider change
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setSeekValue(value);
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  };

  const handleSeekEnd = () => {
    setIsSeeking(false);
    seekTo(seekValue);
  };

  // Format time (seconds to MM:SS)
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-slate-200 dark:bg-slate-800">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}
        <div ref={playerContainerRef} className="w-full h-full">
          <div ref={playerRef} id="youtube-player" className="w-full h-full"></div>
        </div>
      </div>

      {/* Player Controls */}
      <div className="mt-4 bg-slate-100 dark:bg-slate-700 p-3 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <button 
            onClick={isPlaying ? pauseVideo : playVideo}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <span className="text-slate-700 dark:text-slate-300">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full">
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={isSeeking ? seekValue : currentTime}
            onChange={handleSeekChange}
            onMouseDown={handleSeekStart}
            onMouseUp={handleSeekEnd}
            onTouchStart={handleSeekStart}
            onTouchEnd={handleSeekEnd}
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Video Info */}
      <div className="mt-4 px-2">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
          Learning Video: Advanced Concepts
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Watch this video to understand the key concepts, then ask Guruji any questions you have!
        </p>
      </div>
    </div>
  )
}
