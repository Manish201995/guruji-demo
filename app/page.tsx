"use client";

import { useEffect, useRef, useState } from "react";
import YouTubePlayer, { YouTubePlayerRef } from "./components/YouTubePlayer";
import MCQQuiz from "./components/MCQQuiz";
import AIInputBox from "./components/AIInputBox";
import AIResponseBox from "./components/AIResponseBox";
import {sampleVideos, VideoData} from "./data/sampleVideos";

type AppState = "initial" | "listening" | "responding" | "complete";

export default function Home() {
	const [appState, setAppState] = useState<AppState>("initial");
	const [userInput, setUserInput] = useState("");
	const [aiResponse, setAiResponse] = useState("");
	const [selectedVideoId, setSelectedVideoId] = useState(sampleVideos[0].id); // Default video ID

  const playerRef = useRef<YouTubePlayerRef>(null);
  const [videoTime, setVideoTime] = useState(0);
  const currentVideoTimeRef = useRef(0); // Ref to track current video time for AI component

  // Use YouTube iframe message loop OR interval to track time
  useEffect(() => {
		const interval = setInterval(() => {
			// Simulate video time tracking
			const newTime = videoTime + 1;
			setVideoTime(newTime);
			currentVideoTimeRef.current = newTime; // Update ref for AI component
		}, 1000);

		return () => clearInterval(interval);
  }, [videoTime]);

	const handleAskGuruji = () => {
		setAppState("listening");
	};

	const handleInputComplete = (input: string) => {
		setUserInput(input);
		setAppState("responding");
		setTimeout(() => {
			setAiResponse(
				`Great question! Based on the video content, here's what I understand: "${input}". Let me explain further...`
			);
			setAppState("complete");
		}, 2000);
	};

	const handleReset = () => {
		setAppState("initial");
		setUserInput("");
		setAiResponse("");
	};

	// Handle video selection
	const handleVideoChange = (video: VideoData) => {
		setSelectedVideoId(video.id);
		setVideoTime(0); // Reset video time
		currentVideoTimeRef.current = 0; // Reset current video time ref
		setAppState("initial"); // Reset app state
		setUserInput(""); // Reset user input
		setAiResponse(""); // Reset AI response
	};

	return (
		<div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300'>
			<div className='px-4 py-8'>
				<div className='grid grid-cols-1 md:grid-cols-5 gap-8 items-start'>
					{/* YouTubePlayer - 60% */}
					<div className='md:col-span-3 space-y-6 animate-fade-in'>
						<YouTubePlayer
							videoId={selectedVideoId}
							showAskButton={appState === "initial"}
							onAsk={handleAskGuruji}
							onVideoChange={handleVideoChange}
						/>
					</div>

					{/* Right Side: MCQ or AI */}
					<div className='md:col-span-2 space-y-6 animate-fade-in delay-200'>
						{/* Show AI Flow if not in initial state */}
						{appState !== "initial" && (
							<>
								{/* AI Input */}
								{(appState === "listening" ||
									appState === "responding") && (
									<AIInputBox
										isListening={appState === "listening"}
										onInputComplete={handleInputComplete}
									/>
								)}

								{/* AI Response */}
								{(appState === "responding" ||
									appState === "complete") && (
									<AIResponseBox
										response={aiResponse}
										isTyping={appState === "responding"}
										onComplete={() =>
											setAppState("complete")
										}
										videoId={selectedVideoId}
										videoTime={currentVideoTimeRef.current}
									/>
								)}

								{/* Reset Button */}
								{appState === "complete" && (
									<div className='flex justify-center'>
										<button
											onClick={handleReset}
											className='px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors duration-200'
										>
											Ask Another Question
										</button>
									</div>
								)}
							</>
						)}

						{/* Show MCQQuiz only when AIInput/Response is NOT visible */}

						{appState === "initial" && (
							<MCQQuiz
								videoId={selectedVideoId}
								videoTime={videoTime}
								pauseVideo={() =>
									playerRef.current?.pauseVideo()
								}
								resumeVideo={() =>
									playerRef.current?.playVideo()
								}
								onQuizComplete={() => console.log("done")}
							/>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
