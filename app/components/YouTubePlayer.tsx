"use client";

import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from "react";
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
        const [seekValue, setSeekValue] = useState(0);

        const playerRef = useRef<any>(null);
        const playerContainerRef = useRef<HTMLDivElement>(null);
        const playerInstanceRef = useRef<any>(null);
        const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

        const seekTo = (seconds: number) => {
            playerInstanceRef.current?.seekTo(seconds, true);
            setCurrentTime(seconds);
            if (onProgressChange) onProgressChange(seconds, duration);
        };

        const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = parseFloat(e.target.value);
            setSeekValue(value);
        };

        const handleSeekStart = () => {
            setIsSeeking(true);
            clearInterval(progressIntervalRef.current!);
        };

        const handleSeekEnd = () => {
            setIsSeeking(false);
            seekTo(seekValue);
        };

        const formatTime = (t: number) => {
            const m = Math.floor(t / 60);
            const s = Math.floor(t % 60);
            return `${m}:${s < 10 ? "0" : ""}${s}`;
        };

        return (
            <div className='relative w-full max-w-6xl mx-auto'>
                <div
                    className='relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-slate-200 dark:bg-slate-800'>
                    {!isLoaded && (
                        <div className='absolute inset-0 flex items-center justify-center'>
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
                </div>

                {/* Controls */}
                <div className='mt-4 bg-slate-100 dark:bg-slate-700 p-3 rounded-lg'>
                    <div className='flex items-center gap-2 mb-2'>
                        <button
                            onClick={isPlaying ? pauseVideo : playVideo}
                            className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md'
                        >
                            {isPlaying ? "Pause" : "Play"}
                        </button>
                        <span className='text-slate-700 dark:text-slate-300'>
							{formatTime(currentTime)} / {formatTime(duration)}
						</span>
                    </div>

					<input
						type='range'
						min={0}
						max={duration}
						step={0.1}
						value={isSeeking ? seekValue : currentTime}
						onChange={handleSeekChange}
						onMouseDown={handleSeekStart}
						onMouseUp={handleSeekEnd}
						onTouchStart={handleSeekStart}
						onTouchEnd={handleSeekEnd}
						className='w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer'
					/>
				</div>

				<div className="mt-4 mb-4">
					<VideoSelector
						selectedVideoId={currentVideoId}
						onVideoSelect={handleVideoSelect}
					/>
				</div>

				{/* Video Info and Ask Guruji Button */}
                    <div className='mt-4 px-2 flex justify-between items-center'>
                        <div className='flex flex-col justify-center'>
                            <h2 className='text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2'>
                                {currentVideo?.title || "Learning Video"}
                            </h2>
                            <p className='text-slate-600 dark:text-slate-400'>
                                {currentVideo?.description || "Watch this video to understand the key concepts, then ask Guruji any questions you have!"}
                            </p>
                        </div>

                        {showAskButton && (
                            <div className='flex flex-col items-center justify-center'>
                                <button
                                    onClick={onAsk}
                                    className='group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300'
                                >
								<span className='relative z-10'>
									Ask Guruji
								</span>
                                    <div
                                        className='absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur opacity-75 group-hover:opacity-100 transition-opacity duration-300'/>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                );
                }
                );

                YouTubePlayer.displayName = "YouTubePlayer";

                export default YouTubePlayer;
