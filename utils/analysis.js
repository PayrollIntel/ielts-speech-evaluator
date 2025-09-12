const axios = require('axios');
const bandScorer = require('../bandScorer');

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
    const wordCount = text.split(' ').length;
    if (wordCount < 15) {
      bands.fluency = Math.max(bands.fluency - 0.5, 1);
    } else if (wordCount > 100) {
      bands.fluency = Math.max(bands.fluency - 0.25, 1);
    }
  } else if (questionPart === 2) {
    const wordCount = text.split(' ').length;
    if (wordCount < 100) {
      bands.fluency = Math.max(bands.fluency - 1, 1);
      bands.overall = Math.max(bands.overall - 0.5, 1);
    } else if (wordCount > 300) {
      bands.fluency = Math.min(bands.fluency + 0.25, 9);
    }
  } else if (questionPart === 3) {
    const wordCount = text.split(' ').length;
    if (wordCount < 30) {
      bands.fluency = Math.max(bands.fluency - 0.75, 1);
    }

    const analyticalWords = ['however', 'therefore', 'furthermore', 'on the other hand', 'in contrast', 'consequently', 'moreover', 'nevertheless'];
    const hasAnalyticalLanguage = analyticalWords.some(word => text.toLowerCase().includes(word));
    if (hasAnalyticalLanguage) {
      bands.lexical = Math.min(bands.lexical + 0.25, 9);
    }
  }

  return bands;
}

function generateIELTSFeedback(bands, metrics, grammarMatches, audioFeatures, questionPart, questionIndex) {
  let feedback = '';

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

  feedback += `**Band Scores:**\n`;
  feedback += `• Fluency & Coherence: ${bands.fluency}/9\n`;
  feedback += `• Lexical Resource: ${bands.lexical}/9\n`;
  feedback += `• Grammar Range & Accuracy: ${bands.grammar}/9\n`;
  feedback += `• Pronunciation: ${bands.pronunciation}/9\n`;
  feedback += `• **Overall: ${bands.overall}/9**\n\n`;

  const strengths = [];
  const improvements = [];

  if (bands.fluency >= 7) {
    strengths.push('Good fluency and natural flow of speech');
  } else if (bands.fluency >= 5) {
    improvements.push('Work on speaking more fluently with fewer pauses');
  } else {
    improvements.push('Practice speaking more continuously - reduce hesitation and repetition');
  }

  if (bands.lexical >= 7) {
    strengths.push('Good range of vocabulary with appropriate usage');
  } else if (bands.lexical >= 5) {
    improvements.push('Expand your vocabulary and use more varied expressions');
  } else {
    improvements.push('Focus on building fundamental vocabulary and avoiding repetition');
  }

  if (grammarMatches.length === 0) {
    strengths.push('No major grammar errors detected');
  } else if (grammarMatches.length <= 2) {
    improvements.push(`Minor grammar issues: ${grammarMatches.length} errors found`);
  } else {
    improvements.push(`Grammar needs attention: ${grammarMatches.length} errors found`);
  }

  if (questionPart === 1) {
    const wordCount = metrics.wordCount || 0;
    if (wordCount >= 20 && wordCount <= 60) {
      strengths.push('Appropriate length for Part 1 response');
    } else if (wordCount < 20) {
      improvements.push('Extend your answers slightly - provide more detail');
    } else {
      improvements.push('Keep Part 1 answers more concise and to the point');
    }
  } else if (questionPart === 2) {
    const wordCount = metrics.wordCount || 0;
    if (wordCount >= 150) {
      strengths.push('Good length for extended speaking in Part 2');
    } else {
      improvements.push('Speak for longer - aim for 1.5-2 minutes in Part 2');
    }
  } else if (questionPart === 3) {
    const wordCount = metrics.wordCount || 0;
    if (wordCount >= 40) {
      strengths.push('Good depth of response for analytical discussion');
    } else {
      improvements.push('Provide more detailed, analytical responses in Part 3');
    }
  }

  if (audioFeatures && audioFeatures.analysis) {
    const analysis = audioFeatures.analysis;
    if (analysis.stressAccuracy > 0.6) {
      strengths.push('Good word stress patterns');
    } else {
      improvements.push('Work on word stress and rhythm');
    }
  }

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
  if (questionIndex < 12) return 1;
  if (questionIndex === 12) return 2;
  return 3;
}

module.exports = {
  grammarCheck,
  calculateIELTSBands,
  generateIELTSFeedback,
  determineQuestionPart
};

