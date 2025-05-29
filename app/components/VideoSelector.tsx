"use client";

import { useState, useEffect } from "react";
import { sampleVideos, VideoData } from "../data/sampleVideos";

interface VideoSelectorProps {
  selectedVideoId: string;
  onVideoSelect: (video: VideoData) => void;
}

const VideoSelector: React.FC<VideoSelectorProps> = ({
  selectedVideoId,
  onVideoSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | undefined>(
    sampleVideos.find((video) => video.id === selectedVideoId) || sampleVideos[0]
  );

  useEffect(() => {
    // Update selected video when selectedVideoId prop changes
    const video = sampleVideos.find((video) => video.id === selectedVideoId);
    if (video) {
      setSelectedVideo(video);
    }
  }, [selectedVideoId]);

  const handleVideoSelect = (video: VideoData) => {
    setSelectedVideo(video);
    setIsOpen(false);
    onVideoSelect(video);
  };

  return (
    <div className="relative w-full">
      <div className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        Select Video
      </div>
      
      {/* Dropdown button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200"
      >
        <span className="truncate">{selectedVideo?.title || "Select a video"}</span>
        <svg
          className={`w-5 h-5 ml-2 transition-transform duration-200 ${
            isOpen ? "transform rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      
      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
          {sampleVideos.map((video) => (
            <div
              key={video.id}
              onClick={() => handleVideoSelect(video)}
              className={`px-4 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 ${
                selectedVideo?.id === video.id
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  : ""
              }`}
            >
              <div className="font-medium">{video.title}</div>
              {video.description && (
                <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
                  {video.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoSelector;