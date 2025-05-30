// hooks/useQuiz.ts
import { useEffect, useState } from "react";
import {
	fetchQuizByVideoId,
	QuizResponse,
} from "../fetcher/fetchQuizByVideoId";

const HARDCODED_VIDEO_ID = "68381e243be252feaa1ffa24";

export function useQuiz() {
	const [data, setData] = useState<QuizResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		setLoading(true);
		setError(null);

		fetchQuizByVideoId(HARDCODED_VIDEO_ID)
			.then((d)=>{
				setData(d);
			})
			.catch(setError)
			.finally(() => setLoading(false));
	}, []);

	return { data, loading, error };
}
