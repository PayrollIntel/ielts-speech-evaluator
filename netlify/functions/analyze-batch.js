const { grammarCheck, calculateIELTSBands, generateIELTSFeedback, determineQuestionPart } = require('../../utils/analysis');
const { getRelevanceScore } = require('../../relevanceChecker');

exports.handler = async (event, context) => {
  try {
    const { testId, questions, answers, audioFeatures } = JSON.parse(event.body || '{}');

    if (!Array.isArray(questions) || !Array.isArray(answers) || questions.length !== answers.length) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request format' }) };
    }

    const feedbacks = [];
    let totalFluency = 0, totalLex = 0, totalGram = 0, totalPron = 0, totalRelevance = 0, count = 0;
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
          fb += ' Your answer is completely off-topic. Please address the question directly.';
        }
      }

      feedbacks.push({ feedback: fb, overall: bands.overall });

      partScores[`part${questionPart}`].push({
        fluency: bands.fluency,
        lexical: bands.lexical,
        grammar: bands.grammar,
        pronunciation: bands.pronunciation,
        overall: bands.overall,
      });

      totalFluency += bands.fluency;
      totalLex += bands.lexical;
      totalGram += bands.grammar;
      totalPron += bands.pronunciation;
      totalRelevance += relevance;
      count++;
    }

    const summary = count ? {
      fluency: Math.round((totalFluency / count) * 2) / 2,
      lexical: Math.round((totalLex / count) * 2) / 2,
      grammar: Math.round((totalGram / count) * 2) / 2,
      pronunciation: Math.round((totalPron / count) * 2) / 2,
      overall: Math.round(((totalFluency + totalLex + totalGram + totalPron) / (count * 4)) * 2) / 2,
      avgRelevance: totalRelevance / count,
      partBreakdown: {
        part1Average: partScores.part1.length > 0 ?
          partScores.part1.reduce((sum, score) => sum + score.overall, 0) / partScores.part1.length : 0,
        part2Score: partScores.part2.length > 0 ? partScores.part2[0].overall : 0,
        part3Average: partScores.part3.length > 0 ?
          partScores.part3.reduce((sum, score) => sum + score.overall, 0) / partScores.part3.length : 0,
      },
    } : null;

    if (summary) {
      let summaryFeedback = '\n\n**IELTS Speaking Test Summary** 🎯\n\n';
      summaryFeedback += `**Overall Band Score: ${summary.overall}/9**\n\n`;
      summaryFeedback += `**Performance by Part:**\n`;
      summaryFeedback += `• Part 1 (Introduction): ${summary.partBreakdown.part1Average.toFixed(1)}/9\n`;
      summaryFeedback += `• Part 2 (Cue Card): ${summary.partBreakdown.part2Score.toFixed(1)}/9\n`;
      summaryFeedback += `• Part 3 (Discussion): ${summary.partBreakdown.part3Average.toFixed(1)}/9\n\n`;
      summaryFeedback += `**Key Recommendations:**\n`;
      if (summary.overall < 6) {
        summaryFeedback += '• Focus on fundamental speaking skills - fluency, basic grammar, and vocabulary\n';
        summaryFeedback += '• Practice speaking for appropriate durations in each part\n';
      } else if (summary.overall < 7) {
        summaryFeedback += '• Work on expressing ideas more clearly and coherently\n';
        summaryFeedback += '• Expand vocabulary range and use more complex grammar\n';
      } else {
        summaryFeedback += '• Fine-tune pronunciation and natural delivery\n';
        summaryFeedback += '• Practice using sophisticated vocabulary and grammar accurately\n';
      }
      feedbacks.unshift({ feedback: summaryFeedback, overall: summary.overall });
    }

    return { statusCode: 200, body: JSON.stringify({ testId, feedbacks, testSummary: summary }) };
  } catch (err) {
    console.error('Batch analysis error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Batch analysis error', details: err.message }) };
  }
};

