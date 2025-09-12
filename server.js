const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const bandScorer = require('./bandScorer');
const { getRelevanceScore } = require('./relevanceChecker');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
}

// Grammar checking function
async function grammarCheck(text) {
  try {
    const response = await axios({
      method: 'POST',
      url: 'https://api.languagetool.org/v2/check',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: new URLSearchParams({
        text,
        language: 'en-US',
        enabledRules: 'GRAMMAR,TYPOS,STYLE',
        disabledRules: 'UPPERCASE_SENTENCE_START,WHITESPACE_RULE,SENTENCE_WHITESPACE',
      }).toString(),
      timeout: 10000,
    });

    const matches = response.data.matches.filter(
      m => !['UPPERCASE_SENTENCE_START', 'WHITESPACE_RULE', 'SENTENCE_WHITESPACE'].includes(m.rule.id)
    );

    return { matches, success: true };
  } catch (err) {
    console.error('Grammar check error:', err.message);
    return { matches: [], success: false, error: err.message };
  }
}

// Enhanced band scoring for IELTS format
function calculateIELTSBands(grammarMatches, text, audioFeatures, questionPart) {
  const bands = bandScorer.calculateBands(grammarMatches, text, audioFeatures);
  
  // Adjust scoring based on IELTS part requirements
  if (questionPart === 1) {
    // Part 1 requires concise, clear answers
    const wordCount = text.split(' ').length;
    if (wordCount < 15) {
      // Too short for Part 1
      bands.fluency = Math.max(bands.fluency - 0.5, 1);
    } else if (wordCount > 100) {
      // Too long for Part 1 - should be concise
      bands.fluency = Math.max(bands.fluency - 0.25, 1);
    }
  } else if (questionPart === 2) {
    // Part 2 requires extended speaking (1-2 minutes)
    const wordCount = text.split(' ').length;
    if (wordCount < 100) {
      // Too short for Part 2
      bands.fluency = Math.max(bands.fluency - 1, 1);
      bands.overall = Math.max(bands.overall - 0.5, 1);
    } else if (wordCount > 300) {
      // Good length for Part 2
      bands.fluency = Math.min(bands.fluency + 0.25, 9);
    }
  } else if (questionPart === 3) {
    // Part 3 requires analytical, extended responses
    const wordCount = text.split(' ').length;
    if (wordCount < 30) {
      // Too short for Part 3 analytical questions
      bands.fluency = Math.max(bands.fluency - 0.75, 1);
    }
    
    // Check for analytical language
    const analyticalWords = ['however', 'therefore', 'furthermore', 'on the other hand', 'in contrast', 'consequently', 'moreover', 'nevertheless'];
    const hasAnalyticalLanguage = analyticalWords.some(word => text.toLowerCase().includes(word));
    if (hasAnalyticalLanguage) {
      bands.lexical = Math.min(bands.lexical + 0.25, 9);
    }
  }

  return bands;
}

