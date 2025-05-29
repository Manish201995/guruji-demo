"use client"

import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect } from "react"

interface YouTubePlayerProps {
  videoId: string
}

export interface YouTubePlayerHandle {
  pauseVideo: () => void;
}

const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(({ videoId }, ref) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const playerRef = useRef<any>(null)

  useImperativeHandle(ref, () => ({
    pauseVideo: () => {
      if (playerRef.current) {
        playerRef.current.pauseVideo();
      }
    }
  }))

  useEffect(() => {
    // Load YouTube IFrame API if not already loaded
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    } else {
      createPlayer();
    }
    (window as any).onYouTubeIframeAPIReady = createPlayer;
    // eslint-disable-next-line
  }, [videoId]);

  function createPlayer() {
    if (iframeRef.current && !(playerRef.current)) {
      playerRef.current = new (window as any).YT.Player(iframeRef.current, {
        events: {
          onReady: () => setIsLoaded(true)
        }
      });
    }
  }

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-slate-200 dark:bg-slate-800">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}
        <div style={{ width: '100%', height: '100%' }}>
          <div id={`youtube-player-${videoId}`}></div>
          <iframe
            ref={iframeRef}
            id={`youtube-player-iframe-${videoId}`}
            src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=0&rel=0&modestbranding=1`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
            style={{ pointerEvents: 'auto' }}
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
})

YouTubePlayer.displayName = "YouTubePlayer"

export default YouTubePlayer
