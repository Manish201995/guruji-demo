"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, CheckCircle, XCircle } from "lucide-react"

interface Question {
  id: number
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

const sampleQuestions: Question[] = [
  {
    id: 1,
    question: "What is the main concept discussed in the video?",
    options: [
      "Basic programming fundamentals",
      "Advanced React patterns",
      "Database optimization",
      "UI/UX design principles",
    ],
    correctAnswer: 1,
    explanation: "The video focuses on advanced React patterns and their practical applications.",
  },
  {
    id: 2,
    question: "Which technique was emphasized for better performance?",
    options: ["Code splitting", "Server-side rendering", "Memoization", "All of the above"],
    correctAnswer: 3,
    explanation:
      "The video covered multiple performance optimization techniques including code splitting, SSR, and memoization.",
  },
]

export default function MCQQuiz() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({})
  const [showResults, setShowResults] = useState(false)

  const handleAnswerSelect = (questionId: number, answerIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }))
  }

  const handleSubmit = () => {
    setShowResults(true)
  }

  const resetQuiz = () => {
    setSelectedAnswers({})
    setShowResults(false)
    setCurrentQuestion(0)
  }

  const getScore = () => {
    let correct = 0
    sampleQuestions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correct++
      }
    })
    return correct
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">Q</span>
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Practice Quiz</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Test your understanding of the video content</p>
          </div>
        </div>
        {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
      </button>

      {/* Quiz Content */}
      {isExpanded && (
        <div className="border-t border-slate-200 dark:border-slate-700 p-6 animate-in slide-in-from-top-2 duration-300">
          {!showResults ? (
            <div className="space-y-6">
              {/* Progress Bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / sampleQuestions.length) * 100}%` }}
                ></div>
              </div>

              {/* Question */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-slate-800 dark:text-slate-200">
                    Question {currentQuestion + 1} of {sampleQuestions.length}
                  </h4>
                </div>

                <p className="text-slate-700 dark:text-slate-300 text-lg">
                  {sampleQuestions[currentQuestion].question}
                </p>

                {/* Options */}
                <div className="space-y-3">
                  {sampleQuestions[currentQuestion].options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(sampleQuestions[currentQuestion].id, index)}
                      className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                        selectedAnswers[sampleQuestions[currentQuestion].id] === index
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-4 h-4 rounded-full border-2 ${
                            selectedAnswers[sampleQuestions[currentQuestion].id] === index
                              ? "border-blue-500 bg-blue-500"
                              : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {selectedAnswers[sampleQuestions[currentQuestion].id] === index && (
                            <div className="w-full h-full rounded-full bg-white scale-50"></div>
                          )}
                        </div>
                        <span className="text-slate-700 dark:text-slate-300">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
                  disabled={currentQuestion === 0}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {currentQuestion === sampleQuestions.length - 1 ? (
                  <button
                    onClick={handleSubmit}
                    disabled={Object.keys(selectedAnswers).length !== sampleQuestions.length}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Submit Quiz
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQuestion((prev) => Math.min(sampleQuestions.length - 1, prev + 1))}
                    className="px-4 py-2 text-blue-600 dark:text-blue-400"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Results */
            <div className="space-y-6">
              <div className="text-center">
                <h4 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Quiz Complete!</h4>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                  You scored {getScore()} out of {sampleQuestions.length}
                </p>
              </div>

              {/* Answer Review */}
              <div className="space-y-4">
                {sampleQuestions.map((question, qIndex) => (
                  <div key={question.id} className="border border-slate-200 dark:border-slate-600 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      {selectedAnswers[question.id] === question.correctAnswer ? (
                        <CheckCircle className="text-green-500 mt-1" size={20} />
                      ) : (
                        <XCircle className="text-red-500 mt-1" size={20} />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 dark:text-slate-200 mb-2">{question.question}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                          Your answer: {question.options[selectedAnswers[question.id]]}
                        </p>
                        {selectedAnswers[question.id] !== question.correctAnswer && (
                          <p className="text-sm text-green-600 dark:text-green-400 mb-2">
                            Correct answer: {question.options[question.correctAnswer]}
                          </p>
                        )}
                        <p className="text-sm text-slate-500 dark:text-slate-400">{question.explanation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={resetQuiz}
                className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
              >
                Retake Quiz
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
