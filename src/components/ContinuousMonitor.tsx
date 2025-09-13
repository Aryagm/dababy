import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WaveformBar } from '@/components/ui/progress';
import { Play, Pause, Activity } from 'lucide-react';
import { AudioAnalyzer, type DetectionResult } from '@/lib/audioAnalysis';
import { CryStorage, CryDiagnosisEngine } from '@/lib/cryDetection';

interface ContinuousMonitorProps {
  onDetectionResult?: (result: DetectionResult) => void;
  isMonitoring: boolean;
  onMonitoringChange: (monitoring: boolean) => void;
}

export const ContinuousMonitor: React.FC<ContinuousMonitorProps> = ({ 
  onDetectionResult, 
  isMonitoring, 
  onMonitoringChange 
}) => {
  const [waveformData, setWaveformData] = useState<number[]>(Array(60).fill(0));
  const [currentLevel, setCurrentLevel] = useState<number>(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioAnalyzer = useRef<AudioAnalyzer>(new AudioAnalyzer());
  const recordingChunks = useRef<Blob[]>([]);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const processAudioChunk = useCallback(async (audioBlob: Blob) => {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Only analyze if there's sufficient audio data (at least 0.5 seconds)
      if (audioBuffer.duration >= 0.5) {
        const result = await audioAnalyzer.current.analyzeAudio(audioBuffer);
        onDetectionResult?.(result);
        
        // Store significant detection results to localStorage
        if (result.riskLevel !== 'low' || result.alerts.length > 0) {
          const diagnosis = CryDiagnosisEngine.generateDiagnosis(result);
          
          const cryInstance = {
            id: `continuous-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
            duration: audioBuffer.duration,
            features: result.features,
            alerts: result.alerts,
            diagnosis,
            riskLevel: result.riskLevel,
            confidence: diagnosis.confidence
          };
          
          CryStorage.saveCryWithAudio(cryInstance, audioBlob);
        }
        
        // Update baseline for weak cry detection
        audioAnalyzer.current.updateBaseline(result.features.rms);
      }
      
      audioContext.close();
    } catch (error) {
      console.error('Error processing audio chunk:', error);
    }
  }, [onDetectionResult]);

  const updateWaveform = useCallback(() => {
    if (!analyserRef.current) {
      return;
    }
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Get frequency data for visualization
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate overall level for trigger detection
    const avgLevel = Array.from(dataArray).reduce((sum, val) => sum + val, 0) / dataArray.length / 255;
    setCurrentLevel(avgLevel);
    
    // Process data into 60 bars
    const bars = 60;
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
        const scaled = Math.pow(normalized, 0.7) * 1.5;
        waveData.push(Math.min(scaled, 1));
      } else {
        waveData.push(0);
      }
    }
    
    setWaveformData(waveData);
    
    // Continue animation regardless of monitoring state for visual feedback
    animationRef.current = requestAnimationFrame(updateWaveform);
  }, []);

  const startMonitoring = async () => {
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
      
      // Set up continuous recording for analysis
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      recordingChunks.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunks.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        if (recordingChunks.current.length > 0) {
          const audioBlob = new Blob(recordingChunks.current, { type: 'audio/webm' });
          await processAudioChunk(audioBlob);
          recordingChunks.current = [];
          
          // Restart recording if still monitoring
          if (isMonitoring && mediaRecorderRef.current) {
            mediaRecorderRef.current.start();
          }
        }
      };
      
      // Start recording and analysis cycle
      mediaRecorderRef.current.start();
      onMonitoringChange(true);
      
      // Set up periodic analysis (every 3 seconds)
      analysisIntervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          // Will automatically restart in onstop handler
        }
      }, 3000);
      
      // Start waveform animation
      animationRef.current = requestAnimationFrame(updateWaveform);
      
    } catch (error) {
      console.error('Error starting monitoring:', error);
      alert('Could not access microphone. Please check permissions and try again.');
    }
  };

  const stopMonitoring = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    onMonitoringChange(false);
    setWaveformData(Array(40).fill(0));
    setCurrentLevel(0);
    
    // Stop the animation when monitoring stops
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Activity className="w-5 h-5" />
            <CardTitle className="text-xl">Continuous Monitoring</CardTitle>
          </div>
          <Badge variant={isMonitoring ? 'success' : 'secondary'} className="mx-auto w-fit">
            {isMonitoring ? 'Active' : 'Inactive'}
          </Badge>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            {isMonitoring 
              ? 'Continuously monitoring for baby cry patterns'
              : 'Start monitoring to begin automatic cry detection'
            }
          </p>
          
          {/* Professional Waveform Visualization */}
          <div className="h-24 flex items-end justify-between bg-muted/30 rounded-lg p-4">
            {waveformData.map((value, index) => (
              <WaveformBar
                key={index}
                value={value * 100}
                max={100}
                height="3px"
                isActive={isMonitoring}
                className="transition-all duration-100 flex-1 mx-0.5"
              />
            ))}
          </div>
          
          {/* Activity Level Display */}
          {isMonitoring && (
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span>Activity Level:</span>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full transition-colors ${
                  currentLevel > 0.3 ? 'bg-red-500' :
                  currentLevel > 0.1 ? 'bg-yellow-500' :
                  currentLevel > 0.05 ? 'bg-green-500' : 'bg-muted'
                }`} />
                <span className="font-mono text-sm">
                  {(currentLevel * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          )}
          
          {/* Control Button */}
          <div className="flex justify-center">
            {!isMonitoring ? (
              <Button
                onClick={startMonitoring}
                size="lg"
                className="px-8"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Monitoring
              </Button>
            ) : (
              <Button
                onClick={stopMonitoring}
                size="lg"
                variant="destructive"
                className="px-8"
              >
                <Pause className="w-5 h-5 mr-2" />
                Stop Monitoring
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};