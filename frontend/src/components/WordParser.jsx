import React, { useState, useEffect } from "react";
import axios from "axios";

function WordParser({ externalTestId, hideUploader = false, onBack }) {
  const [file, setFile]           = useState(null);
  const [title, setTitle]         = useState(null);
  const [testId, setTestId]       = useState(null);
  const [questions, setQuestions] = useState(null);
  const [answers, setAnswers]     = useState({});
  const [loading, setLoading]     = useState(false);
  const [grading, setGrading]     = useState(false);
  const [results, setResults]     = useState(null);
  const [showCorrect, setShowCorrect]       = useState({});
  const [showExplanation, setShowExplanation] = useState({});

  /* ─── fetch test if an id is supplied ─── */
  useEffect(() => {
    if (externalTestId) fetchTest(externalTestId);
  }, [externalTestId]);

  const fetchTest = async (id) => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/api/tests/${id}/`);
      setTestId(id);
      setTitle(res.data.title);
      setQuestions(res.data.parsed_json.questions);
      setAnswers({});
      setResults(null);
      setShowCorrect({});
      setShowExplanation({});
    } catch (e) {
      alert(`Failed to load test: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  /* ─── handlers ─── */
  const handleChange = (e) => {
    setFile(e.target.files[0]);
    setTitle(null);
    setTestId(null);
    setQuestions(null);
    setAnswers({});
    setResults(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    try {
      const form = new FormData();
      form.append("doc_file", file);
      const res = await axios.post("http://localhost:8000/api/tests/", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setTestId(res.data.id);
      setTitle(res.data.title);
      setQuestions(res.data.parsed_json.questions);
      setAnswers({});
      setResults(null);
    } catch (err) {
      alert(`Upload failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (qIdx, letter) =>
    setAnswers((prev) => ({ ...prev, [qIdx]: letter }));

  const toggleCorrect = (i) =>
    setShowCorrect((p) => ({ ...p, [i]: !p[i] }));

  const toggleExplanation = (i) =>
    setShowExplanation((p) => ({ ...p, [i]: !p[i] }));

  const handleSubmit = async () => {
    if (!questions) return;
    if (questions.some((_, i) => !answers[i]))
      return alert("Please answer every question.");
    setGrading(true);
    try {
      const res = await axios.post("http://localhost:8000/api/grade-test/", {
        test_id: testId,
        answers,
      });
      setResults(res.data);
    } catch (err) {
      alert(`Grading failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setGrading(false);
    }
  };

  /* ─── render ─── */
  if (loading) return <p className="p-4">Loading…</p>;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="mb-4 px-4 py-1 bg-gray-300 rounded hover:bg-gray-400"
        >
          ← Back to Main
        </button>
      )}

      {/* uploader */}
      {!hideUploader && (
        <form onSubmit={handleUpload} className="flex items-center space-x-2">
          <input type="file" accept=".docx" onChange={handleChange} />
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-1 bg-blue-600 text-white rounded"
          >
            {loading ? "Uploading…" : "Upload & Parse"}
          </button>
        </form>
      )}

      {title && <h2 className="text-2xl font-bold">{title}</h2>}

      {/* questions */}
      {questions && (
        <div>
          {questions.map((q, i) => {
            const optsString = q.options
              .map((opt, idx) => {
                const letter = String.fromCharCode(97 + idx);
                return `${letter}) ${opt.replace(/^[a-z]\)\s*/i, "")}`;
              })
              .join("\n");

            return (
              <div key={i} className="p-4 border rounded bg-gray-50 mb-8">
                <p className="font-semibold">
                  {i + 1}. {q.question}
                </p>

                {/* textarea with all options */}
                <textarea
                  readOnly
                  rows={q.options.length + 3}
                  value={optsString}
                  className="mt-2 p-2 border rounded font-mono resize-none"
                  style={{ width: "700px", maxWidth: "100%" }}
                />

                {/* radio buttons */}
                <div className="mt-2 flex space-x-4">
                  {q.options.map((_, idx) => {
                    const letter = String.fromCharCode(97 + idx);
                    return (
                      <label key={idx} className="flex items-center space-x-1">
                        <input
                          type="radio"
                          name={`q${i}`}
                          value={letter}
                          checked={answers[i] === letter}
                          onChange={() => handleAnswerChange(i, letter)}
                          disabled={!!results}
                        />
                        <span className="select-none">
                          {letter.toUpperCase()}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {/* toggles */}
                <div className="mt-2 flex space-x-4">
                  <button
                    type="button"
                    onClick={() => toggleCorrect(i)}
                    className="text-sm text-blue-600 underline"
                  >
                    {showCorrect[i]
                      ? "Hide Correct Answer"
                      : "Show Correct Answer"}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleExplanation(i)}
                    className="text-sm text-blue-600 underline"
                  >
                    {showExplanation[i]
                      ? "Hide Explanation"
                      : "Show Explanation"}
                  </button>
                </div>

                {showCorrect[i] && q.correct_answer && (
                  <p className="mt-1 text-sm text-green-700">
                    Correct answer: {q.correct_answer}
                  </p>
                )}

                {showExplanation[i] && q.explanation && (
                  <p className="mt-2 text-gray-700 italic whitespace-pre-wrap">
                    {q.explanation.replace(/^Explanation:\s*/i, "")}
                  </p>
                )}

                {results && (
                  <p
                    className={`mt-2 font-medium ${
                      results.results[i].is_correct
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {results.results[i].is_correct
                      ? "Correct"
                      : `Wrong, correct answer: ${results.results[i].correct_answer}`}
                  </p>
                )}
              </div>
            );
          })}

          {/* submit / results */}
          {!results ? (
            <button
              onClick={handleSubmit}
              disabled={grading}
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              {grading ? "Grading…" : "Submit Answers"}
            </button>
          ) : (
            <div className="mt-6 p-4 border rounded bg-gray-100">
              <h3 className="font-bold text-lg">Results</h3>
              <p>
                Your score: {results.score} / {results.total} —{" "}
                {results.percent}%
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default WordParser;