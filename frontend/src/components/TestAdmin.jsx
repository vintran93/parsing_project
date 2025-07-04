import React, { useEffect, useState } from "react";
import axios from "axios";

/* Axios defaults */
axios.defaults.baseURL = "http://localhost:8000";
axios.defaults.withCredentials = true;

/* read csrftoken cookie */
function getCookie(name) {
  const v = `; ${document.cookie}`;
  const parts = v.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

export default function TestAdmin({ onEdit, onStart }) {
  const [tests, setTests] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState(null);

  /* ─── API helpers ─── */
  const fetchCsrf = () => axios.get("/api/csrf/").catch(() => {});
  const fetchTests = () =>
    axios
      .get("/api/tests/")
      .then((res) => setTests(res.data))
      .catch(() => setError("Failed to fetch tests"));

  useEffect(() => {
    fetchCsrf().then(fetchTests);
  }, []);

  const handleUpload = async () => {
    if (!file) return setError("Select a .docx file first");
    setError(null);

    const form = new FormData();
    form.append("doc_file", file);
    if (title) form.append("title", title);

    try {
      await axios.post("/api/tests/", form, {
        headers: { "X-CSRFToken": getCookie("csrftoken") },
      });
      setFile(null);
      setTitle("");
      fetchTests();
    } catch {
      setError("Upload failed");
    }
  };

  const handleDelete = async (id) => {
    setError(null);

    // Confirmation prompt
    const confirmed = window.confirm(
      "Are you sure you want to delete this test? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      await axios.delete(`/api/tests/${id}/`, {
        headers: { "X-CSRFToken": getCookie("csrftoken") },
      });
      fetchTests();
    } catch {
      setError("Delete failed");
    }
  };

  /* ─── render ─── */
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-bold">Word Tests Admin</h2>

      {error && (
        <div className="p-2 text-red-700 bg-red-100 rounded">{error}</div>
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
              <td className="p-2">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => onEdit?.(t.id)}
                    className="text-blue-600 underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onStart?.(t.id)}
                    className="text-indigo-600 underline"
                  >
                    Start
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}