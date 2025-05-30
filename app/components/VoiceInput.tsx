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
  const isWorkingRef = useRef(isWorking);
  const cleanupInProgressRef = useRef(false);

  // Keep isWorkingRef in sync with isWorking prop
  useEffect(() => {
    isWorkingRef.current = isWorking;
    console.log("VoiceInput: isWorking changed to:", isWorking);
  }, [isWorking]);

  const cleanupRecognizer = useCallback(() => {
    const recognizer = recognizerRef.current;
    
    if (!recognizer || cleanupInProgressRef.current) {
      console.log("VoiceInput: Cleanup skipped - no recognizer or already in progress");
      return;
    }

    console.log("VoiceInput: Starting cleanup...");
    cleanupInProgressRef.current = true;

    if (!recognizer.isDisposing && !recognizer.isClosed) {
      recognizer.isDisposing = true;
      
      try {
        recognizer.stopContinuousRecognitionAsync(
          () => {
            console.log("VoiceInput: Recognition stopped successfully");
            try {
              recognizer.close();
              recognizer.isClosed = true;
            } catch (err) {
              console.warn("VoiceInput: Error closing recognizer:", err);
            }
            recognizerRef.current = null;
            cleanupInProgressRef.current = false;
          },
          (err) => {
            console.error("VoiceInput: Error stopping recognizer:", err);
            try {
              recognizer.close();
              recognizer.isClosed = true;
            } catch (e) {
              console.warn("VoiceInput: Error closing recognizer after stop error:", e);
            }
            recognizerRef.current = null;
            cleanupInProgressRef.current = false;
          }
        );
      } catch (err) {
        console.error("VoiceInput: Error in cleanup process:", err);
        recognizerRef.current = null;
        cleanupInProgressRef.current = false;
      }
    } else {
      console.log("VoiceInput: Recognizer already disposing/closed");
      recognizerRef.current = null;
      cleanupInProgressRef.current = false;
    }
  }, []);

  const initializeRecognizer = useCallback(async () => {
    // Don't initialize if isWorking is already false
    if (!isWorkingRef.current) {
      console.log("VoiceInput: Not initializing - isWorking is false");
      return;
    }

    // Clean up any existing recognizer first
    if (recognizerRef.current) {
      console.log("VoiceInput: Cleaning up existing recognizer before initializing new one");
      cleanupRecognizer();
      // Wait a bit for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Double check after cleanup
    if (!isWorkingRef.current) {
      console.log("VoiceInput: Not initializing - isWorking became false during cleanup");
      return;
    }

    try {
      console.log("VoiceInput: Initializing speech recognizer...");
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      const newRecognizer = speechSDKManager.createSpeechRecognizer(audioConfig) as ExtendedSpeechRecognizer;
      newRecognizer.isDisposing = false;
      newRecognizer.isClosed = false;

      newRecognizer.recognized = (_, event) => {
        if (event.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
          const text = event.result.text.trim();
          console.log("VoiceInput: Speech recognized:", text);
          
          if (text && isWorkingRef.current) {
            speakerManager
              .identifySpeaker(audioConfig)
              .then((isValid) => {
                if (isValid && isWorkingRef.current) {
                  console.log("VoiceInput: Valid speaker, processing speech");
                  onSpeechRecognized(text);
                } else if (!isWorkingRef.current) {
                  console.warn("VoiceInput: Speech recognized but not working anymore");
                } else {
                  console.warn("VoiceInput: Unverified speaker");
                }
              })
              .catch(() => {
                if (isWorkingRef.current) {
                  console.log("VoiceInput: Speaker verification failed, but processing anyway");
                  onSpeechRecognized(text);
                }
              });
          }
        }
      };

      newRecognizer.canceled = (_, event) => {
        console.log("VoiceInput: Recognition canceled:", event.reason);
        if (event.reason === SpeechSDK.CancellationReason.Error) {
          setError(`Speech canceled: ${event.errorDetails}`);
        }
        setIsWorking(false);
      };

      newRecognizer.sessionStopped = () => {
        console.log("VoiceInput: Speech recognition session stopped");
        setIsWorking(false);
      };

      recognizerRef.current = newRecognizer;

      // Final check before starting
      if (!isWorkingRef.current) {
        console.log("VoiceInput: Not starting - isWorking became false");
        cleanupRecognizer();
        return;
      }

      console.log("VoiceInput: Starting continuous recognition...");
      newRecognizer.startContinuousRecognitionAsync(
        () => {
          console.log("VoiceInput: Speech recognition started successfully");
          setError(null);
        },
        (err) => {
          console.error("VoiceInput: Error starting recognition:", err);
          setError("Could not start recognition");
          setIsWorking(false);
        }
      );
    } catch (err) {
      console.error("VoiceInput: Error in initializeRecognizer:", err);
      setError("Failed to initialize speech recognition");
      setIsWorking(false);
    }
  }, [onSpeechRecognized, setIsWorking, cleanupRecognizer]);

  // Main effect that responds to isWorking changes
  useEffect(() => {
    console.log("VoiceInput: isWorking effect triggered:", isWorking);
    
    if (isWorking && !recognizerRef.current && !cleanupInProgressRef.current) {
      console.log("VoiceInput: Starting speech recognition...");
      initializeRecognizer().catch((err) => {
        console.error("VoiceInput: Init error:", err);
        setError("Failed to start microphone");
        setIsWorking(false);
      });
    } else if (!isWorking && recognizerRef.current) {
      console.log("VoiceInput: Stopping speech recognition...");
      cleanupRecognizer();
    }
  }, [isWorking, initializeRecognizer, cleanupRecognizer]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      console.log("VoiceInput: Component unmounting, cleaning up...");
      isWorkingRef.current = false;
      cleanupRecognizer();
    };
  }, [cleanupRecognizer]);

  // Don't render any visible UI - this is a background component
  if (!isWorking) {
    return null;
  }

  return (
    <div className="voice-input" style={{ display: 'none' }}>
      {/* Hidden component - all functionality is handled in effects */}
      {error && (
        <div className="error-message" style={{ display: 'none' }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default VoiceInput;
