"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle, XCircle, Info, Lightbulb, X } from "lucide-react";
import { useQuiz } from "../hooks/useQuiz";

interface MCQQuizProps {
	videoId: string;
	videoTime: number;
	pauseVideo: () => void;
	resumeVideo: () => void;
	onQuizComplete: () => void;
}

interface QuestionState {
	questionId: string;
	hasBeenShown: boolean;
	hasBeenAnswered: boolean;
	selectedAnswer?: number;
	isCorrect?: boolean;
}

export default function MCQQuiz({
	videoId,
	videoTime,
	pauseVideo,
	resumeVideo,
	onQuizComplete,
}: MCQQuizProps) {
	const { data, loading, error } = useQuiz();
	const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
	const [showQuizPopup, setShowQuizPopup] = useState(false);
	const [questionStates, setQuestionStates] = useState<Map<string, QuestionState>>(new Map());
	const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
	const [showHint, setShowHint] = useState(false);
	const [showExplanation, setShowExplanation] = useState(false);
	const [totalScore, setTotalScore] = useState(0);
	const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState(0);

	// Initialize question states when data loads
	useEffect(() => {
		if (data?.questions) {
			const newQuestionStates = new Map<string, QuestionState>();
			data.questions.forEach(question => {
				newQuestionStates.set(question._id, {
					questionId: question._id,
					hasBeenShown: false,
					hasBeenAnswered: false,
				});
			});
			setQuestionStates(newQuestionStates);
		}
	}, [data]);

	// Check for questions that should be shown based on current video time
	useEffect(() => {
		if (!data?.questions || loading || showQuizPopup) return;

		// Find questions that should be triggered at current time
		const questionsToShow = data.questions.filter(question => {
			const state = questionStates.get(question._id);
			return (
				videoTime >= question.timestamp && 
				state && 
				!state.hasBeenShown && 
				!state.hasBeenAnswered
			);
		});

		// Show the first eligible question
		if (questionsToShow.length > 0) {
			const questionToShow = questionsToShow[0];
			setCurrentQuestionId(questionToShow._id);
			setShowQuizPopup(true);
			pauseVideo();
			
			// Mark as shown
			setQuestionStates(prev => {
				const newStates = new Map(prev);
				const state = newStates.get(questionToShow._id);
				if (state) {
					newStates.set(questionToShow._id, { ...state, hasBeenShown: true });
				}
				return newStates;
			});
		}
	}, [videoTime, data, questionStates, loading, showQuizPopup, pauseVideo]);

	const currentQuestion = data?.questions?.find(q => q._id === currentQuestionId);
	const correctAnswerIndex = currentQuestion ? parseInt(currentQuestion.correctAnswer, 10) : -1;

	const handleAnswer = useCallback((answerIndex: number) => {
		if (!currentQuestion) return;

		setSelectedAnswer(answerIndex);
		setShowExplanation(true);
		
		const isCorrect = answerIndex === correctAnswerIndex;
		
		// Update question state
		setQuestionStates(prev => {
			const newStates = new Map(prev);
			const state = newStates.get(currentQuestion._id);
			if (state) {
				newStates.set(currentQuestion._id, {
					...state,
					hasBeenAnswered: true,
					selectedAnswer: answerIndex,
					isCorrect
				});
			}
			return newStates;
		});

		// Update score
		if (isCorrect) {
			setTotalScore(prev => prev + 1);
		}
		setTotalQuestionsAnswered(prev => prev + 1);
	}, [currentQuestion, correctAnswerIndex]);

	const handleCloseQuiz = useCallback(() => {
		setShowQuizPopup(false);
		setCurrentQuestionId(null);
		setSelectedAnswer(null);
		setShowHint(false);
		setShowExplanation(false);
		resumeVideo();
	}, [resumeVideo]);

	const handleNextQuestion = useCallback(() => {
		handleCloseQuiz();
	}, [handleCloseQuiz]);

	// Don't render anything if loading or no data
	if (loading || error || !data?.questions) {
		return null;
	}

	// Show quiz popup modal
	if (showQuizPopup && currentQuestion) {
		return (
			<>
				{/* Backdrop */}
				<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
					{/* Modal */}
					<div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
						{/* Header */}
						<div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
							<h2 className="text-xl font-semibold text-slate-800 dark:text-white">
								Quiz Question
							</h2>
							<button
								onClick={handleCloseQuiz}
								className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
							>
								<X size={20} className="text-slate-500" />
							</button>
						</div>

						{/* Content */}
						<div className="p-6 space-y-6">
							{/* Question */}
							<div className="text-lg font-medium text-slate-800 dark:text-white">
								{currentQuestion.text}
							</div>

							{/* Options */}
							<div className="space-y-3">
								{currentQuestion.options.map((option, index) => {
									const isCorrect = index === correctAnswerIndex;
									const isSelected = index === selectedAnswer;
									const showResult = selectedAnswer !== null;

									return (
										<button
											key={index}
											disabled={showResult}
											onClick={() => handleAnswer(index)}
											className={`w-full p-4 rounded-xl text-left border transition-all duration-200 ${
												isSelected
													? isCorrect
														? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200"
														: "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200"
													: showResult && isCorrect
													? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200"
													: "border-slate-300 dark:border-slate-600 hover:border-slate-500 dark:hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
											} ${showResult ? 'cursor-default' : 'cursor-pointer'}`}
										>
											<div className="flex items-center gap-3">
												{showResult && (
													isCorrect ? (
														<CheckCircle className="text-green-500" size={20} />
													) : isSelected ? (
														<XCircle className="text-red-500" size={20} />
													) : (
														<div className="w-5" />
													)
												)}
												<span className="text-slate-800 dark:text-slate-100">
													{option}
												</span>
											</div>
										</button>
									);
								})}
							</div>

							{/* Hint */}
							<div>
								{!showHint ? (
									<button
										onClick={() => setShowHint(true)}
										className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
									>
										<Lightbulb size={16} />
										Show Hint
									</button>
								) : (
									<div className="text-sm text-yellow-700 dark:text-yellow-300 px-4 py-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
										<div className="flex items-center gap-2">
											<Info size={16} />
											<span>{currentQuestion.hint}</span>
										</div>
									</div>
								)}
							</div>

							{/* Explanation */}
							{showExplanation && selectedAnswer !== null && (
								<div className="space-y-3">
									{selectedAnswer === correctAnswerIndex ? (
										<div className="text-green-700 dark:text-green-300 px-4 py-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
											<div className="flex items-center gap-2 font-medium">
												<CheckCircle size={16} />
												{currentQuestion.feedback.correct} Correct!
											</div>
										</div>
									) : (
										<div className="text-red-700 dark:text-red-300 px-4 py-3 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
											<div className="flex items-center gap-2 font-medium mb-2">
												<XCircle size={16} />
												{currentQuestion.feedback.incorrect} Incorrect
											</div>
											<div className="text-sm">
												Correct answer: <strong>{currentQuestion.options[correctAnswerIndex]}</strong>
											</div>
										</div>
									)}
									
									<div className="text-sm text-slate-600 dark:text-slate-400 px-4 py-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
										<div className="flex items-start gap-2">
											<Lightbulb size={16} className="mt-0.5 flex-shrink-0" />
											<span>{currentQuestion.hint}</span>
										</div>
									</div>
								</div>
							)}

							{/* Action Button */}
							{selectedAnswer !== null && (
								<div className="flex justify-end pt-4">
									<button
										onClick={handleNextQuestion}
										className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium"
									>
										Continue Watching
									</button>
								</div>
							)}
						</div>
					</div>
				</div>
			</>
		);
	}

	// Show quiz summary in the sidebar when not in popup mode
	if (totalQuestionsAnswered > 0) {
		return (
			<div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg space-y-4">
				<h3 className="text-lg font-semibold text-slate-800 dark:text-white">
					Quiz Progress
				</h3>
				<div className="text-sm text-slate-600 dark:text-slate-400">
					Questions answered: {totalQuestionsAnswered}
				</div>
				<div className="text-sm text-slate-600 dark:text-slate-400">
					Score: {totalScore} / {totalQuestionsAnswered}
				</div>
				<div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
					<div 
						className="bg-blue-600 h-2 rounded-full transition-all duration-300"
						style={{ width: `${(totalScore / Math.max(totalQuestionsAnswered, 1)) * 100}%` }}
					/>
				</div>
			</div>
		);
	}

	// Default empty state
	return null;
}
