"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import {Mic, MicOff} from "lucide-react";
import VoiceInput from "../components/VoiceInput";
import AIResponseHandler from "./AIResponseHandler";

interface AIResponseBoxProps {
    userInput: string;
    setUserInput: (userInput: string) => void;
    response: string;
    isTyping: boolean;
    onComplete: () => void;
}

export default function AIResponseBox({userInput, setUserInput, response, isTyping, onComplete}: AIResponseBoxProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isWorking, setIsWorking] = useState(false);
    const [displayedResponse, setDisplayedResponse] = useState("");
    const [responseIndex, setResponseIndex] = useState(0);

    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!isTyping && response && responseIndex < response.length) {
            const timer = setTimeout(() => {
                setDisplayedResponse((prev) => prev + response[responseIndex]);
                setResponseIndex((prev) => prev + 1);
            }, 30);
            return () => clearTimeout(timer);
        } else if (!isTyping && responseIndex >= response.length && response.length > 0) {
            onComplete();
        }
    }, [responseIndex, response, isTyping]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } else {
            setRecordingTime(0);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const handleMicClick = () => {
        setIsRecording((prev) => !prev);
    };

    const handleSpeechRecognized = useCallback((text: string) => {
        setUserInput(text);
        setDisplayedResponse("");
        setResponseIndex(0);
        setIsRecording(false);
    }, []);

    return (
        <div className='transform transition-all duration-500 ease-out animate-in slide-in-from-bottom-4'>

            {(
                <div className='mt-4'>
                    <AIResponseHandler
                        userInput={userInput}
                        isWorking={isWorking}
                        setIsWorking={setIsWorking}
                        onResponseStart={() => setIsWorking(true)}
                        onResponseEnd={() => setIsWorking(false)}
                        setIsSpeaking={setIsSpeaking}
                        isSpeaking={isSpeaking}
                    />

                    {isSpeaking && (
                        <div className='mt-4 text-center text-sm text-purple-600 dark:text-purple-300 animate-pulse'>
                            Guruji is speaking...
                        </div>
                    )}
                </div>
            )}

            {isRecording && (
                <VoiceInput
                    onSpeechRecognized={handleSpeechRecognized}
                    isWorking={isRecording}
                    setIsWorking={setIsRecording}
                    isSpeaking={isSpeaking}
                />
            )}
        </div>
    );
}
