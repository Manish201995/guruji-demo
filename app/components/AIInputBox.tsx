"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Send } from "lucide-react";
import VoiceInput from "./VoiceInput";

interface AIInputBoxProps {
	isListening: boolean;
	onInputComplete: (input: string) => void;
	onMicClick?: () => void;
}

export default function AIInputBox({
	isListening,
	onInputComplete,
	onMicClick,
}: AIInputBoxProps) {
	const [inputText, setInputText] = useState("");
	const [isRecording, setIsRecording] = useState(false);
	const [recordingTime, setRecordingTime] = useState(0);
	const [isSpeaking, setIsSpeaking] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isWorking, setIsWorking] = useState(false);
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		if (isListening) {
			setTimeout(() => {
				inputRef.current?.focus();
			}, 300);
		}
	}, [isListening]);

	// Stop recording immediately when isWorking becomes false
	useEffect(() => {
		if (!isWorking) {
			console.log("isWorking is false, stopping recording...");
			setIsRecording(false);
			setRecordingTime(0);
			if (recordingTimerRef.current) {
				clearInterval(recordingTimerRef.current);
				recordingTimerRef.current = null;
			}
		}
	}, [isWorking]);

	// Handle recording timer
	useEffect(() => {
		if (isRecording && isWorking) {
			recordingTimerRef.current = setInterval(() => {
				setRecordingTime((prev) => prev + 1);
			}, 1000);
		} else {
			if (recordingTimerRef.current) {
				clearInterval(recordingTimerRef.current);
			}
			setRecordingTime(0);
		}

		return () => {
			if (recordingTimerRef.current) {
				clearInterval(recordingTimerRef.current);
			}
		};
	}, [isRecording, isWorking]);

	const handleMicClick = () => {
		console.log("Mic clicked, current states:", { isRecording, isWorking });
		
		if (onMicClick) onMicClick();
		
		if (isRecording || isWorking) {
			// Stop recording
			console.log("Stopping recording...");
			setIsWorking(false);
			setIsRecording(false);
		} else {
			// Start recording
			console.log("Starting recording...");
			setIsRecording(true);
			setIsWorking(true);
		}
		setError(null);
	};

	const handleSubmit = () => {
		if (inputText.trim()) {
			// Stop any ongoing recording/listening before submitting
			console.log("Submitting, stopping recording...");
			setIsRecording(false);
			setIsWorking(false);
			onInputComplete(inputText.trim());
			setInputText("");
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	};

	const handleSpeechRecognized = useCallback(
		(text: string) => {
			console.log("Speech recognized, stopping recording...");
			setInputText(text); // Show recognized text in the textbox
			setIsRecording(false);
			setIsWorking(false); // Explicitly stop working when speech is recognized
			onInputComplete(text); // Trigger response rendering
		},
		[onInputComplete]
	);

	const handleWorkingStateChange = useCallback((working: boolean) => {
		console.log("Working state changing to:", working);
		setIsWorking(working);
		if (!working) {
			console.log("Working stopped, stopping recording...");
			setIsRecording(false);
		}
	}, []);

	// Force stop recording when component unmounts or gets updated
	useEffect(() => {
		return () => {
			console.log("AIInputBox unmounting, cleaning up...");
			setIsWorking(false);
			setIsRecording(false);
			if (recordingTimerRef.current) {
				clearInterval(recordingTimerRef.current);
			}
		};
	}, []);

	return (
		<div className='transform transition-all duration-500 ease-out animate-in slide-in-from-bottom-4'>
			<div className='bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6'>
				<h3 className='text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4'>
					Ask Your Question
				</h3>

				{/* Error */}
				{error && (
					<div className='mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
						<p className='text-red-600 dark:text-red-400 text-sm'>
							{error}
						</p>
					</div>
				)}

				{/* Text Input */}
				<div className='relative mb-4'>
					<textarea
						ref={inputRef}
						value={inputText}
						onChange={(e) => setInputText(e.target.value)}
						onKeyPress={handleKeyPress}
						placeholder='Type your question here or use the microphone...'
						className='w-full p-4 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
						rows={3}
						disabled={isRecording}
					/>
				</div>

				{/* Controls */}
				<div className='flex items-center justify-between'>
					<div className='flex items-center space-x-4'>
						<button
							onClick={handleMicClick}
							className={`relative p-3 rounded-full transition-all duration-300 ${
								isRecording
									? "bg-red-500 text-white shadow-lg"
									: "bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg"
							}`}
						>
							{isRecording ? (
								<MicOff size={20} />
							) : (
								<Mic size={20} />
							)}
							{isRecording && (
								<>
									<div className='absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75'></div>
									<div className='absolute inset-0 rounded-full bg-red-300 animate-pulse opacity-50'></div>
								</>
							)}
						</button>

						{isRecording && (
							<div className='flex items-center space-x-2 text-red-500'>
								<div className='w-2 h-2 bg-red-500 rounded-full animate-pulse'></div>
								<span className='text-sm font-medium'>
									Listening... {recordingTime}s
								</span>
							</div>
						)}
					</div>

					<button
						onClick={handleSubmit}
						disabled={!inputText.trim() || isRecording}
						className='px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2'
					>
						<Send size={16} />
						<span>Send</span>
					</button>
				</div>

				{/* Waveform */}
				{isRecording && (
					<div className='mt-4 flex items-center justify-center space-x-1'>
						{[...Array(5)].map((_, i) => (
							<div
								key={i}
								className='w-1 bg-blue-500 rounded-full animate-pulse'
								style={{
									height: `${Math.random() * 20 + 10}px`,
									animationDelay: `${i * 0.1}s`,
									animationDuration: "0.5s",
								}}
							></div>
						))}
					</div>
				)}

				<div className='mt-4 text-center'>
					<span className='text-sm text-slate-500 dark:text-slate-400'>
						{isRecording
							? "Listening for your question..."
							: "Ready to listen"}
					</span>
				</div>
			</div>

			{/* Real-Time Voice Input (Powered by Microsoft SDK) */}
			{/* Always render VoiceInput but control it via isWorking */}
			<VoiceInput
				onSpeechRecognized={handleSpeechRecognized}
				isWorking={isWorking && isRecording}
				setIsWorking={handleWorkingStateChange}
				isSpeaking={isSpeaking}
			/>
		</div>
	);
}

