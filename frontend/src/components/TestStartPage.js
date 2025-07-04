import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function TestStartPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState(null);
  const [testStarted, setTestStarted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [grading, setGrading] = useState(false);
  const [results, setResults] = useState(null);
  const [showCorrect, setShowCorrect] = useState({});
  const [showExplanation, setShowExplanation] = useState({});

  useEffect(() => {
    async function fetchTest() {
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:8000/api/tests/${id}`);
        setTest(res.data);
      } catch (err) {
        alert(`Failed to load test: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    fetchTest();
  }, [id]);

  const handleStartTest = () => {
    setTestStarted(true);
    setResults(null);
    setAnswers({});
    setShowCorrect({});
    setShowExplanation({});
  };

  const handleAnswerChange = (qIdx, letter) => {
    setAnswers((prev) => ({ ...prev, [qIdx]: letter }));
  };

  const handleSubmit = async () => {
    if (!test?.questions) return;

    if (test.questions.some((_, i) => !answers[i])) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setGrading(true);
    try {
      const res = await axios.post("http://localhost:8000/api/grade-test/", {
        test_id: id,
        answers,
      });
      setResults(res.data);
    } catch (err) {
      alert(`Grading failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setGrading(false);
    }
  };

  const toggleShowCorrect = (index) => {
    setShowCorrect((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleShowExplanation = (index) => {
    setShowExplanation((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  if (loading) return <p>Loading test...</p>;
  if (!test) return <p>Test not found.</p>;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate("/")}
        className="mb-4 px-4 py-2 bg-gray-500 text-white rounded"
      >
        Back to Main
      </button>

      {!testStarted && (
        <>
          <h2 className="text-2xl font-bold">{test.title || "Untitled Test"}</h2>
          <button
            onClick={handleStartTest}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded"
          >
            Start Test
          </button>
        </>
      )}

      {testStarted && (
        <>
          <h2 className="text-2xl font-bold">{test.title || "Untitled Test"}</h2>

          <div className="space-y-6">
            {test.questions.map((q, i) => (
              <div key={i} className="p-4 border rounded bg-gray-50">
                <p className="font-semibold">
                  {i + 1}. {q.question}
                </p>

                <div className="mt-2">
                  {q.options.map((opt, idx) => {
                    const letter = String.fromCharCode(97 + idx);
                    const optionText = opt.slice(3).trim();
                    return (
                      <label
                        key={idx}
                        className="flex items-center space-x-2 mb-1"
                        style={{ display: "flex", alignItems: "center" }}
                      >
                        <input
                          type="radio"
                          name={`q${i}`}
                          value={letter}
                          checked={answers[i] === letter}
                          onChange={() => handleAnswerChange(i, letter)}
                          disabled={!!results}
                          style={{ flexShrink: 0 }}
                        />
                        <span style={{ whiteSpace: "normal" }}>
                          <strong>{letter})</strong> {optionText}
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div className="mt-2 space-x-4">
                  {q.correct_answer && (
                    <button
                      type="button"
                      onClick={() => toggleShowCorrect(i)}
                      className="text-sm text-blue-600 underline"
                    >
                      {showCorrect[i] ? "Hide Correct Answer" : "Show Correct Answer"}
                    </button>
                  )}
                  {q.explanation && (
                    <button
                      type="button"
                      onClick={() => toggleShowExplanation(i)}
                      className="text-sm text-blue-600 underline"
                    >
                      {showExplanation[i] ? "Hide Explanation" : "Show Explanation"}
                    </button>
                  )}
                </div>

                {showCorrect[i] && q.correct_answer && (
                  <p className="mt-1 text-sm text-green-700">
                    Correct answer: {q.correct_answer}
                  </p>
                )}

                {results && (
                  <p
                    className={`mt-2 font-medium ${
                      results.results[i].is_correct ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {results.results[i].is_correct
                      ? "Correct"
                      : `Wrong, correct answer: ${results.results[i].correct_answer}`}
                  </p>
                )}

                {showExplanation[i] && q.explanation && (
                  <p className="mt-2 text-gray-700 italic whitespace-pre-wrap">
                    Explanation: {q.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>

          {!results && (
            <button
              onClick={handleSubmit}
              disabled={grading}
              className="mt-6 px-4 py-2 bg-green-600 text-white rounded"
            >
              {grading ? "Grading..." : "Submit Answers"}
            </button>
          )}

          {results && (
            <div className="mt-6 p-4 border rounded bg-gray-100">
              <h3 className="font-bold text-lg">Results</h3>
              <p>
                Your score: {results.score} / {results.total} - {results.percent}%
              </p>
              <button
                onClick={() => {
                  setResults(null);
                  setAnswers({});
                  setShowCorrect({});
                  setShowExplanation({});
                }}
                className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded"
              >
                Retake Test
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default TestStartPage;