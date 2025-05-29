import OpenAI from "openai";
import type { VideoMetadata } from "../components/AIResponseHandler.tsx";


import { Message } from "../../utils/ContextManager";
import { config } from "../../utils/config";


// Interface for streaming handlers
interface StreamHandlers {
	onNotesUpdate?: (notes: string) => void;
	onVoiceoverUpdate?: (voiceover: string) => void;
	onComplete?: (finalResponse: { notes: string; voiceover: string }) => void;
	onError?: (error: Error) => void;
}

// Class to manage OpenAI client and API calls
class OpenAIAgent {
	private client: OpenAI | null = null;

	// Initialize the OpenAI client
	initialize(): OpenAI {
		if (!this.client && config.openai.apiKey) {
			try {
				this.client = new OpenAI({
					apiKey: config.openai.apiKey,
					baseURL: config.openai.baseURL,
					dangerouslyAllowBrowser: true, // Required for browser usage
				});
			} catch (err) {
				throw new Error(
					`Failed to initialize OpenAI client: ${
						err instanceof Error ? err.message : String(err)
					}`
				);
			}
		}

		if (!this.client) {
			throw new Error("OpenAI client not initialized");
		}

		return this.client;
	}

	// Get the OpenAI client (initialize if not already done)
	getClient(): OpenAI {
		if (!this.client) {
			return this.initialize();
		}
		return this.client;
	}

	// Generate streaming responses with two synchronized agents
	async generateSynchronizedAgents(
		messages: Message[],
		handlers: StreamHandlers,
		videoDetails: VideoMetadata
	): Promise<void> {
		const client = this.getClient();

		// Create a coordination context to share between the two agents
		const coordinationContext = {
			prompt: messages[messages.length - 1]?.content || "",
			notesContent: "",
			voiceoverContent: "",
		};

		try {
			// Create system messages for each agent
			const notesSystemMessage = {
				role: "system",
				content: `
You are a 'Teacher-Ans-Writer-Agent' class notes writer for Indian students from Classes 6 to 12 and early college level, write notes in english.

🎯 Goal: Create clean, well-structured, exam-oriented notes in **Markdown**.

📝 Guidelines:
- Use simple English.
- Match tone and depth to the class level and subject.
- Use:
  - Headings ('#', '##', etc.)
  - Bullet points
  - Highlight **key terms**, **definitions**, **examples**, and **formulas**
- Use **rehype-katex** + **remark-math** syntax for math:
  - Inline math: '$F = ma$'
  - Block math: '$$F = ma$$'
  - **Keep Hindi outside math** delimiters:
    ✅ ;गति का सूत्र: $v = u + at$'
- **Avoid duplicating spoken explanations.**

📌 Your notes should:
- Cover only essential content for the class level and exam.
- Be useful as revision material.
- Include visual elements in Markdown (diagrams, links if needed).
`,
			};

			const speakerSystemMessage = {
				role: "system",
				content: `
                You are 'Teacher-Ans-Explainer-Agent' a highly engaging Indian teacher, like Alakh Pandey (Physics Wallah), teaching a live online class.

🎤 Voice: Use **Azure hi-IN-MadhurNeural**  
🗣️ Language: **Natural Hinglish**  
👥 Audience: Indian students (Class ${videoDetails.sClass}, Subject: ${videoDetails.subject}, Exam: ${videoDetails.exam})

🎯 Goal: Explain only what's **important to understand**, not already written in notes.

🎙️ Style:
- Speak like a relatable YouTuber.
- Mix Hindi and English smoothly.
- Keep tone expressive, motivational, and student-friendly.
- Short, clear sentences.
- Explain formulas conversationally:
  ✅ "Yaani force equals mass into acceleration — F equals to M A. Jaise agar aap zyada force lagate ho, acceleration bhi badhega"

💬 Techniques:
- Use analogies, real-world examples, and stories.
- Repeat tough ideas with variations, not repetition.
- Don't just read formulas — **speak them as you'd say them aloud**.
  ✅ ❌ "$a = F/m$"  
     ✅ "Acceleration equals force divided by mass — yaani a equals F by m"

🚫 Don't:
- Repeat the markdown notes.
- Don't add markdown syntax.
- Don't add $ or any special characters. make them in speakable text 
- Be too formal or robotic.
- Say "as written above" or refer to notes.

🧠 Your voice is always active — initiate transitions, summaries, and prompts naturally like a live teacher would.
                
                `,
			};

			console.log("writerStreamPromise", notesSystemMessage);
			// Start both streams in parallel
			const writerStreamPromise = client.chat.completions.create({
				model: config.openai.model,
				messages: [notesSystemMessage as Message, ...messages],
				temperature: 0.7,
				max_tokens: 800,
				stream: true,
			});

			console.log("speakerStreamPromise", speakerSystemMessage);
			const speakerStreamPromise = client.chat.completions.create({
				model: config.openai.model,
				messages: [speakerSystemMessage as Message, ...messages],
				temperature: 0.7,
				max_tokens: 800,
				stream: true,
			});

			// Create functions to process each stream
			const processNotesStream = async (): Promise<void> => {
				try {
					const stream = await writerStreamPromise;
					for await (const chunk of stream) {
						const content = chunk.choices[0]?.delta?.content || "";
						if (content) {
							coordinationContext.notesContent += content;
							if (handlers.onNotesUpdate) {
								handlers.onNotesUpdate(
									coordinationContext.notesContent
								);
							}
						}
					}
				} catch (error) {
					console.error("Error in notes stream:", error);
					if (handlers.onError) {
						handlers.onError(
							error instanceof Error
								? error
								: new Error(String(error))
						);
					}
					throw error;
				}
			};

			const processVoiceoverStream = async (): Promise<void> => {
				try {
					const stream = await speakerStreamPromise;
					for await (const chunk of stream) {
						const content = chunk.choices[0]?.delta?.content || "";
						if (content) {
							coordinationContext.voiceoverContent += content;
							if (handlers.onVoiceoverUpdate) {
								handlers.onVoiceoverUpdate(
									coordinationContext.voiceoverContent
								);
							}
						}
					}
				} catch (error) {
					console.error("Error in voiceover stream:", error);
					if (handlers.onError) {
						handlers.onError(
							error instanceof Error
								? error
								: new Error(String(error))
						);
					}
					throw error;
				}
			};

			// Process both streams in parallel and wait for both to complete
			await Promise.all([processNotesStream(), processVoiceoverStream()]);

			// Call the onComplete handler with the final response
			if (handlers.onComplete) {
				handlers.onComplete({
					notes: coordinationContext.notesContent,
					voiceover: coordinationContext.voiceoverContent,
				});
				console.log("onComplete", {
					notes: coordinationContext.notesContent,
					voiceover: coordinationContext.voiceoverContent,
				});
			}
		} catch (error) {
			console.error("Error generating synchronized agents:", error);
			if (handlers.onError) {
				handlers.onError(
					error instanceof Error ? error : new Error(String(error))
				);
			}
		}
	}
}

// Create and export a singleton instance
export const openAIAgent = new OpenAIAgent();
