import logo from "./logo.svg";
import "./App.css";
import WordParser from "./components/WordParser";
import TestAdmin from './components/TestAdmin'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <div style={{ marginTop: 12 }}>
          {/* Put anything you like here, but not a <div> inside a <p> */}
          {/* For example some intro text: */}
          <p>Upload a Word document below to parse its contents.</p>
        </div>
      </header>

      <main style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
        <WordParser />
        <TestAdmin />
      </main>
    </div>
  );
}

export default App;