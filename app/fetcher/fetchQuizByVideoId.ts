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
	__v: number;
	createdAt: string;
	updatedAt: string;
}

export interface QuizResponse {
	videoId: string;
	questions: Question[];
	youtubeVideoId?: string;
}

// Sample quiz data for testing timestamp-based quizzes
const SAMPLE_QUIZ_DATA: QuizResponse = {
	"videoId": "68381e243be252feaa1ffa24",
	"questions": [
		{
			"_id": "68382feacfd5e4ba0cba0194",
			"videoId": "68381e243be252feaa1ffa24",
			"chunkIdx": 0,
			"text": "Vektor ka representation kaise hota hai?",
			"type": "multiple_choice",
			"options": [
				"Arrow",
				"Circle",
				"Square",
				"Triangle"
			],
			"correctAnswer": "0",
			"timestamp": 10, // Changed to 10 seconds for easier testing
			"feedback": {
				"correct": "✅",
				"incorrect": "❌"
			},
			"hint": "Arrow ka use hota hai",
			"difficulty": 0,
			"timesAnswered": 0,
			"timesAnsweredCorrectly": 0,
			"__v": 0,
			"createdAt": "2025-05-29T09:59:06.765Z",
			"updatedAt": "2025-05-29T09:59:06.765Z"
		},
		{
			"_id": "68382feacfd5e4ba0cba0195",
			"videoId": "68381e243be252feaa1ffa24",
			"chunkIdx": 0,
			"text": "Vektor ke magnitude ko kya represent karta hai?",
			"type": "multiple_choice",
			"options": [
				"Length",
				"Width",
				"Height",
				"Color"
			],
			"correctAnswer": "0",
			"timestamp": 25, // Changed to 25 seconds for easier testing
			"feedback": {
				"correct": "✅",
				"incorrect": "❌"
			},
			"hint": "Length se magnitude pata chalta hai",
			"difficulty": 0,
			"timesAnswered": 0,
			"timesAnsweredCorrectly": 0,
			"__v": 0,
			"createdAt": "2025-05-29T09:59:06.766Z",
			"updatedAt": "2025-05-29T09:59:06.766Z"
		},
		{
			"_id": "68382feacfd5e4ba0cba0196",
			"videoId": "68381e243be252feaa1ffa24",
			"chunkIdx": 0,
			"text": "Vektor ka direction kaise dikhaya jata hai?",
			"type": "multiple_choice",
			"options": [
				"Head",
				"Tail",
				"Middle",
				"None"
			],
			"correctAnswer": "0",
			"timestamp": 45, // Changed to 45 seconds for easier testing
			"feedback": {
				"correct": "✅",
				"incorrect": "❌"
			},
			"hint": "Head direction batata hai",
			"difficulty": 0,
			"timesAnswered": 0,
			"timesAnsweredCorrectly": 0,
			"__v": 0,
			"createdAt": "2025-05-29T09:59:06.766Z",
			"updatedAt": "2025-05-29T09:59:06.766Z"
		}
	],
	"youtubeVideoId": "rLmVC53EwVo"
};

export async function fetchQuizByVideoId(
	videoId: string
): Promise<QuizResponse> {
	// For development/testing, return sample data immediately
	// Comment out this block to use the actual API
	console.log("Using sample quiz data for testing...");
	return new Promise((resolve) => {
		setTimeout(() => resolve(SAMPLE_QUIZ_DATA), 500); // Simulate network delay
	});

	// Uncomment below for actual API usage
	/*
	const baseURL = "https://d3d7-2401-4900-1c5b-26cd-f98f-a853-bfb6-4ffc.ngrok-free.app/";
	const endpoint = `api/questions/videos/${videoId}`;

	const res = await fetch(`${baseURL}${endpoint}`, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			"ngrok-skip-browser-warning": "69420",
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
	*/
}
