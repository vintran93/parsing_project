import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const TestEditor = ({ testId, onBack }) => {
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!testId) return;
    const fetchTest = async () => {
      try {
        const response = await axios.get(`/api/tests/${testId}/`);
        setTest(response.data);
      } catch (err) {
        setError('Failed to load test.');
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [testId]);

  const handleTitleChange = (e) => {
    setTest((prev) => ({ ...prev, title: e.target.value }));
  };

  const handleQuestionChange = (qIndex, value) => {
    setTest((prev) => {
      const updatedQuestions = [...prev.parsed_json.questions];
      updatedQuestions[qIndex] = { ...updatedQuestions[qIndex], question: value };
      return { ...prev, parsed_json: { ...prev.parsed_json, questions: updatedQuestions } };
    });
  };

  const handleExplanationChange = (qIndex, value) => {
    setTest((prev) => {
      const updatedQuestions = [...prev.parsed_json.questions];
      updatedQuestions[qIndex] = { ...updatedQuestions[qIndex], explanation: value };
      return { ...prev, parsed_json: { ...prev.parsed_json, questions: updatedQuestions } };
    });
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    setTest((prev) => {
      const updatedQuestions = [...prev.parsed_json.questions];
      const updatedOptions = [...(updatedQuestions[qIndex].options || [])];
      updatedOptions[oIndex] = value;
      updatedQuestions[qIndex] = { ...updatedQuestions[qIndex], options: updatedOptions };
      return { ...prev, parsed_json: { ...prev.parsed_json, questions: updatedQuestions } };
    });
  };

  const addOption = (qIndex) => {
    setTest((prev) => {
      const updatedQuestions = [...prev.parsed_json.questions];
      const options = updatedQuestions[qIndex].options || [];
      updatedQuestions[qIndex] = { ...updatedQuestions[qIndex], options: [...options, ''] };
      return { ...prev, parsed_json: { ...prev.parsed_json, questions: updatedQuestions } };
    });
  };

  const saveTest = async () => {
    setError(null);
    try {
      await axios.patch(`/api/tests/${testId}/`, {
        title: test.title,
        parsed_json: test.parsed_json,
      });
      if (onBack) {
        onBack();
      } else {
        navigate('/');
      }
    } catch (err) {
      if (err.response?.data) {
        setError(JSON.stringify(err.response.data));
      } else {
        setError('Failed to save test.');
      }
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!test) return <p>No test data.</p>;

  return (
    <div>
      <h2>Edit Test</h2>
      <label>
        Title:
        <input type="text" value={test.title} onChange={handleTitleChange} />
      </label>

      <div>
        {test.parsed_json.questions.map((question, qIndex) => (
          <div key={qIndex} style={{ marginBottom: '20px' }}>
            <label>
              <strong>Question {qIndex + 1}:</strong>
              <input
                type="text"
                value={question.question}
                onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                style={{ width: '100%', marginTop: '4px' }}
              />
            </label>

            <label>
              Explanation:
              <textarea
                value={question.explanation || ''}
                onChange={(e) => handleExplanationChange(qIndex, e.target.value)}
                style={{ width: '100%', marginTop: '4px', minHeight: '60px' }}
              />
            </label>

            <div style={{ marginLeft: '20px', marginTop: '8px' }}>
              {question.options?.map((option, oIndex) => (
                <input
                  key={oIndex}
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(97 + oIndex)}`}
                  style={{ display: 'block', marginBottom: '4px', width: '90%' }}
                />
              ))}

              <button type="button" onClick={() => addOption(qIndex)}>
                Add Option
              </button>
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={saveTest}>
        Save Test
      </button>
    </div>
  );
};

export default TestEditor;