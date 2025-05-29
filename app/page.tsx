"use client";

import { useEffect, useRef, useState } from "react";
import YouTubePlayer, { YouTubePlayerRef } from "./components/YouTubePlayer";
import MCQQuiz from "./components/MCQQuiz";
import AIInputBox from "./components/AIInputBox";
import AIResponseBox from "./components/AIResponseBox";

type AppState = "initial" | "listening" | "responding" | "complete";

export default function Home() {
	const [appState, setAppState] = useState<AppState>("initial");
	const [userInput, setUserInput] = useState("");
	const [aiResponse, setAiResponse] = useState("");

  const playerRef = useRef<YouTubePlayerRef>(null);
  const [videoTime, setVideoTime] = useState(0);

  // Use YouTube iframe message loop OR interval to track time
  useEffect(() => {
		const interval = setInterval(() => {
			// Simulate video time tracking
			setVideoTime((prev) => prev + 1);
		}, 1000);

		return () => clearInterval(interval);
  }, []);

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

	return (
		<div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300'>
			<div className='px-4 py-8'>
				<div className='grid grid-cols-1 md:grid-cols-5 gap-8 items-start'>
					{/* YouTubePlayer - 60% */}
					<div className='md:col-span-3 space-y-6 animate-fade-in'>
						<YouTubePlayer
							videoId='dQw4w9WgXcQ'
							showAskButton={appState === "initial"}
							onAsk={handleAskGuruji}
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
								videoId='68381e243be252feaa1ffa24'
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
