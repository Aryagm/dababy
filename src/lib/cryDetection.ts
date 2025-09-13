import type { AudioFeatures, DetectionResult, Alert } from './audioAnalysis';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface CryInstance {
  id: string;
  timestamp: Date;
  duration: number;
  features: AudioFeatures;
  alerts: Alert[];
  diagnosis: CryDiagnosis;
  riskLevel: RiskLevel;
  confidence: number;
  audioData?: string; // Base64 encoded audio data
  audioType?: string; // MIME type of the audio
}

export interface CryDiagnosis {
  primary: string;
  description: string;
  recommendations: string[];
  medicalAttention: 'none' | 'monitor' | 'consult' | 'urgent' | 'emergency';
  confidence: number;
  tags: string[];
}

export interface CrySession {
  id: string;
  startTime: Date;
  endTime?: Date;
  cries: CryInstance[];
  sessionType: 'continuous' | 'single';
  totalDuration: number;
}

export interface CryAnalytics {
  totalCries: number;
  averageFrequency: number;
  riskDistribution: Record<string, number>;
  diagnosisFrequency: Record<string, number>;
  timePatterns: Array<{ hour: number; count: number }>;
  trends: {
    dailyAverage: number;
    weeklyTrend: 'increasing' | 'decreasing' | 'stable';
    concerningPatterns: string[];
  };
}

export class CryDetectionEngine {
  private onCryDetected: (features: AudioFeatures) => void;
  private cryThreshold = 0.1;
  private isDetectingCry = false;
  private detectionStartTime: number | null = null;
  private analysisBuffer: Float32Array[] = [];

  constructor(onCryDetected: (features: AudioFeatures) => void) {
    this.onCryDetected = onCryDetected;
  }

  // Enhanced cry detection with filtering
  processSample(audioData: Float32Array, sampleRate: number): boolean {
    const rms = this.calculateRMS(audioData);
    const isCryingLevel = rms > this.cryThreshold;

    if (isCryingLevel && !this.isDetectingCry) {
      // Start of potential cry
      this.isDetectingCry = true;
      this.detectionStartTime = Date.now();
      this.analysisBuffer = [audioData];
      return false; // Not confirmed yet
    } else if (isCryingLevel && this.isDetectingCry) {
      // Continue collecting cry data
      this.analysisBuffer.push(audioData);
      
      // Check if we have enough data for analysis (minimum 0.5 seconds)
      const duration = (Date.now() - (this.detectionStartTime || 0)) / 1000;
      if (duration >= 0.5 && this.analysisBuffer.length > 20) {
        // Validate this is actually a cry using frequency analysis
        if (this.validateCryPattern(this.analysisBuffer, sampleRate)) {
          this.processCryDetection(sampleRate);
          return true;
        }
      }
    } else if (!isCryingLevel && this.isDetectingCry) {
      // End of audio activity - check if it was a valid cry
      const duration = (Date.now() - (this.detectionStartTime || 0)) / 1000;
      if (duration >= 0.3 && this.analysisBuffer.length > 10) {
        if (this.validateCryPattern(this.analysisBuffer, sampleRate)) {
          this.processCryDetection(sampleRate);
          return true;
        }
      }
      this.resetDetection();
    }

    return false;
  }

  private validateCryPattern(buffer: Float32Array[], sampleRate: number): boolean {
    // Combine all audio data
    const totalSamples = buffer.reduce((sum, arr) => sum + arr.length, 0);
    const combinedAudio = new Float32Array(totalSamples);
    let offset = 0;
    
    for (const chunk of buffer) {
      combinedAudio.set(chunk, offset);
      offset += chunk.length;
    }

    // Check frequency characteristics typical of baby cries
    const f0 = this.estimateF0(combinedAudio, sampleRate);
    const spectralCentroid = this.calculateSpectralCentroid(combinedAudio, sampleRate);
    
    // Baby cry characteristics:
    // - F0 typically 300-1200 Hz
    // - Spectral centroid usually > 500 Hz
    // - Duration typically 0.5-3 seconds for individual cry bursts
    return (
      f0 >= 300 && f0 <= 1200 &&
      spectralCentroid > 500 &&
      combinedAudio.length / sampleRate >= 0.3
    );
  }

