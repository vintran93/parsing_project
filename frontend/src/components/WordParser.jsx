import React, { useState } from "react";
import axios from "axios";
import { FileUp, Loader } from "lucide-react";

function WordParser() {
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFile(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    const form = new FormData();
    form.append("file", file);

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8000/api/parse-doc/", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setParsed(res.data);            // { questions: [...], html: "..." }
    } catch (err) {
      console.error(err);
      alert(
        `Upload failed: ${
          err.response?.data?.detail || err.message || "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload form */}
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <input
          type="file"
          accept=".doc,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleChange}
        />
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-1 rounded bg-blue-600 text-white flex items-center gap-1 disabled:opacity-50"
        >
          {loading ? (
            <Loader className="animate-spin" size={16} />
          ) : (
            <FileUp size={16} />
          )}{" "}
          Upload
        </button>
      </form>

      {/* ↓↓↓ DEBUG VIEWS — remove when UI is ready ↓↓↓ */}

      {/* Raw HTML from backend */}
      {parsed?.html && (
        <>
          <h3 className="font-semibold">Raw HTML (debug)</h3>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              background: "#f3f3f3",
              padding: 12,
              borderRadius: 6,
            }}
          >
            {parsed.html}
          </pre>
        </>
      )}

      {/* Parsed questions JSON */}
      {parsed?.questions && (
        <>
          <h3 className="font-semibold">Parsed Questions JSON (debug)</h3>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              background: "#eef6ff",
              padding: 12,
              borderRadius: 6,
            }}
          >
            {JSON.stringify(parsed.questions, null, 2)}
          </pre>
        </>
      )}
    </div>
  );
}

export default WordParser;