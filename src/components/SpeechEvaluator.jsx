// Enhanced SpeechEvaluator.jsx - Auto-Start Recording after Part 2 Preparation
// Part 1: 7-8 questions from 2-3 topics, Part 2: 1 cue card (auto-record), Part 3: 4-6 discussion questions

import React, { useState, useRef, useEffect, useCallback } from "react";
import questionBank from "../data/questions-corrected";
import './SpeechEvaluator.css';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";


// Function to create authentic IELTS test structure (same as before)
const createIELTSTest = () => {
  // PART 1: Select 2-3 topics and get 7-8 questions total
  const availableTopics = [...questionBank.part1Topics];
  const shuffledTopics = availableTopics.sort(() => Math.random() - 0.5);
  
  // First topic: 3-4 questions (mandatory introductory topic)
  const introTopic = shuffledTopics[0];
  const introQuestions = [...introTopic.questions]
  .sort(() => Math.random() - 0.5)
  .slice(0, 2);
  
  // Second topic: 3-4 questions
  const secondTopic = shuffledTopics[1];
  const secondQuestions = [...secondTopic.questions]
  .sort(() => Math.random() - 0.5)
  .slice(0, Math.random() > 0.5 ? 2 : 3);
  
  // Build Part 1 questions (7-8 total)
  let part1Questions = [];
  
  // Add questions from first topic
  introQuestions.forEach(q => {
    part1Questions.push({
      ...q,
      topicName: introTopic.topicName,
      part: 1,
      expectedDuration: 30 // 20-30 seconds per answer
    });
  });
  
  // Add questions from second topic
  secondQuestions.forEach(q => {
    part1Questions.push({
      ...q,
      topicName: secondTopic.topicName,
      part: 1,
      expectedDuration: 30
    });
  });
  
  // PART 2: Select 1 cue card
  const cueCards = [...questionBank.part2CueCards];
  const selectedCueCard = cueCards[Math.floor(Math.random() * cueCards.length)];
  const part2Question = {
    ...selectedCueCard,
    part: 2,
    expectedDuration: 120, // 1-2 minutes speaking
    preparationTime: 60 // 1 minute preparation
  };
  
  // PART 3: Select 4-6 discussion questions related to Part 2 topic
  const relatedDiscussion = questionBank.part3Discussions.find(
    disc => disc.relatedToPart2 === selectedCueCard.id
  );
  let part3Questions = [];
  if (relatedDiscussion) {
    const shuffledDiscQuestions = [...relatedDiscussion.questions].sort(() => Math.random() - 0.5);
    const numQuestions = Math.floor(Math.random() * 3) + 4; // 4-6 questions
    part3Questions = shuffledDiscQuestions.slice(0, numQuestions).map(q => ({
      ...q,
      part: 3,
      topicTheme: relatedDiscussion.topicTheme,
      expectedDuration: 60 // 30-60 seconds per answer
    }));
  }
  
  return {
    testId: `ielts_test_${Date.now()}`,
    title: `IELTS Speaking Test - ${new Date().toLocaleDateString()}`,
    testStructure: {
      part1: {
        name: "Part 1: Introduction & Interview",
        duration: "4-5 minutes",
        questions: part1Questions,
        topics: [introTopic.topicName, secondTopic.topicName]
      },
      part2: {
        name: "Part 2: Individual Long Turn",
        duration: "3-4 minutes",
        question: part2Question,
        cueCard: selectedCueCard.cueCard
      },
      part3: {
        name: "Part 3: Two-way Discussion",
        duration: "4-5 minutes",
        questions: part3Questions,
        theme: relatedDiscussion?.topicTheme || "General Discussion"
      }
    },
    // Flatten all questions for sequential navigation
    allQuestions: [
      ...part1Questions.map(q => ({ ...q, prompt: q.prompt })),
      { ...part2Question, prompt: part2Question.cueCard.mainPrompt },
      ...part3Questions.map(q => ({ ...q, prompt: q.prompt }))
    ],
    totalQuestions: part1Questions.length + 1 + part3Questions.length
  };
};

