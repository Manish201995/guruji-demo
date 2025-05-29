"use client"

import { useState } from "react"
import YouTubePlayer from "./components/YouTubePlayer"
import MCQQuiz from "./components/MCQQuiz"
import AIInputBox from "./components/AIInputBox"
import AIResponseBox from "./components/AIResponseBox"

type AppState = "initial" | "listening" | "responding" | "complete"

export default function Home() {
  const [appState, setAppState] = useState<AppState>("initial")
  const [userInput, setUserInput] = useState("")
  const [aiResponse, setAiResponse] = useState("")

  const handleAskGuruji = () => {
    setAppState("listening")
  }

  const handleInputComplete = (input: string) => {
    setUserInput(input)
    setAppState("responding")

    // Simulate AI processing time
    setTimeout(() => {
      setAiResponse(
        `Great question! Based on the video content, here's what I understand: "${input}". This relates to the key concepts we just covered. Let me explain further...`,
      )
      setAppState("complete")
    }, 2000)
  }

  const handleReset = () => {
  // 🛑 Stop Guruji from speaking 
  console.log("Resetting Guruji...",typeof window);
  if (typeof window !== "undefined") {
    window.speechSynthesis.cancel();
  }

  setAppState("initial");
  setUserInput("");
  setAiResponse("");
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        {/* YouTube Player Section */}
        <div className="mb-8">
          <YouTubePlayer videoId="dQw4w9WgXcQ" />
        </div>

        {/* Main Content Area */}
        <div className="max-w-4xl mx-auto">
          {/* Ask Guruji Button - Initial State */}
          {appState === "initial" && (
            <div className="flex flex-col items-center justify-center py-16">
              <button
                onClick={handleAskGuruji}
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 animate-pulse"
              >
                <span className="relative z-10">Ask Guruji</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              <p className="mt-4 text-slate-600 dark:text-slate-400 text-center">
                Click to ask questions about the video content
              </p>
            </div>
          )}

          {/* AI Input Box - Listening State */}
          {(appState === "listening" || appState === "responding") && (
            <div className="mb-8">
              <AIInputBox isListening={appState === "listening"} onInputComplete={handleInputComplete} />
            </div>
          )}

          {/* AI Response Box - Responding/Complete State */}
          {(appState === "responding" || appState === "complete") && (
            <div className="mb-8">
              <AIResponseBox
                response={aiResponse}
                isTyping={appState === "responding"}
                onComplete={() => setAppState("complete")}
              />
            </div>
          )}

          {/* Reset Button - Complete State */}
          {appState === "complete" && (
            <div className="flex justify-center">
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors duration-200"
              >
                Ask Another Question
              </button>
            </div>
          )}

          {/* MCQ Quiz Section - Hidden for now */}
          <div className="mt-16">
            <MCQQuiz />
          </div>
        </div>
      </div>
    </div>
  )
}
