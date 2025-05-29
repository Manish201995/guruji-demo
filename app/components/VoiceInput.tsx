"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
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
  isClosed: boolean;
}

const VoiceInput: React.FC<VoiceInputProps> = ({
  onSpeechRecognized,
  isWorking,
  setIsWorking,
  isSpeaking,
}) => {
  const recognizerRef = useRef<ExtendedSpeechRecognizer | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cleanupRecognizer = useCallback(() => {
    const recognizer = recognizerRef.current;
    if (recognizer && !recognizer.isDisposing && !recognizer.isClosed) {
      recognizer.isDisposing = true;
      recognizer.stopContinuousRecognitionAsync(
        () => {
          try {
            recognizer.close();
          } catch (err) {
            console.warn("Recognizer already disposed (stop success)");
          }
          recognizer.isClosed = true;
          recognizerRef.current = null;
        },
        (err) => {
          console.error("Error stopping recognizer (cleanup):", err);
          try {
            recognizer.close();
          } catch (e) {
            console.warn("Recognizer already disposed (stop error)");
          }
          recognizer.isClosed = true;
          recognizerRef.current = null;
        }
      );
    }
  }, []);

  const initializeRecognizer = useCallback(async () => {
    await navigator.mediaDevices.getUserMedia({ audio: true });

    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    const newRecognizer = speechSDKManager.createSpeechRecognizer(audioConfig) as ExtendedSpeechRecognizer;
    newRecognizer.isDisposing = false;
    newRecognizer.isClosed = false;

    newRecognizer.recognized = (_, event) => {
      if (event.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
        const text = event.result.text.trim();
        if (text) {
          speakerManager
            .identifySpeaker(audioConfig)
            .then((isValid) => {
              if (isValid) onSpeechRecognized(text);
              else console.warn("Unverified speaker.");
            })
            .catch(() => onSpeechRecognized(text));
        }
      }
    };

    newRecognizer.canceled = (_, event) => {
      if (event.reason === SpeechSDK.CancellationReason.Error) {
        setError(`Speech canceled: ${event.errorDetails}`);
      }
      setIsWorking(false);
    };

    recognizerRef.current = newRecognizer;

    newRecognizer.startContinuousRecognitionAsync(
      () => {
        console.log("Speech recognition started");
        setError(null);
      },
      (err) => {
        console.error("Error starting recognition:", err);
        setError("Could not start recognition");
        setIsWorking(false);
      }
    );
  }, [onSpeechRecognized, setIsWorking]);

  useEffect(() => {
    if (isWorking && !recognizerRef.current) {
      initializeRecognizer().catch((err) => {
        console.error("Init error:", err);
        setError("Failed to start microphone.");
        setIsWorking(false);
      });
    } else if (!isWorking) {
      cleanupRecognizer();
    }

    return () => {
      cleanupRecognizer();
    };
  }, [isWorking, initializeRecognizer, cleanupRecognizer]);

  return (
    <div className="voice-input">
      <div className="controls">
        <button
          onClick={() => setIsWorking(!isWorking)}
          className={`mic-button ${isWorking ? "active" : ""}`}
        >
          {isWorking ? "Stop" : "Ask"}
        </button>

        <div className="status-indicator">
          {isSpeaking ? (
            <div className="speaking-animation">
              <div className="speaking-dot"></div>
              <div className="speaking-dot"></div>
              <div className="speaking-dot"></div>
              <span>Speaking...</span>
            </div>
          ) : (
            "🔇"
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="status-indicator">
        {isWorking ? "Listening..." : "Not listening"}
      </div>
    </div>
  );
};

export default VoiceInput;