// Pronunciation Analyzer Class (same as before)
class SimplePronunciationAnalyzer {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.features = {
      pitch: [],
      rms: [],
      spectralCentroid: [],
      zcr: []
    };
    this.isAnalyzing = false;
  }

  async initialize() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      return true;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      return false;
    }
  }

  async startAnalysis(stream) {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    const source = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    source.connect(this.analyser);
    this.isAnalyzing = true;
    this.startFeatureExtraction();
  }

  startFeatureExtraction() {
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    const timeDataArray = new Float32Array(this.analyser.fftSize);

    const extractFeatures = () => {
      if (!this.isAnalyzing) return;

      this.analyser.getFloatFrequencyData(dataArray);
      this.analyser.getFloatTimeDomainData(timeDataArray);

      const timestamp = this.audioContext.currentTime;
      const rms = this.calculateRMS(timeDataArray);
      const zcr = this.calculateZCR(timeDataArray);
      const spectralCentroid = this.calculateSpectralCentroid(dataArray);
      const pitch = this.detectPitch(timeDataArray);

      this.features.rms.push({ value: rms, timestamp });
      this.features.zcr.push({ value: zcr, timestamp });
      this.features.spectralCentroid.push({ value: spectralCentroid, timestamp });

      if (pitch && pitch > 50 && pitch < 800) {
        this.features.pitch.push({ frequency: pitch, timestamp });
      }

      requestAnimationFrame(extractFeatures);
    };

    extractFeatures();
  }

  calculateRMS(timeData) {
    let sum = 0;
    for (let i = 0; i < timeData.length; i++) {
      sum += timeData[i] * timeData[i];
    }
    return Math.sqrt(sum / timeData.length);
  }

  calculateZCR(timeData) {
    let zeroCrossings = 0;
    for (let i = 1; i < timeData.length; i++) {
      if ((timeData[i] >= 0) !== (timeData[i - 1] >= 0)) {
        zeroCrossings++;
      }
    }
    return zeroCrossings / (timeData.length - 1);
  }

  calculateSpectralCentroid(freqData) {
    let weightedSum = 0;
    let magnitudeSum = 0;

    for (let i = 0; i < freqData.length; i++) {
      const magnitude = Math.pow(10, freqData[i] / 10);
      const frequency = (i * this.audioContext.sampleRate) / (2 * freqData.length);
      weightedSum += frequency * magnitude;
      magnitudeSum += magnitude;
    }

    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  }

  detectPitch(timeData) {
    const sampleRate = this.audioContext.sampleRate;
    const minPeriod = Math.floor(sampleRate / 800);
    const maxPeriod = Math.floor(sampleRate / 50);

    let bestCorrelation = 0;
    let bestPeriod = 0;

    for (let period = minPeriod; period < Math.min(maxPeriod, timeData.length / 2); period++) {
      let correlation = 0;
      for (let i = 0; i < timeData.length - period; i++) {
        correlation += timeData[i] * timeData[i + period];
      }

      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }

    return bestPeriod > 0 ? sampleRate / bestPeriod : 0;
  }

  stopAnalysis() {
    this.isAnalyzing = false;
  }

  getFeatures() {
    return { ...this.features };
  }

  reset() {
    this.features = {
      pitch: [],
      rms: [],
      spectralCentroid: [],
      zcr: []
    };
    this.isAnalyzing = false;
  }
}

