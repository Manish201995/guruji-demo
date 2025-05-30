"use client";

import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
    useCallback,
} from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import VideoSelector from "./VideoSelector";
import {sampleVideos, VideoData} from "../data/sampleVideos";

interface YouTubePlayerProps {
    videoId: string;
    onProgressChange?: (currentTime: number, duration: number) => void;
    showAskButton?: boolean;
    onAsk?: () => void;
    onVideoChange?: (video: VideoData) => void;
}

export type YouTubePlayerRef = {
    playVideo: () => void;
    pauseVideo: () => void;
};

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

const YouTubePlayer = forwardRef<YouTubePlayerRef, YouTubePlayerProps>(
    ({videoId, onProgressChange, showAskButton = true, onAsk, onVideoChange}, ref) => {
        const [isLoaded, setIsLoaded] = useState(false);
        const [currentVideoId, setCurrentVideoId] = useState(videoId);
        const [isPlaying, setIsPlaying] = useState(false);
        const [currentTime, setCurrentTime] = useState(0);
        const [duration, setDuration] = useState(0);
        const [isSeeking, setIsSeeking] = useState(false);
        const [showControls, setShowControls] = useState(false);
        const [hoverTime, setHoverTime] = useState<number | null>(null);
        const [hoverPosition, setHoverPosition] = useState(0);

        const playerRef = useRef<any>(null);
        const playerContainerRef = useRef<HTMLDivElement>(null);
        const playerInstanceRef = useRef<any>(null);
        const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
        const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
        const seekBarRef = useRef<HTMLDivElement>(null);

        // Get the current video data from the sampleVideos
        const [currentVideo, setCurrentVideo] = useState<VideoData | undefined>(
            () => {
                // Find the video in sampleVideos by ID
                const video = sampleVideos.find(v => v.id === videoId);
                return video || sampleVideos[0]; // Default to first video if not found
            }
        );

        useImperativeHandle(ref, () => ({
            playVideo,
            pauseVideo,
        }));

        // Update currentVideoId and currentVideo when videoId prop changes
        useEffect(() => {
            setCurrentVideoId(videoId);
            const video = sampleVideos.find(v => v.id === videoId);
            if (video) {
                setCurrentVideo(video);
            }
        }, [videoId]);

        // Handle video selection
        const handleVideoSelect = (video: VideoData) => {
            setCurrentVideoId(video.id);
            setCurrentVideo(video);
            setIsLoaded(false); // Reset loading state for new video
            if (onVideoChange) {
                onVideoChange(video);
            }
        };

        // Show/hide controls with timeout
        const showControlsWithTimeout = useCallback(() => {
            setShowControls(true);
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
            controlsTimeoutRef.current = setTimeout(() => {
                if (!isSeeking) {
                    setShowControls(false);
                }
            }, 3000);
        }, [isSeeking]);

        useEffect(() => {
            if (!document.getElementById("youtube-api")) {
                const tag = document.createElement("script");
                tag.id = "youtube-api";
                tag.src = "https://www.youtube.com/iframe_api";
                const firstScriptTag =
                    document.getElementsByTagName("script")[0];
                firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
            }

            window.onYouTubeIframeAPIReady = () => {
                if (window.YT && playerContainerRef.current) {
                    playerInstanceRef.current = new window.YT.Player(
                        playerRef.current,
                        {
                            videoId,
                            playerVars: {
                                autoplay: 0,
                                controls: 0,
                                rel: 0,
                                modestbranding: 1,
                                showinfo: 0,
                                enablejsapi: 1,
                                iv_load_policy: 3,
                                fs: 0,
                                cc_load_policy: 0,
                                disablekb: 1,
                            },
                            events: {
                                onReady: (event: any) => {
                                    setIsLoaded(true);
                                    setDuration(event.target.getDuration());
                                },
                                onStateChange: (event: any) => {
                                    const state = event.data;
                                    if (
                                        state === window.YT.PlayerState.PLAYING
                                    ) {
                                        setIsPlaying(true);
                                        progressIntervalRef.current =
                                            setInterval(() => {
                                                const newTime =
                                                    playerInstanceRef.current?.getCurrentTime() ??
                                                    0;
                                                setCurrentTime(newTime);
                                                if (onProgressChange) {
                                                    onProgressChange(
                                                        newTime,
                                                        duration
                                                    );
                                                }
                                            }, 1000);
                                    } else {
                                        setIsPlaying(false);
                                        clearInterval(
                                            progressIntervalRef.current!
                                        );
                                    }
                                },
                            },
                        }
                    );
                }
            };

            return () => {
                if (progressIntervalRef.current)
                    clearInterval(progressIntervalRef.current);
                if (controlsTimeoutRef.current)
                    clearTimeout(controlsTimeoutRef.current);
                if (playerInstanceRef.current)
                    playerInstanceRef.current.destroy();
            };
        }, [videoId]);

        const playVideo = () => {
            playerInstanceRef.current?.playVideo();
        };

        const pauseVideo = () => {
            playerInstanceRef.current?.pauseVideo();
        };

        const togglePlayPause = () => {
            if (isPlaying) {
                pauseVideo();
            } else {
                playVideo();
            }
        };

        const seekTo = (seconds: number) => {
            playerInstanceRef.current?.seekTo(seconds, true);
            setCurrentTime(seconds);
            if (onProgressChange) onProgressChange(seconds, duration);
        };

        const handleSeekBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
            if (!seekBarRef.current || duration === 0) return;
            
            const rect = seekBarRef.current.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            const newTime = percentage * duration;
            
            seekTo(newTime);
        };

        const handleSeekBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
            if (!seekBarRef.current || duration === 0) return;
            
            const rect = seekBarRef.current.getBoundingClientRect();
            const hoverX = e.clientX - rect.left;
            const percentage = Math.max(0, Math.min(1, hoverX / rect.width));
            const time = percentage * duration;
            
            setHoverTime(time);
            setHoverPosition(percentage * 100);
        };

        const handleSeekBarMouseLeave = () => {
            setHoverTime(null);
        };

        const formatTime = (t: number) => {
            const hours = Math.floor(t / 3600);
            const minutes = Math.floor((t % 3600) / 60);
            const seconds = Math.floor(t % 60);
            
            if (hours > 0) {
                return `${hours}:${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
            }
            return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
        };

        const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

        return (
            <div className='relative w-full max-w-6xl mx-auto'>
                <div
                    className='relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-slate-200 dark:bg-slate-800 group'
                    onMouseMove={showControlsWithTimeout}
                    onMouseLeave={() => setShowControls(false)}
                >
                    {!isLoaded && (
                        <div className='absolute inset-0 flex items-center justify-center z-10'>
                            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'/>
                        </div>
                    )}
                    
                    <div ref={playerContainerRef} className='w-full h-full'>
                        <div
                            ref={playerRef}
                            id='youtube-player'
                            className='w-full h-full'
                        />
                    </div>

                    {/* Custom Controls Overlay */}
                    <div 
                        className={`absolute inset-0 transition-opacity duration-300 ${
                            showControls || !isLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                        {/* Center Play/Pause Button */}
                        <div className='absolute inset-0 flex items-center justify-center'>
                            <button
                                onClick={togglePlayPause}
                                className='bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-4 transition-all duration-200 transform hover:scale-110'
                            >
                                {isPlaying ? (
                                    <Pause size={32} />
                                ) : (
                                    <Play size={32} className="ml-1" />
                                )}
                            </button>
                        </div>

                        {/* Bottom Controls */}
                        <div className='absolute bottom-0 left-0 right-0'>
                            {/* Gradient Background */}
                            <div className='absolute inset-0 bg-gradient-to-t from-black/70 to-transparent'></div>
                            
                            {/* Seek Bar */}
                            <div className='relative px-4 pb-4'>
                                {/* Hover Time Tooltip */}
                                {hoverTime !== null && (
                                    <div 
                                        className='absolute bottom-full mb-2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded pointer-events-none z-10'
                                        style={{ left: `${hoverPosition}%` }}
                                    >
                                        {formatTime(hoverTime)}
                                        <div className='absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-black'></div>
                                    </div>
                                )}
                                
                                {/* Seek Bar Container */}
                                <div
                                    ref={seekBarRef}
                                    className='relative h-2 bg-white/30 rounded-full cursor-pointer group/seekbar'
                                    onClick={handleSeekBarClick}
                                    onMouseMove={handleSeekBarMouseMove}
                                    onMouseLeave={handleSeekBarMouseLeave}
                                >
                                    {/* Progress Bar */}
                                    <div
                                        className='absolute top-0 left-0 h-full bg-red-600 rounded-full transition-all duration-100'
                                        style={{ width: `${progressPercentage}%` }}
                                    >
                                        {/* Progress Handle */}
                                        <div className='absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-red-600 rounded-full opacity-0 group-hover/seekbar:opacity-100 transition-opacity duration-200'></div>
                                    </div>
                                    
                                    {/* Hover Preview */}
                                    {hoverTime !== null && (
                                        <div
                                            className='absolute top-1/2 transform -translate-y-1/2 w-1 h-4 bg-white rounded-full opacity-75'
                                            style={{ left: `${hoverPosition}%` }}
                                        ></div>
                                    )}
                                </div>

                                {/* Controls Row */}
                                <div className='flex items-center justify-between mt-3 text-white'>
                                    <div className='flex items-center space-x-4'>
                                        <button
                                            onClick={togglePlayPause}
                                            className='hover:bg-white/20 p-2 rounded-full transition-colors duration-200'
                                        >
                                            {isPlaying ? (
                                                <Pause size={20} />
                                            ) : (
                                                <Play size={20} />
                                            )}
                                        </button>
                                        
                                        <button className='hover:bg-white/20 p-2 rounded-full transition-colors duration-200'>
                                            <Volume2 size={20} />
                                        </button>
                                        
                                        <span className='text-sm font-medium'>
                                            {formatTime(currentTime)} / {formatTime(duration)}
                                        </span>
                                    </div>

                                    {showAskButton && (
                                        <button
                                            onClick={onAsk}
                                            className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105'
                                        >
                                            Ask Guruji
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Video Selector */}
                <div className="mt-4 mb-4">
                    <VideoSelector
                        selectedVideoId={currentVideoId}
                        onVideoSelect={handleVideoSelect}
                    />
                </div>

                {/* Video Info */}
                <div className='mt-4 px-2'>
                    <h2 className='text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2'>
                        {currentVideo?.title || "Learning Video"}
                    </h2>
                    <p className='text-slate-600 dark:text-slate-400'>
                        {currentVideo?.description || "Watch this video to understand the key concepts, then ask Guruji any questions you have!"}
                    </p>
                </div>
            </div>
        );
    }
);

YouTubePlayer.displayName = "YouTubePlayer";

export default YouTubePlayer;
