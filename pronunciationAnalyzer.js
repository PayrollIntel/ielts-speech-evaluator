// pronunciationAnalyzer.js - Improved Speech Analysis Module
// Drop-in replacement for previous version.
// Improvements:
//  - Fixed stress score scaling bug (removed accidental division by 2)
//  - More robust pitch detection (normalized autocorrelation + threshold)
//  - Safer energy threshold and syllable boundary handling
//  - Lowered brittle thresholds and improved defaults
//  - Optional debug logging

class PronunciationAnalyzer {
  constructor({ debug = false } = {}) {
    this.audioContext = null;
    this.analyser = null;
    this.mediaRecorder = null;
    this.features = {
      pitch: [],
      intensity: [],
      spectralCentroid: [],
      mfcc: [],
      zcr: [],
      rms: []
    };
    this.isAnalyzing = false;
    this.debug = debug;
  }

  async initialize() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
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
    
    // Configure analyser for speech analysis
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.85;
    this.analyser.minDecibels = -100;
    this.analyser.maxDecibels = -10;
    
    source.connect(this.analyser);
    
    this.isAnalyzing = true;
    this.startFeatureExtraction();
  }

  startFeatureExtraction() {
    const bufferLength = this.analyser.frequencyBinCount;
    const timeDomainSize = this.analyser.fftSize;
    const freqData = new Float32Array(bufferLength);
    const timeData = new Float32Array(timeDomainSize);

    const extractFeatures = () => {
      if (!this.isAnalyzing) return;

      // capture time/frequency domain
      this.analyser.getFloatFrequencyData(freqData);
      this.analyser.getFloatTimeDomainData(timeData);

      const timestamp = this.audioContext.currentTime;

      // Basic features
      const rms = this.calculateRMS(timeData);
      const zcr = this.calculateZCR(timeData);
      const spectralCentroid = this.calculateSpectralCentroid(freqData);
      const pitch = this.detectPitch(timeData);

      // store features with timestamps
      this.features.rms.push({ value: rms, timestamp });
      this.features.zcr.push({ value: zcr, timestamp });
      this.features.spectralCentroid.push({ value: spectralCentroid, timestamp });

      if (pitch && pitch > 50 && pitch < 800) {
        this.features.pitch.push({ frequency: pitch, timestamp });
      }

      // Limit arrays to reasonable lengths to avoid memory growth
      const maxStore = 800;
      Object.keys(this.features).forEach(k => {
        if (Array.isArray(this.features[k]) && this.features[k].length > maxStore) {
          this.features[k].splice(0, this.features[k].length - maxStore);
        }
      });

      if (this.debug) {
        // occasional debug logging, not every frame to avoid flooding
        if (Math.random() < 0.01) {
          console.log('PA debug sample:', {
            rms: rms.toFixed(4),
            zcr: zcr.toFixed(4),
            spectralCentroid: spectralCentroid.toFixed(2),
            latestPitch: (this.features.pitch.length ? this.features.pitch[this.features.pitch.length-1].frequency.toFixed(1) : null),
            time: timestamp.toFixed(3)
          });
        }
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
    
    const sr = (this.audioContext && this.audioContext.sampleRate) ? this.audioContext.sampleRate : 44100;
    for (let i = 0; i < freqData.length; i++) {
      // freqData is in dB from getFloatFrequencyData, convert to magnitude
      const magnitude = Math.pow(10, freqData[i] / 10);
      const frequency = (i * sr) / (2 * freqData.length);
      weightedSum += frequency * magnitude;
      magnitudeSum += magnitude;
    }
    
    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  }

  // Improved pitch detection: normalized autocorrelation + correlation threshold
  detectPitch(timeData) {
    const sr = (this.audioContext && this.audioContext.sampleRate) ? this.audioContext.sampleRate : 44100;
    const buffer = Float32Array.from(timeData);
    const n = buffer.length;

    // subtract mean (DC)
    let mean = 0;
    for (let i = 0; i < n; i++) mean += buffer[i];
    mean /= n;
    for (let i = 0; i < n; i++) buffer[i] -= mean;

    // compute energy at lag 0 (for normalization)
    let energy0 = 0;
    for (let i = 0; i < n; i++) energy0 += buffer[i] * buffer[i];
    if (energy0 <= 0.000001) return 0;

    // freq limits: focus on human voice (50-500 Hz typical for most speakers)
    const minFreq = 50;
    const maxFreq = 500;
    const minPeriod = Math.floor(sr / maxFreq);
    const maxPeriod = Math.min(Math.floor(sr / minFreq), Math.floor(n / 2));

    let bestCorr = 0;
    let bestPeriod = 0;

    for (let period = minPeriod; period <= maxPeriod; period++) {
      let corr = 0;
      for (let i = 0; i < n - period; i++) {
        corr += buffer[i] * buffer[i + period];
      }
      const normalizedCorr = corr / energy0; // normalized correlation coefficient
      if (normalizedCorr > bestCorr) {
        bestCorr = normalizedCorr;
        bestPeriod = period;
      }
    }

    // require a reasonable correlation peak to accept pitch
    if (bestCorr > 0.25 && bestPeriod > 0) {
      const freq = sr / bestPeriod;
      // sanity clamp
      if (freq >= minFreq && freq <= 800) return Math.round(freq);
    }

    return 0;
  }

  // energy threshold: use median-ish approach for stability
  calculateEnergyThreshold() {
    if (this.features.rms.length === 0) return 0.005;
    const energies = this.features.rms.map(r => r.value).sort((a, b) => a - b);
    const mid = energies[Math.floor(energies.length * 0.5)] || energies[0];
    // noise floor estimate: median * factor
    const threshold = Math.max(mid * 0.5, 0.003);
    return threshold;
  }

  detectSyllables() {
    const syllables = [];
    const energyThreshold = this.calculateEnergyThreshold();

    let currentSyllable = null;
    let inSyllable = false;

    this.features.rms.forEach((rmsData, index) => {
      const energy = rmsData.value;
      const isVoiced = energy > energyThreshold;

      if (isVoiced && !inSyllable) {
        currentSyllable = {
          startTime: rmsData.timestamp,
          startIndex: index,
          peakEnergy: energy,
          energySum: energy,
          pitchSum: 0,
          pitchCount: 0,
          samples: 1
        };
        inSyllable = true;
      } else if (isVoiced && inSyllable) {
        currentSyllable.peakEnergy = Math.max(currentSyllable.peakEnergy, energy);
        currentSyllable.energySum += energy;
        currentSyllable.samples++;

        // match pitch frame close to this timestamp
        const pitchData = this.features.pitch.find(p => Math.abs(p.timestamp - rmsData.timestamp) < 0.06);
        if (pitchData) {
          currentSyllable.pitchSum += pitchData.frequency;
          currentSyllable.pitchCount++;
        }
      } else if (!isVoiced && inSyllable) {
        currentSyllable.endTime = rmsData.timestamp;
        currentSyllable.duration = currentSyllable.endTime - currentSyllable.startTime;
        currentSyllable.avgEnergy = currentSyllable.energySum / currentSyllable.samples;
        currentSyllable.avgPitch = currentSyllable.pitchCount > 0 ? 
          currentSyllable.pitchSum / currentSyllable.pitchCount : 0;
        syllables.push(currentSyllable);
        currentSyllable = null;
        inSyllable = false;
      }
    });

    // flush if still in syllable at end
    if (inSyllable && currentSyllable) {
      currentSyllable.endTime = this.features.rms[this.features.rms.length - 1].timestamp;
      currentSyllable.duration = currentSyllable.endTime - currentSyllable.startTime;
      currentSyllable.avgEnergy = currentSyllable.energySum / Math.max(currentSyllable.samples, 1);
      currentSyllable.avgPitch = currentSyllable.pitchCount > 0 ? currentSyllable.pitchSum / currentSyllable.pitchCount : 0;
      syllables.push(currentSyllable);
    }

    return syllables;
  }

  // Multi-factor stress calculation — fixed scaling bug and more robust defaults
  calculateSyllableStress(syllable) {
    const avgIntensity = this.features.rms.length > 0 ?
      this.features.rms.reduce((sum, r) => sum + r.value, 0) / this.features.rms.length : 0.001;
    const avgPitch = this.features.pitch.length > 0 ?
      this.features.pitch.reduce((sum, p) => sum + p.frequency, 0) / this.features.pitch.length : 200;
    const avgDuration = 0.15; // reasonable default syllable duration

    // Intensity factor (40% weight)
    const intensityScore = Math.min(syllable.avgEnergy / Math.max(avgIntensity, 0.0001), 2.0);

    // Pitch factor (30% weight)
    const pitchScore = syllable.avgPitch > 0 ? Math.min(syllable.avgPitch / Math.max(avgPitch, 80), 2.0) : 1.0;

    // Duration factor (20% weight)
    const durationScore = Math.min((syllable.duration || avgDuration) / avgDuration, 2.0);

    // Spectral emphasis (10% weight)
    const spectralScore = this.calculateSpectralEmphasis(syllable);

    // NOTE: removed incorrect division by 2.0 (previous bug).
    const weighted = intensityScore * 0.4 + pitchScore * 0.3 + durationScore * 0.2 + spectralScore * 0.1;
    const stressScore = Math.min(weighted, 1.0);

    return stressScore;
  }

  calculateSpectralEmphasis(syllable) {
    const relevantCentroids = this.features.spectralCentroid.filter(sc => 
      sc.timestamp >= syllable.startTime && sc.timestamp <= (syllable.endTime || sc.timestamp)
    );

    if (relevantCentroids.length === 0) return 0.8; // neutral-ish default

    const avgCentroid = relevantCentroids.reduce((sum, sc) => sum + sc.value, 0) / relevantCentroids.length;
    const overallAvg = this.features.spectralCentroid.length > 0 ?
      this.features.spectralCentroid.reduce((sum, sc) => sum + sc.value, 0) / this.features.spectralCentroid.length : avgCentroid;

    // avoid division by very large/small numbers
    if (overallAvg <= 0) return 0.8;
    const ratio = avgCentroid / overallAvg;
    // map ratio to 0..2 range
    return Math.min(Math.max(ratio, 0.4), 2.0);
  }

  calculateRhythmScore(syllables) {
    if (!syllables || syllables.length < 3) return 0.5;

    const stressedSyllables = syllables.filter(s => this.calculateSyllableStress(s) > 0.6);
    if (stressedSyllables.length < 2) return 0.35;

    const intervals = [];
    for (let i = 1; i < stressedSyllables.length; i++) {
      intervals.push(stressedSyllables[i].startTime - stressedSyllables[i-1].startTime);
    }
    if (intervals.length === 0) return 0.5;

    const avgInterval = intervals.reduce((sum, v) => sum + v, 0) / intervals.length;
    const variance = intervals.reduce((sum, v) => sum + Math.pow(v - avgInterval, 2), 0) / intervals.length;
    const coefficient = Math.sqrt(variance) / Math.max(avgInterval, 0.001);

    return Math.max(0, 1 - coefficient);
  }

  calculateIntonationVariation() {
    // Accept fewer pitch frames before giving up
    if (this.features.pitch.length < 3) return 0.35;

    const pitches = this.features.pitch.map(p => p.frequency).filter(f => f > 0);
    if (pitches.length === 0) return 0.35;

    const minPitch = Math.min(...pitches);
    const maxPitch = Math.max(...pitches);
    const avgPitch = pitches.reduce((sum, p) => sum + p, 0) / pitches.length;

    const pitchRange = avgPitch > 0 ? (maxPitch - minPitch) / avgPitch : 0;

    // Good intonation variation: 0.15-0.6 range
    if (pitchRange < 0.12) return 0.3;
    if (pitchRange > 0.8) return 0.4;
    return Math.min(pitchRange / 0.5, 1.0);
  }

  // Clarity based on spectral centroid
  calculateClarityScore() {
    if (this.features.spectralCentroid.length < 3) return 0.5;

    const avgCentroid = this.features.spectralCentroid.reduce((sum, sc) => sum + sc.value, 0) / this.features.spectralCentroid.length;

    // heuristics: centroid in 1000-3500 Hz often indicates good clarity for speech
    if (avgCentroid > 1000 && avgCentroid < 3500) return 0.85;
    if (avgCentroid > 500 && avgCentroid < 5000) return 0.65;
    return 0.45;
  }

  stopAnalysis() {
    this.isAnalyzing = false;
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }

  // Produce a structured pronunciation assessment
  assessPronunciation() {
    const syllables = this.detectSyllables();
    const stressAnalysis = {
      ...this.analyzeStressPatterns(), // will call detectSyllables internally too
      syllableCount: syllables.length
    };

    const assessment = {
      stressAccuracy: this.calculateStressAccuracy(stressAnalysis),
      intonationNaturalness: stressAnalysis.intonationVariation || this.calculateIntonationVariation(),
      rhythmFluency: stressAnalysis.rhythmScore || this.calculateRhythmScore(syllables),
      pronunciationClarity: this.calculateClarityScore(),
      overallPronunciation: 0
    };

    assessment.overallPronunciation = (
      assessment.stressAccuracy * 0.3 +
      assessment.intonationNaturalness * 0.3 +
      assessment.rhythmFluency * 0.2 +
      assessment.pronunciationClarity * 0.2
    );

    // clamp
    assessment.overallPronunciation = Math.max(0, Math.min(1, assessment.overallPronunciation));

    return assessment;
  }

  analyzeStressPatterns() {
    const syllables = this.detectSyllables();
    if (syllables.length === 0) {
      return {
        stressedSyllables: [],
        stressPattern: '',
        rhythmScore: 0.5,
        intonationVariation: this.calculateIntonationVariation()
      };
    }

    const stressAnalysis = {
      stressedSyllables: [],
      stressPattern: '',
      rhythmScore: 0,
      intonationVariation: 0
    };

    syllables.forEach((syllable, index) => {
      const stressScore = this.calculateSyllableStress(syllable);
      if (stressScore > 0.6) {
        stressAnalysis.stressedSyllables.push({
          index,
          stress: stressScore,
          duration: syllable.duration,
          pitchRange: syllable.avgPitch,
          intensity: syllable.avgEnergy
        });
        stressAnalysis.stressPattern += 'S';
      } else {
        stressAnalysis.stressPattern += 'U';
      }
    });

    stressAnalysis.rhythmScore = this.calculateRhythmScore(syllables);
    stressAnalysis.intonationVariation = this.calculateIntonationVariation();

    return stressAnalysis;
  }

  calculateStressAccuracy(stressAnalysis) {
    const stressedCount = stressAnalysis.stressedSyllables.length;
    const totalSyllables = stressAnalysis.stressPattern.length;

    if (totalSyllables === 0) return 0.4;

    const stressRatio = stressedCount / totalSyllables;

    // Optimal English stress ratio: roughly 20-40% (adaptive)
    if (stressRatio < 0.12) return 0.35;
    if (stressRatio > 0.6) return 0.45;  // over-stressed penalty
    if (stressRatio >= 0.18 && stressRatio <= 0.4) return Math.min(stressRatio / 0.35, 1.0);
    return 0.6;
  }

  getFeatures() {
    const stressAnalysis = this.analyzeStressPatterns();
    const pronunciationAssessment = this.assessPronunciation();

    return {
      ...this.features,
      stressAnalysis,
      pronunciationAssessment
    };
  }

  reset() {
    this.features = {
      pitch: [],
      intensity: [],
      spectralCentroid: [],
      mfcc: [],
      zcr: [],
      rms: []
    };
    this.isAnalyzing = false;
  }
}

// Export pattern (same as before)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PronunciationAnalyzer;
} else if (typeof window !== 'undefined') {
  window.PronunciationAnalyzer = PronunciationAnalyzer;
}
