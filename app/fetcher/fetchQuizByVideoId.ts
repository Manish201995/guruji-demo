export interface Question {
	_id: string;
	videoId: string;
	chunkIdx: number;
	text: string;
	type: "multiple_choice";
	options: string[];
	correctAnswer: string; // e.g. "0", "1", etc.
	timestamp: number;
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

export async function fetchQuizByVideoId(
	videoId: string
): Promise<QuizResponse> {
	const baseURL = "https://8f76-103-222-252-210.ngrok-free.app/";
	const endpoint = `api/questions/videos/${videoId}`;

	const res = await fetch(`${baseURL}${endpoint}`, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			"ngrok-skip-browser-warning": "69420",
		},
		next: { revalidate: 60 }, // Optional for Next.js
	});

	if (!res.ok) {
		throw new Error(`Failed to fetch quiz for videoId: ${videoId}`);
	}

	return res.json();
}
