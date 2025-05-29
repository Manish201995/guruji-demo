"use client"

import { useState } from "react"

interface YouTubePlayerProps {
  videoId: string
}

export default function YouTubePlayer({ videoId }: YouTubePlayerProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-slate-200 dark:bg-slate-800">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
          onLoad={() => setIsLoaded(true)}
        />
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
