"use client";

import {
	forwardRef,
	useImperativeHandle,
	useRef,
	useState,
	useEffect,
} from "react";
import VideoSelector from "./VideoSelector";
import {sampleVideos, VideoData} from "../data/sampleVideos";

export interface YouTubePlayerRef {
	pauseVideo: () => void;
	playVideo: () => void;
	getCurrentTime: () => number;
}

interface YouTubePlayerProps {
	videoId: string;
	showAskButton?: boolean;
	onAsk?: () => void;
	onVideoChange?: (video: VideoData) => void;
}

const YouTubePlayer = forwardRef<YouTubePlayerRef, YouTubePlayerProps>(
	({ videoId, showAskButton, onAsk, onVideoChange }, ref) => {
		const [isLoaded, setIsLoaded] = useState(false);
		const [currentVideoId, setCurrentVideoId] = useState(videoId);
		const iframeRef = useRef<HTMLIFrameElement>(null);

		// Get the current video data from the sampleVideos
		const [currentVideo, setCurrentVideo] = useState<VideoData | undefined>(
			() => {
				// Find the video in sampleVideos by ID
				const video = sampleVideos.find(v => v.id === videoId);
				return video || sampleVideos[0]; // Default to first video if not found
			}
		);

		useImperativeHandle(ref, () => ({
			pauseVideo() {
				iframeRef.current?.contentWindow?.postMessage(
					'{"event":"command","func":"pauseVideo","args":""}',
					"*"
				);
			},
			playVideo() {
				iframeRef.current?.contentWindow?.postMessage(
					'{"event":"command","func":"playVideo","args":""}',
					"*"
				);
			},
			getCurrentTime() {
				// YouTube iframe API doesn't support synchronous current time fetching via postMessage
				// You’ll need to manage time tracking externally via YouTube Iframe API if needed
				return 0;
			},
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

		// Append enablejsapi=1 for JS control
		const src = `https://www.youtube.com/embed/${currentVideoId}?enablejsapi=1&modestbranding=1&rel=0`;

		useEffect(() => {
			// Required to initialize postMessage control
			window.addEventListener("message", () => {});
		}, []);

		return (
			<div className='relative w-full max-w-6xl mx-auto'>
				<div className='relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-slate-200 dark:bg-slate-800'>
					{!isLoaded && (
						<div className='absolute inset-0 flex items-center justify-center'>
							<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
						</div>
					)}
					<iframe
						ref={iframeRef}
						src={src}
						title='YouTube video player'
						frameBorder='0'
						allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
						allowFullScreen
						className='w-full h-full'
						onLoad={() => setIsLoaded(true)}
					/>
				</div>

				{/* Video Selector */}
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
								<div className='absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur opacity-75 group-hover:opacity-100 transition-opacity duration-300'></div>
							</button>
						</div>
					)}
				</div>
			</div>
		);
	}
);

export default YouTubePlayer;
