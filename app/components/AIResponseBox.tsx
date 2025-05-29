"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Send } from "lucide-react";
import VoiceInput from "../components/VoiceInput";
import AIResponseHandler from "./AIResponseHandler";

interface AIResponseBoxProps {
	response: string;
	isTyping: boolean;
	onComplete: () => void;
	videoId?: string;
	videoTime?: number;
}

export default function AIResponseBox({ response, isTyping, onComplete, videoId, videoTime }: AIResponseBoxProps) {
	const [displayedResponse, setDisplayedResponse] = useState("");
	const [responseIndex, setResponseIndex] = useState(0);
	const [isSpeaking, setIsSpeaking] = useState(false);
	const [isWorking, setIsWorking] = useState(false);

	// Reset the displayed response when the response prop changes
	useEffect(() => {
		setDisplayedResponse("");
		setResponseIndex(0);
	}, [response]);

	// Handle typing animation
	useEffect(() => {
		if (isTyping && responseIndex < response.length) {
			const timer = setTimeout(() => {
				setDisplayedResponse(prev => prev + response[responseIndex]);
				setResponseIndex(prev => prev + 1);

				// Check if we've reached the end of the response
				if (responseIndex + 1 >= response.length) {
					onComplete();
				}
			}, 30);
			return () => clearTimeout(timer);
		}
	}, [isTyping, response, responseIndex, onComplete]);

	return (
		<div className='transform transition-all duration-500 ease-out animate-in slide-in-from-bottom-4'>
			<div className='bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6'>
				<h3 className='text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4'>
					Guruji's Response
				</h3>

				<div className='response-content prose prose-slate dark:prose-invert max-w-none'>
					{isTyping ? (
						<>
							<div className="mb-2">{displayedResponse}</div>
							<div className="typing-indicator flex space-x-1 mt-4">
								<div className="dot w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
								<div className="dot w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
								<div className="dot w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
							</div>
						</>
					) : (
						<div>{displayedResponse}</div>
					)}
				</div>
			</div>

			{/* AI Response Handler for processing with video context */}
			<div className='mt-4'>
				<AIResponseHandler
					userInput={response}
					isWorking={isWorking}
					setIsWorking={setIsWorking}
					onResponseStart={() => {
						setIsWorking(true);
					}}
					onResponseEnd={() => {
						setIsWorking(false);
					}}
					setIsSpeaking={setIsSpeaking}
					isSpeaking={isSpeaking}
					videoId={videoId}
					videoTime={videoTime}
				/>

				{/* Guruji is speaking animation */}
				{isSpeaking && (
					<div className='mt-4 text-center text-sm text-purple-600 dark:text-purple-300 animate-pulse'>
						Guruji is speaking...
					</div>
				)}
			</div>
		</div>
	);
}
