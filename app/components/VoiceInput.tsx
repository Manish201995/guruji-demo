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

interface ExtendedSpeechRecognizer extends SpeechSDK.SpeechRecognizer {
  isDisposing: boolean;
}

const VoiceInput: React.FC<VoiceInputProps> = ({
  onSpeechRecognized,
  isWorking,
  setIsWorking,
  isSpeaking,
}) => {
  const [recognizer, setRecognizer] = useState<ExtendedSpeechRecognizer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(true);

  const cleanupRecognizer = useCallback(() => {
    if (recognizer) {
      try {
        if (!recognizer.isDisposing && typeof recognizer.close === "function") {
          recognizer.isDisposing = true;
          recognizer.stopContinuousRecognitionAsync(
            () => {
              try {
                recognizer.close();
              } catch (e) {
                console.warn("Recognizer already disposed (in success stop)");
              }
              setRecognizer(null);
              recognizer.isDisposing = false;
            },
            (error) => {
              console.error("Error stopping speech recognition (cleanup):", error);
              try {
                recognizer.close();
              } catch (e) {
                console.warn("Recognizer already disposed (in error stop)");
              }
              setRecognizer(null);
              recognizer.isDisposing = false;
            }
          );
        }
      } catch (err) {
        console.warn("Recognizer disposal failed, already disposed?");
        setRecognizer(null);
      }
    }
  }, [recognizer]);

  const initializeRecognizer = useCallback(() => {
    cleanupRecognizer();
    console.log("Initializing speech recognizer");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Browser does not support audio input");
      setIsWorking(false);
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true }).then(() => {
      let audioConfig;
      try {
        audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      } catch (err) {
        console.error("Mic init failed:", err);
        setError("Microphone initialization failed.");
        setIsWorking(false);
        return;
      }

      try {
        const newRecognizer = speechSDKManager.createSpeechRecognizer(audioConfig) as ExtendedSpeechRecognizer;
        newRecognizer.isDisposing = false;

        newRecognizer.recognized = (_, event) => {
          if (event.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
            const recognizedText = event.result.text.trim();
            if (recognizedText) {
              if (isEnrolled) {
                speakerManager.identifySpeaker(audioConfig).then((isValidSpeaker) => {
                  if (isValidSpeaker) {
                    onSpeechRecognized(recognizedText);
                  } else {
                    console.warn("Speaker not recognized");
                  }
                }).catch((error) => {
                  console.error("Error identifying speaker:", error);
                  onSpeechRecognized(recognizedText);
                });
              } else {
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

        setTimeout(() => {
          newRecognizer.startContinuousRecognitionAsync(
            () => console.log("Speech recognition started"),
            (error) => {
              console.error("Error starting speech recognition:", error);
              setError(`Error starting speech recognition: ${error}`);
              setIsWorking(false);
            }
          );
        }, 200);
      } catch (err) {
        console.error("Error creating speech recognizer:", err);
        setError("Failed to initialize recognizer.");
        setIsWorking(false);
      }
    }).catch((err) => {
      console.error("Mic access denied:", err);
      setError("Microphone access denied.");
      setIsWorking(false);
    });
  }, [onSpeechRecognized, setIsWorking, isEnrolled, cleanupRecognizer]);

 useEffect(() => {
  if (isWorking) {
    if (!recognizer) {
      initializeRecognizer();
    } else {
      try {
        // Try starting recognition only if recognizer is not being disposed
        if (!recognizer.isDisposing) {
          recognizer.startContinuousRecognitionAsync(
            () => console.log("Speech recognition started"),
            (error) => {
              console.error("Error starting speech recognition:", error);
              setError(`Error starting speech recognition: ${error}`);
              setIsWorking(false);
            }
          );
        }
      } catch (err) {
        console.warn("Recognizer already disposed at start:", err);
        setRecognizer(null);
        initializeRecognizer(); // Try again fresh
      }
    }
  } else {
    cleanupRecognizer();
  }

  return () => {
    cleanupRecognizer();
  };
}, [isWorking]);


  useEffect(() => {
    setIsEnrolled(true);
  }, []);

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
