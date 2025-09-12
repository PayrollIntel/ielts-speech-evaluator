import React from 'react';
import SpeechEvaluator from './components/SpeechEvaluator';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <div className="main-content">
        <header className="app-header">
          <h1 className="app-title">IELTS Speaking Test</h1>
          <p className="app-subtitle">Advanced AI-Powered Speaking Assessment</p>
        </header>
        <main>
          <SpeechEvaluator />
        </main>
      </div>
    </div>
  );
}

export default App;