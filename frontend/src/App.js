import React from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import WordParser from "./components/WordParser";
import TestAdmin from "./components/TestAdmin";
import TestEditor from "./components/TestEditor";

function App() {
  const navigate = useNavigate();

  // Handler to navigate to the editor page
  const handleEdit = (testId) => {
    navigate(`/tests/${testId}/edit`);
  };

  // Handler to go back from the editor to admin
  const handleBack = () => {
    navigate("/");
  };

  // Wrapper component to get testId param and pass it to TestEditor
  function TestEditorWrapper() {
    const { testId } = useParams();
    return <TestEditor testId={testId} onBack={handleBack} />;
  }

  return (
    <div className="App">
      <main style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <WordParser />
                <TestAdmin onEdit={handleEdit} />
              </>
            }
          />
          <Route path="/tests/:testId/edit" element={<TestEditorWrapper />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;