"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Info, Lightbulb } from "lucide-react";
import { useQuiz } from "../hooks/useQuiz";
import { getVideoById } from "../data/sampleVideos";
import YouTubePlayer from "./YouTubePlayer";

interface Question {
	_id: string;
	videoId: string;
	chunkIdx: number;
	text: string;
	type: string;
	options: string[];
	correctAnswer: string;
	timestamp: number;
	feedback: {
		correct: string;
		incorrect: string;
	};
	hint: string;
	difficulty: number;
	timesAnswered: number;
	timesAnsweredCorrectly: number;
}

interface MCQQuizProps {
	videoId: string;
	videoTime: number;

	pauseVideo: () => void;
	resumeVideo: () => void;
	onQuizComplete: () => void;
	question?: Question;
}

export default function MCQQuiz({
	videoId,
	videoTime,
	pauseVideo,
	resumeVideo,
	onQuizComplete,
	question,
}: MCQQuizProps) {
	
	const { data, loading, error } = useQuiz();
	const [current, setCurrent] = useState(0);
	const [selected, setSelected] = useState<number | null>(null);
	const [showHint, setShowHint] = useState(false);
	const [showExplanation, setShowExplanation] = useState(false);
	const [score, setScore] = useState(0);
	const [showQuiz, setShowQuiz] = useState(false);
	const [finished, setFinished] = useState(false);
	const [videoTimeState, setVideoTimeState] = useState(videoTime);
 

	const correctAnswerIndex = parseInt(question?.correctAnswer ?? "-1", 10);
	const currentTime = parseFloat(localStorage.getItem('videoCurrentTime') || '0');

console.log(currentTime,"videoTimeState")
	useEffect(() => {
		if (!question || showQuiz) return;
		if (videoTimeState >= question.timestamp) {
			setShowQuiz(true);
			pauseVideo();
		}
	}, [videoTimeState, question, showQuiz, pauseVideo]);

	const handleAnswer = (index: number) => {
		setSelected(index);
		setShowExplanation(true);
		if (index === correctAnswerIndex) setScore((prev) => prev + 1);
	};

	const handleNext = () => {
		if (current === (data?.questions.length || 0) - 1) {
			setFinished(true);
		} else {
			setCurrent(current + 1);
			setSelected(null);
			setShowHint(false);
			setShowExplanation(false);
			setShowQuiz(false);
		}
	};

	const handleBackToVideo = () => {
		setFinished(false);
		setCurrent(0);
		setSelected(null);
		setShowHint(false);
		setShowExplanation(false);
		setScore(0);
		setShowQuiz(false);
		resumeVideo();
		onQuizComplete();
	};

	const handleTimeUpdate = (currentTime: number) => {
		setVideoTimeState(currentTime);
		console.log('Current video time:', currentTime); // For debugging
	};

	// if (loading) return null;
	// if (error) return <div>Error loading quiz.</div>;
	// if (!data || !question || !showQuiz) return null;

	// if (finished) {
	// 	return (
	// 		<div className='p-6 bg-white dark:bg-slate-800 rounded-xl shadow text-center space-y-4'>
	// 			<h2 className='text-2xl font-bold text-slate-800 dark:text-white'>
	// 				Quiz Complete!
	// 			</h2>
	// 			<p className='text-lg text-slate-600 dark:text-slate-300'>
	// 				You scored <strong>{score}</strong> out of{" "}
	// 				{data.questions.length}
	// 			</p>
	// 			<button
	// 				onClick={handleBackToVideo}
	// 				className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition'
	// 			>
	// 				Back to Video
	// 			</button>
	// 		</div>
	// 	);
	// }

	return (
		<div className='p-6 bg-white dark:bg-slate-800 rounded-xl shadow space-y-6 animate-fade-in'>
			<p className='text-base text-slate-700 dark:text-slate-300'>
				{question?.text}
			</p>

			<div className='space-y-3'>
				{question?.options.map((opt, i) => {
					const isCorrect = i === correctAnswerIndex;
					const isSelected = i === selected;
					const showResult = selected !== null;

					return (
						<button
							key={i}
							disabled={showResult}
							onClick={() => handleAnswer(i)}
							className={`w-full p-4 rounded-lg text-left border transition-all duration-200 ${
								isSelected
									? isCorrect
										? "border-green-500 bg-green-50 dark:bg-green-900/20"
										: "border-red-500 bg-red-50 dark:bg-red-900/20"
									: "border-slate-300 hover:border-slate-500"
							}`}
						>
							<div className='flex items-center gap-3'>
								{showResult &&
									(isCorrect ? (
										<CheckCircle
											className='text-green-500'
											size={20}
										/>
									) : isSelected ? (
										<XCircle
											className='text-red-500'
											size={20}
										/>
									) : (
										<span className='w-5'></span>
									))}
								<span className='text-slate-800 dark:text-slate-100'>
									{opt}
								</span>
							</div>
						</button>
					);
				})}
			</div>

			<div>
				{!showHint ? (
					<button
						onClick={() => setShowHint(true)}
						className='flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline'
					>
						<Lightbulb size={16} />
						Show Hint
					</button>
				) : (
					<div className='text-sm text-yellow-700 dark:text-yellow-400 mt-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg'>
						<Info size={16} className='inline mr-1' />
						{question?.hint}
					</div>
				)}
			</div>

			{showExplanation && selected !== null && (
				<div className='mt-4 text-sm'>
					{selected !== correctAnswerIndex && (
						<p className='text-red-500 dark:text-red-400 mb-2'>
							❌ Incorrect. Correct answer:{" "}
							<strong>
								{question?.options[correctAnswerIndex]}
							</strong>
						</p>
					)}
					<p className='text-slate-600 dark:text-slate-400'>
						💡 {question?.hint}
					</p>
				</div>
			)}

			{selected !== null && (
				<button
					onClick={handleNext}
					className='w-full py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition mt-4'
				>
					{current === (data?.questions?.length || 1) - 1
						? "Finish Quiz"
						: "Next"}
				</button>
			)}

			<div>
				Current Video Time: {Math.floor(videoTimeState)} seconds
			</div>
		</div>
	);
}
