import React, { useState } from "react";
import axios from "axios";

function WordParser() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState(null);
  const [testId, setTestId] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [grading, setGrading] = useState(false);
  const [results, setResults] = useState(null);

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

    const form = new FormData();
    form.append("doc_file", file);

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8000/api/tests/", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setTestId(res.data.id);
      setTitle(res.data.title);
      setQuestions(res.data.parsed_json.questions);
      setResults(null);
    } catch (err) {
      alert(`Upload failed: ${err.response?.data?.detail || err.message}`);
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

    if (!testId) {
      alert("No test ID available for grading.");
      return;
    }

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

              <div className="mt-2">
                {(() => {
                  // Flatten all split options into one array
                  const allOptions = q.options.flatMap(opt =>
                    opt.split(/(?=[a-d]\))/i).map(s => s.trim()).filter(Boolean)
                  );

                  return allOptions.map((optText, idx) => {
                    // optText looks like: "a) To optimize routing ..."
                    const match = optText.match(/^([a-d])\)\s*(.+)$/i);
                    if (!match) return null;
                    const letter = match[1].toLowerCase();
                    const text = match[2];

                    return (
                      <label
                        key={idx}
                        className="flex items-center space-x-2 mb-2 cursor-pointer"
                        style={{ display: 'flex', alignItems: 'center' }}
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
                        <span>{letter}) {text}</span>
                      </label>
                    );
                  });
                })()}
              </div>

              {/* Show correct answer before grading */}
              {q.correct_answer && (
                <p className="mt-1 text-sm text-green-700">
                  Correct answer: {q.correct_answer}
                </p>
              )}

              {/* Feedback after grading */}
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
              <p>
                Your score: {results.score} / {results.total} - {results.percent}%
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default WordParser;