// Main Speech Evaluator Component
function SpeechEvaluator() {
  // State management
  const [currentTest, setCurrentTest] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentPart, setCurrentPart] = useState(1);
  const [answers, setAnswers] = useState([]);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState(null);
  const [testSummary, setTestSummary] = useState(null);
  const [error, setError] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showResults, setShowResults] = useState(false);

  // Part 2 specific states
  const [preparationTime, setPreparationTime] = useState(0);
  const [isPreparingPart2, setIsPreparingPart2] = useState(false);
  const [preparationNotes, setPreparationNotes] = useState("");
  const [autoStartRecording, setAutoStartRecording] = useState(false); // NEW: Flag for auto-start

  // Component ready state
  const [isComponentReady, setIsComponentReady] = useState(false);
  const [initializationError, setInitializationError] = useState(null);

  // Pronunciation analysis state
  const [pronunciationAnalyzer, setPronunciationAnalyzer] = useState(null);
  const [audioFeatures, setAudioFeatures] = useState({});
  const [isAnalyzingPronunciation, setIsAnalyzingPronunciation] = useState(false);

  // Refs
  const recognitionRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const preparationTimerRef = useRef(null);
  const currentStreamRef = useRef(null);

  // Initialize component
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        const test = createIELTSTest();
        setCurrentTest(test);
        setAnswers(Array(test.totalQuestions).fill(""));
        const analyzer = new SimplePronunciationAnalyzer();
        setPronunciationAnalyzer(analyzer);
        setIsComponentReady(true);
        setInitializationError(null);
      } catch (error) {
        console.error('Component initialization failed:', error);
        setInitializationError('Failed to initialize speech evaluator. Please refresh the page.');
        setIsComponentReady(true);
      }
    };

    initializeComponent();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (preparationTimerRef.current) clearInterval(preparationTimerRef.current);
      if (currentStreamRef.current) {
        currentStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (pronunciationAnalyzer) {
        pronunciationAnalyzer.stopAnalysis();
      }
    };
  }, [pronunciationAnalyzer]);

  // NEW: Effect to handle auto-start recording after preparation
  useEffect(() => {
    if (autoStartRecording && !isPreparingPart2 && preparationTime === 0) {
      // Small delay to ensure preparation phase is fully complete
      const autoStartTimeout = setTimeout(() => {
        startRecording();
        setAutoStartRecording(false);
      }, 500);
      return () => clearTimeout(autoStartTimeout);
    }
  }, [autoStartRecording, isPreparingPart2, preparationTime]);

  // Timer functions
  const startRecordingTimer = useCallback(() => {
    setRecordingTime(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  }, []);

  const stopRecordingTimer = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  // UPDATED: Preparation timer with auto-start flag
  const startPreparationTimer = useCallback(() => {
    setPreparationTime(60); // 1 minute for Part 2
    setAutoStartRecording(true); // Set flag to auto-start recording
    preparationTimerRef.current = setInterval(() => {
      setPreparationTime(prev => {
        if (prev <= 1) {
          clearInterval(preparationTimerRef.current);
          setIsPreparingPart2(false);
          // Auto-start will be triggered by useEffect
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Determine current part based on question index
  const getCurrentPartInfo = () => {
    if (!currentTest) return null;

    const part1Length = currentTest.testStructure.part1.questions.length;
    const part2Index = part1Length;
    const part3StartIndex = part1Length + 1;

    if (currentQuestionIndex < part1Length) {
      return { part: 1, info: currentTest.testStructure.part1 };
    } else if (currentQuestionIndex === part2Index) {
      return { part: 2, info: currentTest.testStructure.part2 };
    } else {
      return { part: 3, info: currentTest.testStructure.part3 };
    }
  };

  // Start Part 2 preparation
  const startPart2Preparation = () => {
    setIsPreparingPart2(true);
    setPreparationNotes("");
    startPreparationTimer();
  };

  // UPDATED: Separated recording logic for reuse
  const startRecording = async () => {
    // Initialize AudioContext on first user interaction
    if (pronunciationAnalyzer && !pronunciationAnalyzer.audioContext) {
      try {
        await pronunciationAnalyzer.initialize();
      } catch (error) {
        console.warn('AudioContext initialization error:', error);
      }
    }

    // Check browser support
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setError("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false
        }
      });

      currentStreamRef.current = stream;

      // Start pronunciation analysis
      if (pronunciationAnalyzer && pronunciationAnalyzer.audioContext) {
        try {
          pronunciationAnalyzer.reset();
          await pronunciationAnalyzer.startAnalysis(stream);
          setIsAnalyzingPronunciation(true);
        } catch (analysisError) {
          console.warn('Pronunciation analysis failed:', analysisError);
        }
      }

      // Setup speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setRecording(true);
        setError(null);
        startRecordingTimer();
      };

      recognition.onresult = (event) => {
        const speechText = Array.from(event.results).map(result => result[0].transcript).join(" ");
        setAnswers(prev => {
          const newAnswers = [...prev];
          newAnswers[currentQuestionIndex] = speechText.trim();
          return newAnswers;
        });
      };

      recognition.onend = () => {
        setRecording(false);
        stopRecordingTimer();
      };

      recognition.onerror = (event) => {
        setError(`Speech recognition error: ${event.error}. Please try again.`);
        setRecording(false);
        stopRecordingTimer();
        setIsAnalyzingPronunciation(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setError("Failed to access microphone. Please check permissions and try again.");
      console.error("Microphone access error:", err);
    }
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    if (pronunciationAnalyzer && isAnalyzingPronunciation) {
      pronunciationAnalyzer.stopAnalysis();
      const features = pronunciationAnalyzer.getFeatures();
      setAudioFeatures(prev => ({ ...prev, [currentQuestionIndex]: features }));
      setIsAnalyzingPronunciation(false);
    }
    if (currentStreamRef.current) {
      currentStreamRef.current.getTracks().forEach(track => track.stop());
    }
    // Add auto-advance to next question (Part 3)
    setTimeout(goNext, 1500);
  };

  // UPDATED: Toggle recording function
  const toggleRecording = async () => {
    if (recording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  // Navigation functions
  const goNext = () => {
    if (currentQuestionIndex < currentTest.totalQuestions - 1) {
      const nextIndex = currentQuestionIndex + 1;
      const nextPartInfo = getCurrentPartInfo();

      // Check if moving to Part 2
      if (nextPartInfo?.part === 2 && currentQuestionIndex + 1 === currentTest.testStructure.part1.questions.length) {
        setCurrentPart(2);
      } else if (nextPartInfo?.part === 3 && !currentPart === 3) {
        setCurrentPart(3);
      }

      setCurrentQuestionIndex(nextIndex);
    }
  };

  const goPrev = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);

      // Update current part
      const partInfo = getCurrentPartInfo();
      if (partInfo) {
        setCurrentPart(partInfo.part);
      }
    }
  };

  // Submit test
  const submitTest = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId: currentTest.testId,
          questions: currentTest.allQuestions.map(q => q.prompt),
          answers,
          audioFeatures,
          testType: "IELTS_AUTHENTIC"
        }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      setFeedbacks(data.feedbacks);
      setTestSummary(data.testSummary);
      setShowResults(true);
    } catch (err) {
      // Build detailed error message including response info when available
      let errorMessage = err?.message || "Unknown error";
      if (err?.response) {
        const { status, statusText } = err.response;
        errorMessage += ` (status ${status}${statusText ? `: ${statusText}` : ""})`;
      }

      console.error("Analysis error:", errorMessage, err);
      setError(
        `Analysis failed: ${errorMessage}. Please check your connection or ensure the backend is available.`
      );
    } finally {
      setLoading(false);
    }
  };

  // Reset test
  const resetTest = () => {
    const newTest = createIELTSTest();
    setCurrentTest(newTest);
    setAnswers(Array(newTest.totalQuestions).fill(""));
    setCurrentQuestionIndex(0);
    setCurrentPart(1);
    setFeedbacks(null);
    setTestSummary(null);
    setShowResults(false);
    setError(null);
    setRecordingTime(0);
    setPreparationTime(0);
    setIsPreparingPart2(false);
    setPreparationNotes("");
    setAutoStartRecording(false);
    if (pronunciationAnalyzer) pronunciationAnalyzer.reset();
  };

  // Get band color
  const getBandColor = (band) => {
    if (band >= 8.5) return "#2e7d32";
    if (band >= 7) return "#388e3c";
    if (band >= 6.5) return "#689f38";
    if (band >= 6) return "#afb42b";
    if (band >= 5.5) return "#f57f17";
    if (band >= 5) return "#ff8f00";
    if (band >= 4) return "#d32f2f";
    return "#d32f2f";
  };

  // Loading state
  if (!isComponentReady) {
    return (
      <div className="loading-container">
        <h2>Loading IELTS Speaking Test...</h2>
        {initializationError ? (
          <div className="error-message">
            <p>{initializationError}</p>
          </div>
        ) : (
          <p>Setting up authentic IELTS format with auto-recording...</p>
        )}
      </div>
    );
  }

  // Get current question and part info
  const currentQuestion = currentTest.allQuestions[currentQuestionIndex];
  const currentPartInfo = getCurrentPartInfo();

  // Results view
// Results view
if (showResults) {
  // ✅ NEW: Prevent crash if testSummary is null
  if (!testSummary) {
    return (
      <div className="results-container">
        <h2>IELTS Speaking Test Results</h2>
        <p className="error-message">No test summary data available. Please try again.</p>
        <button onClick={resetTest} className="btn-primary TakeAnother">
          Take Another Test
        </button>
      </div>
    );
  }

  const improvementData = [
    { name: "Fluency & Coherence", value: testSummary.fluency },
    { name: "Lexical Resource", value: testSummary.lexical },
    { name: "Grammatical Range & Accuracy", value: testSummary.grammar },
    { name: "Pronunciation", value: testSummary.pronunciation },
  ];

  const COLORS = improvementData.map((item) => getBandColor(item.value));

  return (
    <div className="results-container">
      <h2>IELTS Speaking Test Results</h2>

      <div className="test-summary">
        <h3>Overall Performance</h3>
        <div className="band-scores-grid">
          <div className="band-score">
            <span>Fluency & Coherence</span>
            <span style={{ color: getBandColor(testSummary.fluency) }}>
              {testSummary.fluency}
            </span>
          </div>
          <div className="band-score">
            <span>Lexical Resource</span>
            <span style={{ color: getBandColor(testSummary.lexical) }}>
              {testSummary.lexical}
            </span>
          </div>
          <div className="band-score">
            <span>Grammatical Range & Accuracy</span>
            <span style={{ color: getBandColor(testSummary.grammar) }}>
              {testSummary.grammar}
            </span>
          </div>
          <div className="band-score">
            <span>Pronunciation</span>
            <span style={{ color: getBandColor(testSummary.pronunciation) }}>
              {testSummary.pronunciation}
            </span>
          </div>
          <div className="band-score overall">
            <span>Overall Band Score</span>
            <span>{testSummary.overall}</span>
          </div>
        </div>

      </div>

      <div className="detailed-feedback">
  <h3>Detailed Question-by-Question Feedback</h3>
  {feedbacks.map((feedback, index) => (
    <details key={index} className="feedback-section" open={index === 0}>
      <summary
  className={index === 0 ? "feedback-summary overall-summary" : "feedback-summary"}
  style={index === 0 ? { color: testSummary?.overall >= 5 ? "#2e7d32" : "#d32f2f" } : {}}
>
  {index === 0 ? "Overall Performance" : `Question ${index} Feedback`}
</summary>
      <pre>{feedback.feedback}</pre>
    </details>
  ))}
</div>


      <div className="nav-buttons">
        <button onClick={resetTest} className="btn-primary TakeAnother">
          Take Another Test
        </button>
      </div>
    </div>
  );
}
  return (
    <div className="speech-evaluator">
      {/* Test Header */}
      <div className="test-header">
        <div className="test-info">
          <span className="progress">Question {currentQuestionIndex + 1} of {currentTest.totalQuestions}</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{width: `${(currentQuestionIndex / currentTest.totalQuestions) * 100}%`}}
          ></div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {/* Test Content */}
      <div className="test-content">
        {/* Part Indicator */}
        <div className="part-indicator">
          <h2>{currentPartInfo?.info.name}</h2>
          <p className="part-duration">Duration: {currentPartInfo?.info.duration}</p>
          {currentPartInfo?.part === 1 && (
            <p className="part-description">
              Topics: {currentPartInfo.info.topics.join(" & ")} ({currentPartInfo.info.questions.length} questions)
            </p>
          )}
          {currentPartInfo?.part === 2 && (
            <p className="part-description">
              📝 1-minute preparation → 🎤 Auto-recording starts → 🗣️ Speak for 1-2 minutes
            </p>
          )}
          {currentPartInfo?.part === 3 && (
            <p className="part-description">
              Theme: {currentPartInfo.info.theme} ({currentPartInfo.info.questions.length} questions)
            </p>
          )}
        </div>

        {/* Part 2 Preparation Phase - Show button when not preparing */}
        {currentPartInfo?.part === 2 && !isPreparingPart2 && preparationTime === 0 && !recording && (
          <div className="part2-preparation-intro">
            <h3>📝 Part 2: Preparation Phase</h3>
            <p>Click the button below to see your cue card and start the 1-minute preparation timer.</p>
            <p>After preparation ends, recording will start automatically.</p>
            <button onClick={startPart2Preparation} className="btn-primary">
              Start Preparation (1 minute)
            </button>
          </div>
        )}

        {/* Part 2 Cue Card - Show only during preparation */}
        {currentPartInfo?.part === 2 && isPreparingPart2 && (
          <div className="preparation-phase">
            <h3>⏱️ Preparation Time Remaining: {formatTime(preparationTime)}</h3>
            {preparationTime <= 5 && (
              <div className="countdown-warning">
                <p className="auto-start-notice">🎤 Recording will start automatically when timer reaches 0:00</p>
              </div>
            )}
            <div className="cue-card">
              <h4>{currentQuestion.cueCard.mainPrompt}</h4>
              <p>You should say:</p>
              <ul>
                {currentQuestion.cueCard.bulletPoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>
            
            <div className="preparation-notes">
              <label htmlFor="prep-notes">📝 Your preparation notes (optional):</label>
              <textarea
                id="prep-notes"
                value={preparationNotes}
                onChange={(e) => setPreparationNotes(e.target.value)}
                placeholder="Jot down key points here..."
                rows="4"
              />
            </div>
          </div>
        )}

        {/* Part 2 Recording Phase - Show only when recording */}
        {currentPartInfo?.part === 2 && recording && (
          <div className="recording-section">
            <div className="auto-recording-status">
              <span className="recording-indicator">🔴 Recording</span>
              <span className="recording-time">Time: {formatTime(recordingTime)}</span>
            </div>
            <p className="recording-instruction">Speak for 1-2 minutes covering all the points mentioned in the cue card.</p>
            <button onClick={stopRecording} className="record-button recording">
              ⏹️ Stop Recording
            </button>
          </div>
        )}

        {/* Regular Question Section for Parts 1 & 3 */}
        {currentPartInfo?.part !== 2 && (
          <>
            <div className="question-section">
              <div className="question-header">
                <span className="question-number">Question {currentQuestionIndex + 1}</span>
                <span className="topic-badge">{currentQuestion.topicName || currentQuestion.category}</span>
              </div>
              <div className="question-content">
                <h3>{currentQuestion.prompt}</h3>
                <div className="duration-guide">
                  <span>⏱️ Expected duration: 20-30 seconds</span>
                </div>
              </div>
            </div>

            {/* Recording Controls for Parts 1 & 3 */}
            <div className="recording-section">
              <div className="recording-controls">
                {!recording ? (
                  <button onClick={startRecording} className="record-button">
                    🎤 Start Recording
                  </button>
                ) : (
                  <>
                    <p>You may now begin speaking. Recording time: <strong>{formatTime(recordingTime)}</strong></p>
                    <button onClick={stopRecording} className="record-button recording">
                      ⏹️ Stop Recording
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* Answer Section */}
        <div className="answer-section">
          <label htmlFor="answer">Your transcribed answer:</label>
          <textarea
            id="answer"
            value={answers[currentQuestionIndex] || ""}
            onChange={(e) => {
              const newAnswers = [...answers];
              newAnswers[currentQuestionIndex] = e.target.value;
              setAnswers(newAnswers);
            }}
            disabled={recording}
            placeholder="Your answer will appear here during recording..."
          />
          
          {currentPartInfo?.part === 2 && preparationNotes && (
            <div className="notes-reference">
              <h4>Your preparation notes:</h4>
              <p>{preparationNotes}</p>
            </div>
          )}
        </div>

        {/* Navigation Section */}
        <div className="navigation-section">
          <div className="nav-buttons">
            <button 
              onClick={goPrev} 
              disabled={currentQuestionIndex === 0}
              className="btn-secondary"
            >
              ← Previous
            </button>
            
            <div className="progress-info">
              <p><strong>Part 1:</strong> {currentTest.testStructure.part1.questions.length} questions | 
                 <strong> Part 2:</strong> 1 cue card (auto-record) | 
                 <strong> Part 3:</strong> {currentTest.testStructure.part3.questions.length} questions</p>
              <p>Progress: {answers.filter(a => a.trim().length > 0).length} / {currentTest.totalQuestions} questions answered</p>
            </div>

           {currentQuestionIndex < currentTest.totalQuestions - 1 ? (
  <button onClick={goNext} className="btn-primary">Next →</button>
) : (
  <button
    onClick={submitTest}
    disabled={loading || recording}
    className="btn-success"
  >
    {loading ? "Analyzing..." : "Submit Test"}
  </button>
)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SpeechEvaluator;