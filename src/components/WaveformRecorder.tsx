import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WaveformBar } from '@/components/ui/progress';
import { Mic, Square, Brain, Search, CheckCircle, AlertTriangle } from 'lucide-react';
import { AudioAnalyzer, type AudioFeatures } from '@/lib/audioAnalysis';
import { CryDetectionEngine, CryDiagnosisEngine, CryStorage, type CryInstance } from '@/lib/cryDetection';

interface WaveformRecorderProps {
  onCryDetected?: (cry: CryInstance) => void;
}

type RecordingPhase = 'idle' | 'recording' | 'cry-detected' | 'analyzing' | 'complete';

export const WaveformRecorder: React.FC<WaveformRecorderProps> = ({ onCryDetected }) => {
  const [phase, setPhase] = useState<RecordingPhase>('idle');
  const [waveformData, setWaveformData] = useState<number[]>(Array(50).fill(0));
  const [currentCry, setCurrentCry] = useState<CryInstance | null>(null);
  const [detectedCries, setDetectedCries] = useState<CryInstance[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cryDetectionEngineRef = useRef<CryDetectionEngine | null>(null);
  const audioAnalyzerRef = useRef<AudioAnalyzer>(new AudioAnalyzer());
  const recordedAudioRef = useRef<Blob | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);

  const handleCryDetected = async (features: AudioFeatures) => {
    console.log('Cry detected with features:', features);
    setPhase('cry-detected');
    
    // Start analysis phase after brief delay to show detection
    setTimeout(async () => {
      setPhase('analyzing');
      
      try {
        // Create a mock audio buffer for analysis (in real implementation, use actual audio)
        const mockAudioBuffer = createMockAudioBuffer(features);
        const result = await audioAnalyzerRef.current.analyzeAudio(mockAudioBuffer);
        
        // Generate diagnosis
        const diagnosis = CryDiagnosisEngine.generateDiagnosis(result);
        
        // Create cry instance
        const cry: CryInstance = {
          id: `cry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          duration: features.duration,
          features: result.features,
          alerts: result.alerts,
          diagnosis,
          riskLevel: result.riskLevel,
          confidence: diagnosis.confidence
        };
        
        setCurrentCry(cry);
        setDetectedCries(prev => [...prev, cry]);
        
        // Store cry with audio data
        if (recordedAudioRef.current) {
          CryStorage.saveCryWithAudio(cry, recordedAudioRef.current);
        } else {
          CryStorage.saveCry(cry);
        }
        
        // Notify parent component
        onCryDetected?.(cry);
        
        // Show results
        setTimeout(() => {
          setPhase('complete');
        }, 2000);
        
      } catch (error) {
        console.error('Error analyzing cry:', error);
        setPhase('complete');
      }
    }, 1500);
  };

  // Create a mock audio buffer for demonstration (replace with real audio in production)
  const createMockAudioBuffer = (features: AudioFeatures): AudioBuffer => {
    const audioContext = new AudioContext();
    const duration = features.duration || 1.0;
    const sampleRate = 44100;
    const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const channelData = buffer.getChannelData(0);
    
    // Generate a sine wave at the detected frequency
    const frequency = features.f0Mean || 400;
    for (let i = 0; i < channelData.length; i++) {
      channelData[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.1;
    }
    
    return buffer;
  };

  const updateWaveform = () => {
    if (!analyserRef.current) {
      return;
    }
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Process real-time audio for cry detection
    if (phase === 'recording' && cryDetectionEngineRef.current) {
      const timeData = new Uint8Array(bufferLength);
      analyserRef.current.getByteTimeDomainData(timeData);
      
      // Convert to Float32Array for processing
      const floatData = new Float32Array(timeData.length);
      for (let i = 0; i < timeData.length; i++) {
        floatData[i] = (timeData[i] - 128) / 128.0;
      }
      
      // Check for cry detection
      const cryDetected = cryDetectionEngineRef.current.processSample(floatData, 44100);
      if (cryDetected) {
        // Cry detection engine will call handleCryDetected via callback
      }
    }
    
    // Process data into 50 bars for visualization
    const bars = 50;
    const usableRange = Math.floor(bufferLength * 0.8);
    const samplesPerBar = Math.floor(usableRange / bars);
    const waveData: number[] = [];
    
    for (let i = 0; i < bars; i++) {
      let sum = 0;
      let count = 0;
      const startIndex = i * samplesPerBar;
      const endIndex = Math.min(startIndex + samplesPerBar, usableRange);
      
      for (let j = startIndex; j < endIndex; j++) {
        sum += dataArray[j];
        count++;
      }
      
      if (count > 0) {
        const average = sum / count;
        const normalized = average / 255;
        const scaled = Math.pow(normalized, 0.7) * 1.2;
        waveData.push(Math.min(scaled, 1));
      } else {
        waveData.push(0);
      }
    }
    
    setWaveformData(waveData);
    
    // Continue animation if recording or processing
    if (phase === 'recording' || phase === 'cry-detected' || phase === 'analyzing') {
      animationRef.current = requestAnimationFrame(updateWaveform);
    }
  };

  const getPhaseDisplay = () => {
    switch (phase) {
      case 'idle':
        return {
          title: 'Ready to Record',
          description: detectedCries.length > 0 
            ? `${detectedCries.length} cries detected this session`
            : 'Click start to begin cry detection',
          badge: { text: 'Idle', variant: 'secondary' as const },
          icon: <Mic className="w-5 h-5" />
        };
      case 'recording':
        return {
          title: 'Listening for Crying',
          description: 'Monitoring audio and filtering for baby cry patterns',
          badge: { text: 'Recording', variant: 'info' as const },
          icon: <Search className="w-5 h-5 animate-pulse" />
        };
      case 'cry-detected':
        return {
          title: 'Cry Detected!',
          description: 'Baby cry pattern identified and captured',
          badge: { text: 'Cry Found', variant: 'warning' as const },
          icon: <AlertTriangle className="w-5 h-5" />
        };
      case 'analyzing':
        return {
          title: 'Analyzing Cry Pattern',
          description: 'Processing acoustic features and generating diagnosis',
          badge: { text: 'Analyzing', variant: 'default' as const },
          icon: <Brain className="w-5 h-5 animate-pulse" />
        };
      case 'complete':
        return {
          title: 'Analysis Complete',
          description: currentCry 
            ? `Diagnosis: ${currentCry.diagnosis.primary}`
            : 'Cry analysis finished',
          badge: { text: 'Complete', variant: 'success' as const },
          icon: <CheckCircle className="w-5 h-5" />
        };
      default:
        return getPhaseDisplay();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100
        }
      });
      
      streamRef.current = stream;
      
      // Set up audio context
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      analyserRef.current.fftSize = 1024;
      analyserRef.current.smoothingTimeConstant = 0.3;
      analyserRef.current.minDecibels = -80;
      analyserRef.current.maxDecibels = -20;
      
      source.connect(analyserRef.current);
      
      // Initialize cry detection engine
      cryDetectionEngineRef.current = new CryDetectionEngine(handleCryDetected);
      
      // Set up media recorder for audio capture
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      recordingChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(recordingChunksRef.current, { type: 'audio/webm' });
        recordedAudioRef.current = audioBlob;
      };
      
      mediaRecorderRef.current.start(100);
      setPhase('recording');
      setCurrentCry(null);
      
      // Start waveform animation
      animationRef.current = requestAnimationFrame(updateWaveform);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    // Stop animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    // Clean up
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    // Reset to idle after showing completion
    setTimeout(() => {
      setPhase('idle');
      setWaveformData(Array(50).fill(0));
    }, 3000);
  };

  const handleStopRecording = () => {
    if (phase === 'recording') {
      setPhase('complete');
    }
    stopRecording();
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const phaseDisplay = getPhaseDisplay();

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            {phaseDisplay.icon}
            <CardTitle className="text-xl">{phaseDisplay.title}</CardTitle>
          </div>
          <Badge variant={phaseDisplay.badge.variant} className="mx-auto w-fit">
            {phaseDisplay.badge.text}
          </Badge>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            {phaseDisplay.description}
          </p>
          
          {/* Enhanced Waveform Visualization */}
          <div className="h-24 flex items-end justify-center gap-1 bg-muted/30 rounded-lg p-4">
            {waveformData.map((value, index) => (
              <WaveformBar
                key={index}
                value={value * 100}
                max={100}
                height="3px"
                isActive={phase !== 'idle'}
                className={`transition-all duration-100 ${
                  phase === 'cry-detected' 
                    ? 'bg-yellow-500' 
                    : phase === 'analyzing' 
                    ? 'bg-blue-500' 
                    : phase === 'complete'
                    ? 'bg-green-500'
                    : ''
                }`}
              />
            ))}
          </div>
          
          {/* Current Cry Info */}
          {currentCry && phase === 'complete' && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Latest Detection:</span>
                <Badge variant={
                  currentCry.riskLevel === 'critical' ? 'critical' :
                  currentCry.riskLevel === 'high' ? 'destructive' :
                  currentCry.riskLevel === 'medium' ? 'warning' : 'success'
                }>
                  {currentCry.riskLevel.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>Diagnosis:</strong> {currentCry.diagnosis.primary}
              </p>
              <p className="text-xs text-muted-foreground">
                Duration: {currentCry.duration.toFixed(1)}s • 
                Confidence: {(currentCry.confidence * 100).toFixed(0)}%
              </p>
            </div>
          )}
          
          {/* Control Button */}
          <div className="flex justify-center">
            {phase === 'idle' ? (
              <Button
                onClick={startRecording}
                size="lg"
                className="px-8"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Cry Detection
              </Button>
            ) : phase === 'complete' ? (
              <Button
                onClick={() => setPhase('idle')}
                size="lg"
                variant="outline"
                className="px-8"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Ready for Next Recording
              </Button>
            ) : (
              <Button
                onClick={handleStopRecording}
                size="lg"
                variant="destructive"
                className="px-8"
              >
                <Square className="w-5 h-5 mr-2" />
                Stop Recording
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
