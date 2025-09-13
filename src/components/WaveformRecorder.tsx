import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WaveformBar } from '@/components/ui/progress';
import { Mic, Square, Brain, Search, CheckCircle } from 'lucide-react';

interface WaveformRecorderProps {
  onRecordingComplete?: (audioBlob: Blob) => void;
}

type RecordingPhase = 'idle' | 'recording' | 'cry-detected' | 'analyzing' | 'complete';

export const WaveformRecorder: React.FC<WaveformRecorderProps> = ({ onRecordingComplete }) => {
  const [phase, setPhase] = useState<RecordingPhase>('idle');
  const [waveformData, setWaveformData] = useState<number[]>(Array(50).fill(0));
  const [cryDetected, setCryDetected] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const cryDetectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateWaveform = () => {
    if (!analyserRef.current || phase === 'idle') {
      return;
    }
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate overall level for cry detection
    const avgLevel = Array.from(dataArray).reduce((sum, val) => sum + val, 0) / dataArray.length / 255;
    
    // Simple cry detection threshold (improved version would use more sophisticated algorithm)
    if (avgLevel > 0.15 && phase === 'recording' && !cryDetected) {
      setCryDetected(true);
      setPhase('cry-detected');
      
      // Simulate analysis phase after cry detection
      cryDetectionTimeoutRef.current = setTimeout(() => {
        setPhase('analyzing');
        
        // Simulate analysis completion
        setTimeout(() => {
          setPhase('complete');
          stopRecording();
        }, 3000); // 3 seconds of analysis
      }, 1500); // 1.5 seconds showing "cry detected"
    }
    
    // Process data into 50 bars for better resolution
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
    
    // Continue animation if recording
    if (phase !== 'idle' && phase !== 'complete') {
      animationRef.current = requestAnimationFrame(updateWaveform);
    }
  };

  const getPhaseDisplay = () => {
    switch (phase) {
      case 'idle':
        return {
          title: 'Ready to Record',
          description: 'Click start to begin cry detection',
          badge: { text: 'Idle', variant: 'secondary' as const },
          icon: <Mic className="w-5 h-5" />
        };
      case 'recording':
        return {
          title: 'Listening for Crying',
          description: 'Monitoring audio for baby cry patterns',
          badge: { text: 'Recording', variant: 'info' as const },
          icon: <Search className="w-5 h-5 animate-pulse" />
        };
      case 'cry-detected':
        return {
          title: 'Cry Detected',
          description: 'Baby cry pattern identified',
          badge: { text: 'Cry Found', variant: 'warning' as const },
          icon: <Brain className="w-5 h-5" />
        };
      case 'analyzing':
        return {
          title: 'Analyzing Cry Pattern',
          description: 'Processing acoustic features and patterns',
          badge: { text: 'Analyzing', variant: 'default' as const },
          icon: <Brain className="w-5 h-5 animate-pulse" />
        };
      case 'complete':
        return {
          title: 'Analysis Complete',
          description: 'Cry analysis finished successfully',
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
      
      // Set up audio context for visualization
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
      
      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      chunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete?.(audioBlob);
        
        // Clean up
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };
      
      mediaRecorderRef.current.start(100);
      setPhase('recording');
      setCryDetected(false);
      
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
    
    if (cryDetectionTimeoutRef.current) {
      clearTimeout(cryDetectionTimeoutRef.current);
    }
    
    // Stop animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    // Reset after a delay to show completion state
    setTimeout(() => {
      setPhase('idle');
      setWaveformData(Array(50).fill(0));
      setCryDetected(false);
    }, 2000);
  };

  const handleStopRecording = () => {
    setPhase('complete');
    stopRecording();
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (cryDetectionTimeoutRef.current) {
        clearTimeout(cryDetectionTimeoutRef.current);
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
          
          {/* Professional Waveform Visualization */}
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
