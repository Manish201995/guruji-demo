import { useEffect, useState } from "react";
import { fetchQuizByVideoId } from "../fetcher/fetchQuizByVideoId";

// Updated question type based on new API structure
export interface Question {
	_id: string;
	videoId: string;
	chunkIdx: number;
	text: string;
	type: "multiple_choice";
	options: string[];
	timestamp: number;
	correctAnswer: string; // e.g. "0", "1"
	hint: string;
	feedback: {
		correct: string;
		incorrect: string;
	};
	difficulty: number;
	timesAnswered: number;
	timesAnsweredCorrectly: number;
	createdAt: string;
	updatedAt: string;
}

export interface QuizResponse {
	videoId: string;
	questions: Question[];
}

export function useQuiz(videoId: string) {
	const [data, setData] = useState<QuizResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		if (!videoId) return;

		setLoading(true);
		setError(null);

		fetchQuizByVideoId(videoId)
			.then(setData)
			.catch(setError)
			.finally(() => setLoading(false));
	}, [videoId]);

	return { data, loading, error };
}
