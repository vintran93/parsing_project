import React, { useEffect, useState } from "react";
import axios from "axios";

// Axios defaults
axios.defaults.baseURL = "http://localhost:8000";
axios.defaults.withCredentials = true; // send cookies with every request

// Helper: read a cookie (gets the CSRF token)
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

export default function TestAdmin({ onEdit }) {
  const [tests, setTests] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState(null);

  /* ─────────────── API helpers ─────────────── */

  // Pull the latest CSRF cookie (GET /api/csrf/)
  const fetchCsrfCookie = async () => {
    try {
      await axios.get("/api/csrf/");
    } catch (err) {
      console.error("CSRF cookie fetch failed →", err.response?.data || err);
    }
  };

  // List tests
  const fetchTests = async () => {
    try {
      const res = await axios.get("/api/tests/");
      setTests(res.data);
    } catch (err) {
      console.error("fetchTests() error →", err.response?.data || err);
      setError("Failed to fetch tests");
    }
  };

  /* ─────────────── lifecycle ─────────────── */

  useEffect(() => {
    (async () => {
      await fetchCsrfCookie();
      await fetchTests();
    })();
  }, []);

  /* ─────────────── actions ─────────────── */

  // Upload a new Word test
  const handleUpload = async () => {
    setError(null);

    if (!file) {
      setError("Please select a .docx file first");
      return;
    }

    try {
      const form = new FormData();
      form.append("doc_file", file);
      if (title) form.append("title", title);

      await axios.post("/api/tests/", form, {
        headers: { "X-CSRFToken": getCookie("csrftoken") },
      });

      setFile(null);
      setTitle("");
      fetchTests();
    } catch (err) {
      console.error("Upload failed →", err.response?.data || err);
      setError(
        "Upload failed: " +
          (typeof err.response?.data === "object"
            ? JSON.stringify(err.response.data)
            : err.response?.data || err.message)
      );
    }
  };

  // Delete a test
  const handleDelete = async (id) => {
    setError(null);
    try {
      await axios.delete(`/api/tests/${id}/`, {
        headers: { "X-CSRFToken": getCookie("csrftoken") },
      });
      fetchTests();
    } catch (err) {
      console.error("Delete failed →", err.response?.data || err);
      setError(
        "Delete failed: " +
          (typeof err.response?.data === "object"
            ? JSON.stringify(err.response.data)
            : err.response?.data || err.message)
      );
    }
  };

  /* ─────────────── render ─────────────── */

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-bold">Word Tests Admin</h2>

      {error && (
        <div className="p-2 mb-4 text-red-700 bg-red-100 rounded">{error}</div>
      )}

      {/* uploader */}
      <div className="flex space-x-2">
        <input
          type="file"
          accept=".docx"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <input
          type="text"
          className="border px-2"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button
          onClick={handleUpload}
          className="px-3 py-1 bg-blue-600 text-white rounded"
        >
          Upload
        </button>
      </div>

      {/* list */}
      <table className="w-full text-left border">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2">Title</th>
            <th className="p-2">Uploaded</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tests.length === 0 && (
            <tr>
              <td colSpan={3} className="p-4 text-center text-gray-500">
                No tests found.
              </td>
            </tr>
          )}

          {tests.map((t) => (
            <tr key={t.id} className="border-t">
              <td className="p-2">{t.title}</td>
              <td className="p-2">
                {new Date(t.uploaded_at).toLocaleDateString()}
              </td>
              <td className="p-2 space-x-2">
                <button
                  onClick={() => onEdit?.(t.id)}
                  className="text-blue-600 underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="text-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}