  private processCryDetection(sampleRate: number) {
    // Combine buffer data and extract features
    const totalSamples = this.analysisBuffer.reduce((sum, arr) => sum + arr.length, 0);
    const combinedAudio = new Float32Array(totalSamples);
    let offset = 0;
    
    for (const chunk of this.analysisBuffer) {
      combinedAudio.set(chunk, offset);
      offset += chunk.length;
    }

    // Create basic features for callback
    const features: AudioFeatures = {
      f0: [],
      f0Mean: this.estimateF0(combinedAudio, sampleRate),
      f0Std: 0,
      hnr: 0,
      jitter: 0,
      shimmer: 0,
      rms: this.calculateRMS(combinedAudio),
      spectralCentroid: this.calculateSpectralCentroid(combinedAudio, sampleRate),
      spectralFlatness: 0,
      voicedSegmentLengths: [],
      pauseLengths: [],
      burstLengths: [],
      repetitionRate: 0,
      nasalEnergyRatio: 0,
      lowMidHarmonics: 0,
      duration: combinedAudio.length / sampleRate,
      sampleRate
    };

    this.onCryDetected(features);
    this.resetDetection();
  }

  private resetDetection() {
    this.isDetectingCry = false;
    this.detectionStartTime = null;
    this.analysisBuffer = [];
  }

  private calculateRMS(signal: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < signal.length; i++) {
      sum += signal[i] * signal[i];
    }
    return Math.sqrt(sum / signal.length);
  }

  private estimateF0(signal: Float32Array, sampleRate: number): number {
    // Simple autocorrelation-based F0 estimation
    const minPeriod = Math.floor(sampleRate / 1200); // Max 1200 Hz
    const maxPeriod = Math.floor(sampleRate / 300);  // Min 300 Hz
    
    let maxCorrelation = 0;
    let bestPeriod = 0;
    
    for (let period = minPeriod; period <= maxPeriod && period < signal.length / 2; period++) {
      let correlation = 0;
      for (let i = 0; i < signal.length - period; i++) {
        correlation += signal[i] * signal[i + period];
      }
      
      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        bestPeriod = period;
      }
    }
    
    return bestPeriod > 0 ? sampleRate / bestPeriod : 0;
  }

  private calculateSpectralCentroid(signal: Float32Array, sampleRate: number): number {
    // Simple FFT-based spectral centroid
    const fftSize = Math.min(2048, signal.length);
    const spectrum = this.simpleFFT(signal.slice(0, fftSize));
    
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < spectrum.length / 2; i++) {
      const frequency = (i * sampleRate) / fftSize;
      const magnitude = Math.sqrt(spectrum[i * 2] ** 2 + spectrum[i * 2 + 1] ** 2);
      weightedSum += frequency * magnitude;
      magnitudeSum += magnitude;
    }
    
    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  }

  private simpleFFT(signal: Float32Array): Float32Array {
    // Very simplified FFT for spectral analysis
    const N = signal.length;
    const result = new Float32Array(N * 2);
    
    for (let k = 0; k < N; k++) {
      let real = 0, imag = 0;
      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N;
        real += signal[n] * Math.cos(angle);
        imag += signal[n] * Math.sin(angle);
      }
      result[k * 2] = real;
      result[k * 2 + 1] = imag;
    }
    
    return result;
  }
}