// Generate IELTS-specific feedback
function generateIELTSFeedback(bands, metrics, grammarMatches, audioFeatures, questionPart, questionIndex) {
  let feedback = '';
  
  // Part-specific feedback
  if (questionPart === 1) {
    feedback += `**Part 1 - Question ${questionIndex + 1}** 📝\n\n`;
    feedback += `This is an introduction and interview question. Your response should be concise but complete.\n\n`;
  } else if (questionPart === 2) {
    feedback += `**Part 2 - Cue Card** 🎯\n\n`;
    feedback += `This is your individual long turn. You should speak for 1-2 minutes covering all bullet points.\n\n`;
  } else if (questionPart === 3) {
    feedback += `**Part 3 - Discussion Question ${questionIndex + 1}** 💭\n\n`;
    feedback += `This requires analytical thinking and extended responses with examples and explanations.\n\n`;
  }

  // Band scores
  feedback += `**Band Scores:**\n`;
  feedback += `• Fluency & Coherence: ${bands.fluency}/9\n`;
  feedback += `• Lexical Resource: ${bands.lexical}/9\n`;
  feedback += `• Grammar Range & Accuracy: ${bands.grammar}/9\n`;
  feedback += `• Pronunciation: ${bands.pronunciation}/9\n`;
  feedback += `• **Overall: ${bands.overall}/9**\n\n`;

  // Detailed feedback based on IELTS criteria
  const strengths = [];
  const improvements = [];

  // Fluency & Coherence Analysis
  if (bands.fluency >= 7) {
    strengths.push("Good fluency and natural flow of speech");
  } else if (bands.fluency >= 5) {
    improvements.push("Work on speaking more fluently with fewer pauses");
  } else {
    improvements.push("Practice speaking more continuously - reduce hesitation and repetition");
  }

  // Lexical Resource Analysis
  if (bands.lexical >= 7) {
    strengths.push("Good range of vocabulary with appropriate usage");
  } else if (bands.lexical >= 5) {
    improvements.push("Expand your vocabulary and use more varied expressions");
  } else {
    improvements.push("Focus on building fundamental vocabulary and avoiding repetition");
  }

  // Grammar Analysis
  if (grammarMatches.length === 0) {
    strengths.push("No major grammar errors detected");
  } else if (grammarMatches.length <= 2) {
    improvements.push(`Minor grammar issues: ${grammarMatches.length} errors found`);
  } else {
    improvements.push(`Grammar needs attention: ${grammarMatches.length} errors found`);
  }

  // Part-specific feedback
  if (questionPart === 1) {
    const wordCount = metrics.wordCount || 0;
    if (wordCount >= 20 && wordCount <= 60) {
      strengths.push("Appropriate length for Part 1 response");
    } else if (wordCount < 20) {
      improvements.push("Extend your answers slightly - provide more detail");
    } else {
      improvements.push("Keep Part 1 answers more concise and to the point");
    }
  } else if (questionPart === 2) {
    const wordCount = metrics.wordCount || 0;
    if (wordCount >= 150) {
      strengths.push("Good length for extended speaking in Part 2");
    } else {
      improvements.push("Speak for longer - aim for 1.5-2 minutes in Part 2");
    }
  } else if (questionPart === 3) {
    const wordCount = metrics.wordCount || 0;
    if (wordCount >= 40) {
      strengths.push("Good depth of response for analytical discussion");
    } else {
      improvements.push("Provide more detailed, analytical responses in Part 3");
    }
  }

  // Pronunciation feedback
  if (audioFeatures && audioFeatures.analysis) {
    const analysis = audioFeatures.analysis;
    if (analysis.stressAccuracy > 0.6) {
      strengths.push("Good word stress patterns");
    } else {
      improvements.push("Work on word stress and rhythm");
    }
  }

  // Compile feedback
  if (strengths.length > 0) {
    feedback += `**Strengths:** ✅\n`;
    strengths.forEach(strength => feedback += `• ${strength}\n`);
    feedback += '\n';
  }

  if (improvements.length > 0) {
    feedback += `**Areas for Improvement:** 📈\n`;
    improvements.forEach(improvement => feedback += `• ${improvement}\n`);
    feedback += '\n';
  }

  // Grammar errors detail
  if (grammarMatches.length > 0) {
    feedback += `**Grammar Issues:** ⚠️\n`;
    grammarMatches.slice(0, 3).forEach(match => {
      feedback += `• ${match.message}\n`;
    });
    if (grammarMatches.length > 3) {
      feedback += `• ... and ${grammarMatches.length - 3} more issues\n`;
    }
    feedback += '\n';
  }

  return feedback;
}

// Determine question part from index and total structure
function determineQuestionPart(questionIndex, totalQuestions) {
  // This is a simplified approach - in real implementation, 
  // you'd pass the actual part information from the frontend
  if (questionIndex < 12) return 1; // First 12 questions are Part 1
  if (questionIndex === 12) return 2; // Question 13 is Part 2 (cue card)
  return 3; // Remaining questions are Part 3
}

// Single-answer analysis endpoint
app.post('/api/analyze', async (req, res) => {
  const { text, audioFeatures, prompt, questionPart, questionIndex } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'No text provided' });
  }

  try {
    // Grammar and band scoring
    const grammarResult = await grammarCheck(text);
    let bands = calculateIELTSBands(grammarResult.matches, text, audioFeatures, questionPart);

    // Relevance checking
    const relevance = await getRelevanceScore(prompt || '', text);
    const RELEVANCE_THRESHOLD = 0.5;
    let relevanceWarning = '';

    if (relevance < RELEVANCE_THRESHOLD) {
      relevanceWarning = `\n\n⚠️ Relevance Warning: Off-topic answer (score ${relevance.toFixed(2)}).`;
      if (relevance === 0) {
        relevanceWarning += ` Your answer is completely off-topic. Please address the question directly.`;
      }
      bands.overall = Math.max(bands.overall - 0.5, 1);
    }

    // Generate IELTS-specific feedback
    const feedback = generateIELTSFeedback(
      bands, 
      bands.metrics, 
      grammarResult.matches, 
      audioFeatures, 
      questionPart,
      questionIndex || 0
    ) + relevanceWarning;

    return res.json({
      feedback,
      fluency: bands.fluency,
      lexical: bands.lexical,
      grammar: bands.grammar,
      pronunciation: bands.pronunciation,
      overall: bands.overall,
      relevanceScore: relevance,
      grammarErrors: grammarResult.matches.length,
    });

  } catch (err) {
    console.error('Analysis error:', err);
    return res.status(500).json({ error: 'Analysis error occurred', details: err.message });
  }
});

