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
	const baseURL = "https://literate-macaque-cute.ngrok-free.app";
	const endpoint = `/api/questions/videos/${videoId}`;

	const res = await fetch(`${baseURL}${endpoint}`, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
		next: { revalidate: 60 }, // optional
	});

	const contentType = res.headers.get("content-type") || "";

	if (!res.ok) {
		const text = await res.text();
		console.error("Non-OK response:", text);
		throw new Error(`Request failed: ${res.status}`);
	}

	if (!contentType.includes("application/json")) {
		const htmlText = await res.text();
		console.error("Unexpected HTML response:", htmlText.slice(0, 300)); // Just log a part
		throw new Error("Expected JSON, but received HTML.");
	}

	const data = await res.json();
	return data;


}