export class CryDiagnosisEngine {
  static generateDiagnosis(result: DetectionResult): CryDiagnosis {
    const alerts = result.alerts;
    
    if (alerts.length === 0) {
      return {
        primary: 'Normal Cry',
        description: 'Cry patterns appear within normal ranges.',
        recommendations: ['Continue regular monitoring', 'Maintain feeding and sleep schedules'],
        medicalAttention: 'none',
        confidence: 0.8,
        tags: ['normal', 'healthy']
      };
    }

    // Find the most severe alert
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    const highAlerts = alerts.filter(a => a.severity === 'high');
    
    if (criticalAlerts.length > 0) {
      const primaryAlert = criticalAlerts[0];
      return {
        primary: primaryAlert.message,
        description: primaryAlert.description,
        recommendations: [primaryAlert.recommendation, 'Seek immediate medical evaluation'],
        medicalAttention: 'emergency',
        confidence: primaryAlert.confidence,
        tags: ['critical', primaryAlert.type, 'urgent']
      };
    }

    if (highAlerts.length > 0) {
      const primaryAlert = highAlerts[0];
      return {
        primary: primaryAlert.message,
        description: primaryAlert.description,
        recommendations: [primaryAlert.recommendation, 'Consider consulting pediatrician'],
        medicalAttention: 'consult',
        confidence: primaryAlert.confidence,
        tags: ['high-priority', primaryAlert.type]
      };
    }

    // Medium or low severity
    const primaryAlert = alerts[0];
    return {
      primary: primaryAlert.message,
      description: primaryAlert.description,
      recommendations: [primaryAlert.recommendation, 'Monitor for patterns'],
      medicalAttention: 'monitor',
      confidence: primaryAlert.confidence,
      tags: [primaryAlert.severity, primaryAlert.type]
    };
  }
}

export class CryStorage {
  private static readonly STORAGE_KEY = 'dababy_cry_history';
  private static readonly AUDIO_STORAGE_KEY = 'dababy_audio_';

  static saveCry(cry: CryInstance): void {
    const stored = this.getAllCries();
    stored.push({
      ...cry,
      audioData: undefined, // Don't store large audio data in localStorage
      audioType: undefined
    });
    
    // Keep only last 1000 cries
    const limited = stored.slice(-1000);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limited, this.dateReplacer));
  }

  static saveCryWithAudio(cry: CryInstance, audioBlob: Blob): void {
    // Save cry metadata first
    this.saveCry(cry);
    
    // Convert audio blob to base64 and store separately
    const reader = new FileReader();
    reader.onload = () => {
      const base64Audio = (reader.result as string).split(',')[1];
      const audioKey = this.AUDIO_STORAGE_KEY + cry.id;
      try {
        localStorage.setItem(audioKey, JSON.stringify({
          data: base64Audio,
          type: audioBlob.type,
          size: audioBlob.size
        }));
      } catch (error) {
        console.warn('Failed to store audio data, storage quota may be exceeded:', error);
      }
    };
    reader.readAsDataURL(audioBlob);
  }

  static getAudioForCry(cryId: string): Promise<Blob | null> {
    return new Promise((resolve) => {
      const audioKey = this.AUDIO_STORAGE_KEY + cryId;
      const audioData = localStorage.getItem(audioKey);
      
      if (!audioData) {
        resolve(null);
        return;
      }

      try {
        const parsed = JSON.parse(audioData);
        const byteCharacters = atob(parsed.data);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: parsed.type });
        resolve(blob);
      } catch (error) {
        console.error('Failed to parse audio data:', error);
        resolve(null);
      }
    });
  }

  static getAllCries(): CryInstance[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) {
      return [];
    }
    try {
      return JSON.parse(stored, this.dateReviver);
    } catch (error) {
      console.error('Failed to parse stored cries:', error);
      return [];
    }
  }

  static clearAllCries(): void {
    // Clear cry metadata
    localStorage.removeItem(this.STORAGE_KEY);
    
    // Clear audio data
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.AUDIO_STORAGE_KEY)) {
        localStorage.removeItem(key);
      }
    });
  }

  private static dateReplacer(_key: string, value: unknown): unknown {
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() };
    }
    return value;
  }

  private static dateReviver(_key: string, value: unknown): unknown {
    if (value && typeof value === 'object' && 'value' in value && (value as { __type?: string }).__type === 'Date') {
      return new Date((value as { value: string }).value);
    }
    return value;
  }
}