const axios = require('axios');
const bandScorer = require('../../bandScorer');
const { getRelevanceScore } = require('../../relevanceChecker');

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

function determineQuestionPart(questionIndex, totalQuestions) {
  if (questionIndex < 12) return 1; // First 12 questions are Part 1
  if (questionIndex === 12) return 2; // Question 13 is Part 2
  return 3; // Remaining questions are Part 3
}

module.exports = {
  grammarCheck,
  calculateIELTSBands,
  generateIELTSFeedback,
  determineQuestionPart,
  getRelevanceScore
};
