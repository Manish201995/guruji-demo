// hooks/useQuiz.ts
import { useEffect, useState } from "react";
import {
	fetchQuizByVideoId,
	QuizResponse,
} from "../fetcher/fetchQuizByVideoId";

const HARDCODED_VIDEO_ID = "6838627867642705b395205e";

export function useQuiz() {
	const [data, setData] = useState<QuizResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		setLoading(true);
		setError(null);
		console.log("Fetching quiz data...");
		fetchQuizByVideoId(HARDCODED_VIDEO_ID)
			.then((d)=>{
				setData(d);
				console.log("Quiz data fetched:", d);
			})
			.catch(setError)
			.finally(() => setLoading(false));
	}, []);

	return { data, loading, error };
}
