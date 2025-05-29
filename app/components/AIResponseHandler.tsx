import React, { useEffect, useRef, useState } from "react";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";



import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { contextManager } from "@/utils/ContextManager";
import { config } from "@/utils/config";
import { speechSDKManager } from "@/utils/SpeechSDKManager";
import { openAIAgent } from "../ai/OpenAIAgents";
import { fetchVideoContext, VideoContextResponse } from "../fetcher/fetchVideoContext";
import {sampleVideos} from "@/app/data/sampleVideos";


export interface VideoMetadata {
	sClass: string;
	subject: string;
	exam: string;
}

const mockVideoMeataData: VideoMetadata = {
	sClass: "10th",
	subject: "Science",
	exam: "NCERT Board",
};

interface AIResponseHandlerProps {
	userInput: string | null;
	isWorking: boolean;
	setIsWorking: (isWorking: boolean) => void;
	onResponseStart: () => void;
	onResponseEnd: () => void;
	setIsSpeaking: (isSpeaking: boolean) => void;
	isSpeaking: boolean;
	videoId?: string;
	videoTime?: number;
}

const AIResponseHandler: React.FC<AIResponseHandlerProps> = ({
	userInput,
	onResponseStart,
	isWorking,
	setIsWorking,
	onResponseEnd,
	isSpeaking,
	setIsSpeaking,
	videoId,
	videoTime,
}) => {
	const [response, setResponse] = useState<string>("");
	// Buffer for collecting text until a complete sentence is detected
	const [sentenceBuffer, setSentenceBuffer] = useState<string>("");
	// Queue for storing complete sentences waiting to be spoken
	const [speechQueue, setSpeechQueue] = useState<string[]>([]);
	// Ref to track the current state of the speech queue
	const speechQueueRef = useRef<string[]>([]);
	// Flag to track if we're currently processing the speech queue
	const [isProcessingQueue, setIsProcessingQueue] = useState<boolean>(false);

	// Update the ref whenever the speech queue state changes
	useEffect(() => {
		speechQueueRef.current = speechQueue;
		console.log("Speech queue updated, new length:", speechQueue.length);
	}, [speechQueue]);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	// const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
	const [audioEnabled, setAudioEnabled] = useState<boolean>(false);

	const synthesizer = useRef<SpeechSDK.SpeechSynthesizer | null>(null);

	// Current video ID and duration - these come from props or use defaults
	const currentVideoId = useRef<string>(videoId || sampleVideos[0].id);
	const currentVideoTime = useRef<number>(videoTime || 0);

	// Update refs when props change and store in localStorage
	useEffect(() => {
		if (videoId) {
			currentVideoId.current = videoId;
			try {
				localStorage.setItem('currentVideoId', videoId);
			} catch (error) {
				console.warn('Failed to store currentVideoId in localStorage:', error);
			}
		}
		if (videoTime !== undefined) {
			currentVideoTime.current = videoTime;
			try {
				localStorage.setItem('currentVideoTime', videoTime.toString());
			} catch (error) {
				console.warn('Failed to store currentVideoTime in localStorage:', error);
			}
		}
	}, [videoId, videoTime]);

	// Process user input and generate AI response
	useEffect(() => {
		if (!userInput) {
			console.log("No user input, skipping response generation");
			return;
		}

		const generateResponse = async () => {
			try {
				setIsLoading(true);
				setError(null);
				onResponseStart();

				// Get video context information from the API
				// This fetches relevant information about the video including subject, class, exam,
				// and transcripts based on the current video ID and user's query
				let videoContextData: VideoContextResponse;
				try {
 				// Get values from localStorage or use current refs as fallback
				let storedVideoId = currentVideoId.current;
				let storedVideoTime = `${currentVideoTime.current}`;

				try {
					const localStorageVideoId = localStorage.getItem('currentVideoId');
					const localStorageVideoTime = localStorage.getItem('currentVideoTime');

					if (localStorageVideoId) {
						storedVideoId = localStorageVideoId;
					}

					if (localStorageVideoTime) {
						storedVideoTime = localStorageVideoTime;
					}
				} catch (error) {
					console.warn('Failed to retrieve values from localStorage:', error);
				}

				const requestVideoContext = {
					videoId: storedVideoId,
					queryText: userInput,
					duration: storedVideoTime
				}
					console.log("Fetching video context data for video:", requestVideoContext);
					videoContextData = await fetchVideoContext(requestVideoContext);
					console.log("Video context data fetched successfully:", videoContextData);
				} catch (error) {
					console.error("Error fetching video context:", error);
					// Fallback to mock data if fetching fails
					// In a production environment, you might want to show an error message to the user
					videoContextData = {
						videoId: currentVideoId.current,
						subject: mockVideoMeataData.subject,
						exam: mockVideoMeataData.exam,
						class: mockVideoMeataData.sClass,
						topicTranscripts: [],
						contextTranscripts: []
					};
				}

				// Find the current transcript based on the video's current playback time
				// This helps identify what topic is currently being taught in the video
				const currentTranscript = videoContextData.contextTranscripts.find(
					transcript =>
						currentVideoTime.current >= transcript.start &&
						currentVideoTime.current < (transcript.start + transcript.duration)
				);

				console.log("Current transcript:", currentTranscript);

				// Create enhanced video metadata with context information
				// This includes not just basic info (class, subject, exam) but also
				// current time, topic, and content from the video
				const videoMetadata = {
					sClass: videoContextData.class,
					subject: videoContextData.subject,
					exam: videoContextData.exam,
					currentTime: currentVideoTime.current,
					currentTopic: currentTranscript?.topic || "Unknown topic",
					currentContent: currentTranscript?.text || "",
					contextTranscripts: videoContextData.contextTranscripts
				};

				// Add enhanced system message to context
				// This uses the config.systemMessage function with our enhanced videoMetadata
				// which now includes video context information (current time, topic, content)
				// The system message will help the AI understand the video context and provide
				// more relevant and helpful responses to the student's questions
				contextManager.addPersonalisedSystemMessage(
					config.systemMessage(videoMetadata).trim()
				);

				// Add user message to context
				contextManager.addUserMessage(userInput);

				// Get the conversation history
				const messages = contextManager.getMessages();

				setResponse("");

				// Use streaming API to get real-time updates
				await openAIAgent.generateSynchronizedAgents(
					messages,
					{
						// Update notes in real-time
						onNotesUpdate: (notes) => {
							console.log("Notes updated:", notes);
							setResponse(notes);
						},
						// Update voiceover in real-time
						onVoiceoverUpdate: (voiceover) => {
							// Process the updated voiceover text for sentence detection and speech
							// processVoiceoverUpdate(voiceover);
						},
						// Handle completion
						onComplete: (finalResponse) => {
							console.log(
								"Final response received:",
								finalResponse
							);

							// Format the final response for context storage
							const formattedResponse = `---HINGLISH_EXPLANATION---\n${finalResponse.voiceover}\n\n---ENGLISH_NOTES---\n${finalResponse.notes}`;

							// Add AI response to context (store the full response for context)
							contextManager.addAssistantMessage(
								formattedResponse
							);

							speakResponse(finalResponse.voiceover);
							setIsLoading(false);

							// Process any remaining text in the buffer
							// if (sentenceBuffer.trim() !== '') {
							//     // If the buffer doesn't end with a sentence-ending punctuation, add one
							//     let finalBuffer = sentenceBuffer;
							//     if (!finalBuffer.match(/[.!?]$/)) {
							//         finalBuffer += '.';
							//     }
							//
							//     // Add the final buffer to the queue
							//     setSpeechQueue(prevQueue => [...prevQueue, finalBuffer]);
							//
							//     // Clear the buffer
							//     setSentenceBuffer('');
							//
							//     // Start processing the queue if not already processing
							//     if (!isProcessingQueue && !isSpeaking) {
							//         processNextInQueue();
							//     }
							// } else if (!isSpeaking && speechQueueRef.current.length === 0) {
							//     // If not speaking and no items in the queue, call onResponseEnd
							//     onResponseEnd();
							// }
						},
						// Handle errors
						onError: (error: any) => {
							setError(
								`Failed to generate response: ${error.message}`
							);
							setIsLoading(false);
							onResponseEnd();
						},
					},
					mockVideoMeataData
				);
			} catch (err) {
				setError(
					`Failed to generate response: ${
						err instanceof Error ? err.message : String(err)
					}`
				);
				setIsLoading(false);
				onResponseEnd();
			}
		};

		generateResponse().then((r) => console.log("Response generated:", r));
	}, [userInput]);

	// Clean up speech synthesis when isWorking changes or component unmounts
	useEffect(() => {
		if (!isWorking) {
			console.log(
				"isWorking changed to false, stopping any ongoing speech"
			);
			stopSpeaking();
		}

		// Clean up function to ensure speech is stopped when component unmounts
		return () => {
			console.log("Component cleanup, stopping any ongoing speech");
			if (synthesizer.current) {
				synthesizer.current.close();
				synthesizer.current = null;
				console.log("Synthesizer closed during cleanup");
			}
		};
	}, [isWorking]);

	// Function to enable audio
	const enableAudio = () => {
		console.log("Enabling audio...");
		setAudioEnabled(true);

		// Create an AudioContext to ensure audio is enabled
		if (typeof window !== "undefined") {
			try {
				const AudioContextClass =
					window.AudioContext ||
					(
						window as unknown as {
							webkitAudioContext: typeof AudioContext;
						}
					).webkitAudioContext;

				if (AudioContextClass) {
					const audioContext = new AudioContextClass();
					audioContext
						.resume()
						.then(() => {
							console.log("AudioContext resumed successfully");
						})
						.catch((err) => {
							console.error(
								"Failed to resume AudioContext:",
								err
							);
						});
				}
			} catch (err) {
				console.error("Error creating AudioContext:", err);
			}
		}
	};

	// Process voiceover updates to detect complete sentences and queue them for speech
	const processVoiceoverUpdate = (voiceover: string) => {
		// Get the new content that was added since the last update
		const newContent = voiceover.substring(sentenceBuffer.length);

		// Add the new content to the buffer
		const updatedBuffer = sentenceBuffer + newContent;
		setSentenceBuffer(updatedBuffer);

		// Check if the buffer contains any complete sentences (ending with ., ?, or !)
		const sentenceRegex = /([^.!?|]+[.!?|]+)/g;
		const sentences = updatedBuffer.match(sentenceRegex);

		if (sentences && sentences.length > 0) {
			// Calculate what remains in the buffer after extracting complete sentences
			const allSentencesText = sentences.join("");
			const remainingText = updatedBuffer.substring(
				allSentencesText.length
			);

			// Update the buffer with the remaining text
			setSentenceBuffer(remainingText);

			// Add complete sentences to the queue
			setSpeechQueue((prev) => {
				return [...prev, ...sentences];
			});

			// Start processing the queue if not already processing
			if (!isProcessingQueue && !isSpeaking) {
				processNextInQueue();
			}
		}
	};

	// Process the next sentence in the queue
	const processNextInQueue = () => {
		// Use the ref value to ensure we have the most up-to-date queue
		if (speechQueueRef.current.length === 0) {
			setIsProcessingQueue(false);
			console.log("Speech queue empty, stopping speech");
			return;
		}

		setIsProcessingQueue(true);

		// Get the next sentence from the queue
		const nextSentence = speechQueueRef.current[0];

		// Remove the sentence from the queue
		setSpeechQueue((prevQueue) => prevQueue.slice(1));

		// Speak the sentence
		// speakResponseMock(nextSentence)
		// speakResponse(nextSentence);
	};

	function speakResponseMock(text: string) {
		console.log("Speech: Speak next sentence:", text);
		if (!text || text.trim() === "") {
			console.warn(
				"Empty text provided to speakResponse, skipping speech synthesis"
			);
			processNextInQueue(); // Process next in queue even if this one is empty
			return;
		}
		setIsSpeaking(true);
		processNextInQueue();
	}

	// Function to speak the AI response
	const speakResponse = (text: string) => {
		if (!text || text.trim() === "") {
			console.warn(
				"Empty text provided to speakResponse, skipping speech synthesis"
			);
			processNextInQueue(); // Process next in queue even if this one is empty
			return;
		}

		console.log("Speak response:", text);

		try {
			onResponseStart();
			console.log("Speak response, onResponseStart called");

			// Re-initialize synthesizer if it was closed
			if (!synthesizer.current) {
				console.log("Reinitializing synthesizer...");
				const audioConfig =
					SpeechSDK.AudioConfig.fromDefaultSpeakerOutput();
				synthesizer.current =
					speechSDKManager.createSpeechSynthesizer(audioConfig);
				console.log("Synthesizer reinitialized");
			}

			// If audio is not enabled, enable it
			if (!audioEnabled) {
				enableAudio();
			}

			// Set up synthesizing event for streaming audio
			synthesizer.current.synthesizing = (_s, e) => {
				setIsSpeaking(true);
				console.log("Synthesizing/Streaming audio...", e);
			};

			// Set up synthesis completed event
			synthesizer.current.synthesisCompleted = (_s, e) => {
				console.log("Speech synthesis completed event:", e);

				// If there are no more items in the queue and no more text in the buffer
				if (
					speechQueueRef.current.length === 0 &&
					sentenceBuffer.trim() === ""
				) {
					setIsSpeaking(false);
					setIsProcessingQueue(false);
					onResponseEnd();
				}
			};

			console.log("Speak response, about to call speakTextAsync");
			// Print the text that's being spoken
			console.log("Speaking text:", text);

			// Set speaking state to true
			setIsSpeaking(true);

			// Process text to ensure it's suitable for speech synthesis
			// For text-to-speech, we use the standard approach as our sentences are already chunked
			synthesizer.current.speakTextAsync(
				text,
				(result) => {
					console.log(
						"Speech synthesis completed successfully",
						result
					);
					// Process the next sentence in the queue
					processNextInQueue();
				},
				(error) => {
					console.error("Speech synthesis error in callback:", error);
					setError(`Speech synthesis error: ${error}`);
					setIsSpeaking(false);

					// Continue processing the queue even if there's an error
					processNextInQueue();
				}
			);

			console.log("speakTextAsync called successfully");
		} catch (err) {
			console.error("Error speaking response:", err);
			setError(
				`Failed to speak response: ${
					err instanceof Error ? err.message : String(err)
				}`
			);
			setIsSpeaking(false);

			// Continue processing the queue even if there's an error
			processNextInQueue();
		}
	};

	// Function to stop speaking
	const stopSpeaking = () => {
		console.log("Stop speaking");
		if (synthesizer.current) {
			try {
				// Stop any ongoing speech synthesis
				synthesizer.current.close();
				synthesizer.current = null;
				console.log("Synthesizer closed successfully");
			} catch (err) {
				console.error("Error closing synthesizer:", err);
			} finally {
				// Clear the speech queue and sentence buffer
				setSpeechQueue([]);
				setSentenceBuffer("");
				setIsProcessingQueue(false);

				// Ensure state is reset even if there's an error
				setIsWorking(false);
				setIsSpeaking(false);
				onResponseEnd();
				console.log("Speaking state reset");
			}
		} else {
			console.log("No active synthesizer to stop");
			// Clear the speech queue and sentence buffer
			setSpeechQueue([]);
			setSentenceBuffer("");
			setIsProcessingQueue(false);
			setIsWorking(false);
			setIsSpeaking(false);
		}
	};

	// Function to clear conversation context
	const clearContext = () => {
		contextManager.clearContext();
		setResponse("");
	};

	return (
		<div className='ai-response-handler'>
			<div className='response-container'>
				{isLoading ? (
					<div className='loading'>Generating response...</div>
				) : (
					<div className='response-text'>
						<ReactMarkdown
							remarkPlugins={[remarkMath]}
							rehypePlugins={[rehypeKatex]}
						>
							{response}
						</ReactMarkdown>
					</div>
				)}
			</div>

			<div className='controls'>
				{isSpeaking && (
					<button onClick={stopSpeaking} className='stop-button'>
						Stop Speaking
					</button>
				)}

				<button onClick={clearContext} className='clear-button'>
					Clear Conversation
				</button>
			</div>

			{error && <div className='error-message'>{error}</div>}
		</div>
	);
};

export default AIResponseHandler;
