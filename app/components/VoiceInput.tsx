import React, { useCallback, useEffect, useState } from "react";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import { speechSDKManager } from "@/utils/SpeechSDKManager";
import { speakerManager } from "@/utils/SpeakerManager";


interface VoiceInputProps {
	onSpeechRecognized: (text: string) => void;
	isWorking: boolean;
	setIsWorking: (isWorking: boolean) => void;
	isSpeaking: boolean;
}

// Extended type for SpeechRecognizer with isDisposing flag
interface ExtendedSpeechRecognizer extends SpeechSDK.SpeechRecognizer {
	isDisposing: boolean;
}

const VoiceInput: React.FC<VoiceInputProps> = ({
	onSpeechRecognized,
	isWorking: isWorking,
	setIsWorking: setIsWorking,
	isSpeaking: isSpeaking,
}) => {
	const [recognizer, setRecognizer] =
		useState<ExtendedSpeechRecognizer | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isEnrolled, setIsEnrolled] = useState<boolean>(true);

	// Initialize the speech recognizer
	const initializeRecognizer = useCallback(() => {
		console.log("Initializing speech recognizer");
		// Check if the browser supports the required APIs
		if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
			throw new Error("Browser does not support audio input");
		}
		try {
			// Create the audio configuration for the microphone
			const audioConfig =
				SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();

			// Create the speech recognizer using the manager
			const newRecognizer = speechSDKManager.createSpeechRecognizer(
				audioConfig
			) as ExtendedSpeechRecognizer;

			// Add a property to track if the recognizer is being disposed
			newRecognizer.isDisposing = false;

			// Set up event handlers
			newRecognizer.recognized = (_, event) => {
				console.log("Speech recognized:", event.result.text);
				if (
					event.result.reason ===
					SpeechSDK.ResultReason.RecognizedSpeech
				) {
					const recognizedText = event.result.text.trim();
					if (recognizedText) {
						// Verify the speaker if enrolled
						if (isEnrolled) {
							speakerManager
								.identifySpeaker(audioConfig)
								.then((isValidSpeaker) => {
									if (isValidSpeaker) {
										onSpeechRecognized(recognizedText);
									} else {
										console.warn("Speaker not recognized");
									}
								})
								.catch((error) => {
									console.error(
										"Error identifying speaker:",
										error
									);
									// Default to accepting the input in case of error
									onSpeechRecognized(recognizedText);
								});
						} else {
							// If no speaker profile is enrolled, accept all input
							onSpeechRecognized(recognizedText);
						}
					}
				}
			};

			newRecognizer.canceled = (_, event) => {
				if (event.reason === SpeechSDK.CancellationReason.Error) {
					setError(`Speech recognition error: ${event.errorDetails}`);
				}
				setIsWorking(false);
			};

			setRecognizer(newRecognizer);
			setError(null);
		} catch (err) {
			console.error("Error initializing speech recognizer:", err);
			setError(
				`Failed to initialize speech recognition: ${
					err instanceof Error ? err.message : String(err)
				}`
			);
			setIsWorking(false);
		}
	}, [onSpeechRecognized, setIsWorking, isEnrolled]);

	// Start or stop the speech recognition based on isListening
	useEffect(() => {
		if (!recognizer) {
			if (isWorking) {
				initializeRecognizer();
				console.log("Recognizer not initialized, initializing now");
			}
			return;
		}

		if (isWorking && !isSpeaking) {
			recognizer.startContinuousRecognitionAsync(
				() => console.log("Speech recognition started"),
				(error) => {
					console.error("Error starting speech recognition:", error);
					setError(`Error starting speech recognition: ${error}`);
					setIsWorking(false);
				}
			);
		} else {
			if (!recognizer.isDisposing) {
				recognizer.isDisposing = true;
				recognizer.stopContinuousRecognitionAsync(
					() => {
						console.log("Speech recognition stopped");
						recognizer.isDisposing = false;
					},
					(error) => {
						console.error(
							"Error stopping speech recognition:",
							error
						);
						recognizer.isDisposing = false;
					}
				);
			}
		}

		// Cleanup function
		return () => {
			if (recognizer) {
				if (!recognizer.isDisposing) {
					recognizer.isDisposing = true;
					recognizer.stopContinuousRecognitionAsync(
						() => {
							console.log("Speech recognition stopped (cleanup)");
							// Properly dispose of the recognizer when component unmounts
							recognizer.close();
							setRecognizer(null);
						},
						(error) => {
							console.error(
								"Error stopping speech recognition (cleanup):",
								error
							);
							// Still try to close even if stopping failed
							recognizer.close();
							setRecognizer(null);
						}
					);
				} else {
					// If already disposing, just close it directly
					console.log("Recognizer already disposing, Ignoring it");
					// console.log('Recognizer already disposing, closing directly');
					// recognizer.close();
					// setRecognizer(null);
				}
			}
		};
	}, [recognizer, isWorking, initializeRecognizer, setIsWorking]);

	// Check if a speaker profile is enrolled
	useEffect(() => {
		// setIsEnrolled(speakerManager.isProfileEnrolled());
		// By default, enroll the speaker profile
		setIsEnrolled(true);
	}, []);

	// Enroll the speaker profile
	// const enrollSpeaker = async () => {
	//   console.log('Enrolling speaker is not working yet');
	// try {
	//   console.log('Enrolling speaker');
	//   // Create the audio configuration for the microphone
	//   const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
	//   console.log('Audio config:', audioConfig);
	//   // Create a new speaker profile if not already created
	//   if (!speakerManager.isProfileEnrolled()) {
	//     console.log('Creating new speaker profile');
	//     await speakerManager.createProfile();
	//     await speakerManager.enrollProfile(audioConfig);
	//     setIsEnrolled(true);
	//   }
	//   console.log('Speaker profile enrolled');
	// } catch (err) {
	//   console.log('Failed to enroll speaker', err)
	//   setError(`Failed to enroll speaker: ${err instanceof Error ? err.message : String(err)}`);
	// }
	// };

	// Reset the speaker profile
	// const resetSpeaker = async () => {
	//   try {
	//     await speakerManager.resetProfile();
	//     setIsEnrolled(false);
	//   } catch (err) {
	//     setError(`Failed to reset speaker: ${err instanceof Error ? err.message : String(err)}`);
	//   }
	// };

	function stopAsking() {
		setIsWorking(false);
	}

	function startAsking() {
		setIsWorking(true);
	}

	return (
		<div className='voice-input'>
			<div className='controls'>
				<button
					onClick={() => (isWorking ? stopAsking() : startAsking())}
					className={`mic-button ${isWorking ? "active" : ""}`}
				>
					{isWorking ? "Stop" : "Ask"}
				</button>
				<div className='status-indicator'>
					{isSpeaking ? (
						<div className='speaking-animation'>
							<div className='speaking-dot'></div>
							<div className='speaking-dot'></div>
							<div className='speaking-dot'></div>
							<span>Speaking...</span>
						</div>
					) : (
						"🔇"
					)}
					{/* Remove the current spoken text display since we now have word-level highlighting */}
				</div>
			</div>

			{error && <div className='error-message'>{error}</div>}

			<div className='status-indicator'>
				{isWorking ? "Listening..." : "Not listening"}
			</div>
		</div>
	);
};

export default VoiceInput;