// Enhanced batch analysis endpoint for IELTS format
app.post('/api/analyze-batch', async (req, res) => {
  const { testId, questions, answers, audioFeatures, testType } = req.body;

  if (!Array.isArray(questions) || !Array.isArray(answers) || questions.length !== answers.length) {
    return res.status(400).json({ error: 'Invalid request format' });
  }

  try {
    const feedbacks = [];
    let totalFluency = 0, totalLex = 0, totalGram = 0, totalPron = 0, totalRelevance = 0, count = 0;

    // Track scores by part for IELTS-specific analysis
    const partScores = { part1: [], part2: [], part3: [] };

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const text = answers[i] || '';
      const features = audioFeatures?.[i];

      if (!text.trim()) {
        feedbacks.push({
          feedback: `**Question ${i + 1}: "${question}"**\n\nNo response provided.`,
          overall: 0,
        });
        continue;
      }

      // Determine which part this question belongs to
      const questionPart = determineQuestionPart(i, questions.length);

      const grammarResult = await grammarCheck(text);
      let bands = calculateIELTSBands(grammarResult.matches, text, features, questionPart);
      const relevance = await getRelevanceScore(question, text);

      if (relevance < 0.5) {
        bands.overall = Math.max(bands.overall - 0.5, 1);
      }

      let fb = `**Question ${i + 1}: "${question}"**\n\n`;
      fb += generateIELTSFeedback(bands, bands.metrics, grammarResult.matches, features, questionPart, i);

      if (relevance < 0.5) {
        fb += `\n\n⚠️ Relevance Warning: Off-topic (score ${relevance.toFixed(2)})`;
        if (relevance === 0) {
          fb += ` Your answer is completely off-topic. Please address the question directly.`;
        }
      }

      feedbacks.push({ feedback: fb, overall: bands.overall });

      // Track scores by part
      partScores[`part${questionPart}`].push({
        fluency: bands.fluency,
        lexical: bands.lexical,
        grammar: bands.grammar,
        pronunciation: bands.pronunciation,
        overall: bands.overall
      });

      totalFluency += bands.fluency;
      totalLex += bands.lexical;
      totalGram += bands.grammar;
      totalPron += bands.pronunciation;
      totalRelevance += relevance;
      count++;
    }

    // Calculate overall summary with IELTS-specific weighting
    const summary = count ? {
      fluency: Math.round((totalFluency / count) * 2) / 2,
      lexical: Math.round((totalLex / count) * 2) / 2,
      grammar: Math.round((totalGram / count) * 2) / 2,
      pronunciation: Math.round((totalPron / count) * 2) / 2,
      overall: Math.round(((totalFluency + totalLex + totalGram + totalPron) / (count * 4)) * 2) / 2,
      avgRelevance: totalRelevance / count,
      // IELTS-specific metrics
      partBreakdown: {
        part1Average: partScores.part1.length > 0 ? 
          partScores.part1.reduce((sum, score) => sum + score.overall, 0) / partScores.part1.length : 0,
        part2Score: partScores.part2.length > 0 ? partScores.part2[0].overall : 0,
        part3Average: partScores.part3.length > 0 ? 
          partScores.part3.reduce((sum, score) => sum + score.overall, 0) / partScores.part3.length : 0
      }
    } : null;

    // Add IELTS-specific summary feedback
    if (summary) {
      let summaryFeedback = '\n\n**IELTS Speaking Test Summary** 🎯\n\n';
      summaryFeedback += `**Overall Band Score: ${summary.overall}/9**\n\n`;
      
      summaryFeedback += `**Performance by Part:**\n`;
      summaryFeedback += `• Part 1 (Introduction): ${summary.partBreakdown.part1Average.toFixed(1)}/9\n`;
      summaryFeedback += `• Part 2 (Cue Card): ${summary.partBreakdown.part2Score.toFixed(1)}/9\n`;
      summaryFeedback += `• Part 3 (Discussion): ${summary.partBreakdown.part3Average.toFixed(1)}/9\n\n`;

      summaryFeedback += `**Key Recommendations:**\n`;
      if (summary.overall < 6) {
        summaryFeedback += `• Focus on fundamental speaking skills - fluency, basic grammar, and vocabulary\n`;
        summaryFeedback += `• Practice speaking for appropriate durations in each part\n`;
      } else if (summary.overall < 7) {
        summaryFeedback += `• Work on expressing ideas more clearly and coherently\n`;
        summaryFeedback += `• Expand vocabulary range and use more complex grammar\n`;
      } else {
        summaryFeedback += `• Fine-tune pronunciation and natural delivery\n`;
        summaryFeedback += `• Practice using sophisticated vocabulary and grammar accurately\n`;
      }

      // Add summary to the beginning of feedbacks
      feedbacks.unshift({ feedback: summaryFeedback, overall: summary.overall });
    }

    return res.json({ testId, feedbacks, testSummary: summary });

  } catch (err) {
    console.error('Batch analysis error:', err);
    return res.status(500).json({ error: 'Batch analysis error', details: err.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '3.1.0 - IELTS Format',
  });
});

// Serve React app fallback in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

// Error handler middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`IELTS Speaking Evaluator Backend listening on port ${PORT}`);
  console.log('Supporting authentic IELTS format: Part 1 (12-13 questions), Part 2 (1 cue card), Part 3 (4-6 discussion questions)');
});