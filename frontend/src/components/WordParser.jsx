import React, { useState } from "react";
import axios from "axios";

function WordParser() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [grading, setGrading] = useState(false);
  const [results, setResults] = useState(null);

  /* ─────────────────── handlers ─────────────────── */

  const handleChange = (e) => {
    setFile(e.target.files[0]);
    setTitle(null);
    setQuestions(null);
    setAnswers({});
    setResults(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const form = new FormData();
    form.append("file", file);

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8000/api/parse-doc/", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setTitle(res.data.title);
      setQuestions(res.data.questions);
      setResults(null);
    } catch (err) {
      alert(`Upload failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (qIdx, letter) => {
    setAnswers((prev) => ({ ...prev, [qIdx]: letter }));
  };

  const handleSubmit = async () => {
    if (!questions) return;
    if (questions.some((_, i) => !answers[i])) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setGrading(true);
    try {
      const res = await axios.post("http://localhost:8000/api/grade-test/", {
        answers,
      });
      setResults(res.data);          // keep full response (score, results[])
    } catch (err) {
      alert(`Grading failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setGrading(false);
    }
  };

  /* ─────────────────── render ─────────────────── */

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <form onSubmit={handleUpload} className="flex items-center space-x-2">
        <input type="file" accept=".docx" onChange={handleChange} />
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-1 rounded bg-blue-600 text-white"
        >
          {loading ? "Uploading..." : "Upload & Parse"}
        </button>
      </form>

      {questions && title && <h2 className="text-2xl font-bold">{title}</h2>}

      {questions && (
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={i} className="p-4 border rounded bg-gray-50">
              <p className="font-semibold">{i + 1}. {q.question}</p>

              {/* options */}
              <div className="ml-6">
                {q.options.map((opt, idx) => {
                  const letter = String.fromCharCode(97 + idx); // a, b, c...
                  const optionText = opt.slice(3).trim();       // strip "a) "
                  return (
                    <label key={idx} className="flex items-start mb-2 space-x-2">
                      <input
                        type="radio"
                        name={`q${i}`}
                        value={letter}
                        checked={answers[i] === letter}
                        onChange={() => handleAnswerChange(i, letter)}
                        disabled={!!results}
                      />
                      <span><strong>{letter})</strong> {optionText}</span>
                    </label>
                  );
                })}
              </div>

              {/* grading feedback */}
              {results && (
                <p className={`mt-2 font-medium ${
                  results.results[i].is_correct ? "text-green-600" : "text-red-600"
                }`}>
                  {results.results[i].is_correct
                    ? "Correct"
                    : `Wrong, correct answer: ${results.results[i].correct_answer}`}
                </p>
              )}

              {/* explanation */}
              {q.explanation && (
                <p className="mt-2 text-gray-700 italic whitespace-pre-wrap">
                  Explanation: {q.explanation}
                </p>
              )}
            </div>
          ))}

          {!results && (
            <button
              onClick={handleSubmit}
              disabled={grading}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
            >
              {grading ? "Grading..." : "Submit Answers"}
            </button>
          )}

          {results && (
            <div className="mt-6 p-4 border rounded bg-gray-100">
              <h3 className="font-bold text-lg">Results</h3>
              <p>Your score: {results.score} / {results.total}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default WordParser;