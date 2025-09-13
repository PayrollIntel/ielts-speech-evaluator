const https = require('https');
const querystring = require('querystring');

// Grammar check using LanguageTool API
async function grammarCheck(text) {
  return new Promise((resolve) => {
    const postData = querystring.stringify({
      'text': text,
      'language': 'en-US',
      'enabledRules': 'GRAMMAR,TYPOS,STYLE',
      'disabledRules': 'UPPERCASE_SENTENCE_START,WHITESPACE_RULE,SENTENCE_WHITESPACE'
    });

    const options = {
      hostname: 'api.languagetool.org',
      port: 443,
      path: '/v2/check',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          const matches = result.matches.filter(
            m => !['UPPERCASE_SENTENCE_START', 'WHITESPACE_RULE', 'SENTENCE_WHITESPACE'].includes(m.rule.id)
          );
          resolve({ matches, success: true });
        } catch (error) {
          console.error('Grammar check parse error:', error);
          resolve({ matches: [], success: false, error: error.message });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Grammar check request error:', error);
      resolve({ matches: [], success: false, error: error.message });
    });

    req.write(postData);
    req.end();

    // 10 second timeout
    setTimeout(() => {
      req.destroy();
      resolve({ matches: [], success: false, error: 'Request timeout' });
    }, 10000);
  });
}

// IELTS Band calculation
function calculateIELTSBands(grammarMatches, text, audioFeatures, questionPart) {
  const wordCount = text.split(' ').length;
  let fluency = 7;
  let lexical = 6.5;
  let grammar = 7;
  let pronunciation = 6.5;

  // Adjust for grammar errors
  if (grammarMatches.length > 0) {
    grammar = Math.max(grammar - (grammarMatches.length * 0.5), 4);
  }

  // Part-specific adjustments
  if (questionPart === 1) {
    if (wordCount < 15) {
      fluency = Math.max(fluency - 0.5, 1);
    } else if (wordCount > 100) {
      fluency = Math.max(fluency - 0.25, 1);
    }
  } else if (questionPart === 2) {
    if (wordCount < 100) {
      fluency = Math.max(fluency - 1, 1);
    } else if (wordCount > 300) {
      fluency = Math.min(fluency + 0.25, 9);
    }
  } else if (questionPart === 3) {
    if (wordCount < 30) {
      fluency = Math.max(fluency - 0.75, 1);
    }
    
    // Check for analytical language
    const analyticalWords = ['however', 'therefore', 'furthermore', 'on the other hand', 'in contrast', 'consequently', 'moreover', 'nevertheless'];
    const hasAnalyticalLanguage = analyticalWords.some(word => text.toLowerCase().includes(word));
    if (hasAnalyticalLanguage) {
      lexical = Math.min(lexical + 0.25, 9);
    }
  }

  const overall = Math.round(((fluency + lexical + grammar + pronunciation) / 4) * 2) / 2;

  return {
    fluency,
    lexical,
    grammar,
    pronunciation,
    overall,
    metrics: { wordCount }
  };
}

// Generate IELTS feedback
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

  // Detailed feedback
  const strengths = [];
  const improvements = [];

  // Fluency Analysis
  if (bands.fluency >= 7) {
    strengths.push("Good fluency and natural flow of speech");
  } else if (bands.fluency >= 5) {
    improvements.push("Work on speaking more fluently with fewer pauses");
  } else {
    improvements.push("Practice speaking more continuously - reduce hesitation and repetition");
  }

  // Lexical Analysis
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

// Simple relevance check
async function getRelevanceScore(prompt, answer) {
  if (!prompt || !answer) return 0;
  
  const promptWords = prompt.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  const answerWords =
