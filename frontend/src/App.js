import React from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import WordParser from "./components/WordParser";
import TestAdmin from "./components/TestAdmin";
import TestEditor from "./components/TestEditor";

const PlayerWrap = () => {
  const { testId } = useParams();
  const navigate = useNavigate();

  return (
    <WordParser
      externalTestId={testId}
      hideUploader={true}
      onBack={() => navigate("/")}
    />
  );
};

function App() {
  const navigate = useNavigate();

  const handleEdit = (id) => navigate(`/tests/${id}/edit`);
  const handleStart = (id) => navigate(`/tests/${id}/start`);

  return (
    <div className="App">
      <main style={{ padding: 20, maxWidth: 760, margin: "auto" }}>
        <Routes>
          <Route
            path="/"
            element={<TestAdmin onEdit={handleEdit} onStart={handleStart} />}
          />
          <Route path="/tests/:testId/edit" element={<TestEditorWrapper />} />
          <Route path="/tests/:testId/start" element={<PlayerWrap />} />
        </Routes>
      </main>
    </div>
  );
}

const TestEditorWrapper = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  return <TestEditor testId={testId} onBack={() => navigate("/")} />;
};

export default App;