import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';
import { AudioAnalyzer, type DetectionResult } from '@/lib/audioAnalysis';

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
  const [waveformData, setWaveformData] = useState<number[]>(Array(40).fill(0));
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
    
    // Process data into 40 bars
    const bars = 40;
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

  // Activity indicator based on audio level
  const getActivityColor = () => {
    if (currentLevel > 0.3) return 'bg-red-500';
    if (currentLevel > 0.1) return 'bg-yellow-500';
    if (currentLevel > 0.05) return 'bg-green-500';
    return 'bg-gray-400';
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Status Banner */}
      <div className={`w-full p-4 rounded-xl border-2 ${
        isMonitoring 
          ? 'border-green-500 bg-green-50' 
          : 'border-gray-300 bg-gray-50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full ${
              isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`} />
            <span className="font-semibold text-lg">
              {isMonitoring ? 'Continuous Monitoring Active' : 'Monitoring Stopped'}
            </span>
          </div>
          {isMonitoring && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Activity:</span>
              <div className={`w-3 h-3 rounded-full ${getActivityColor()}`} />
              <span className="text-sm font-mono">
                {(currentLevel * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Waveform Visualization */}
      <div className="flex items-center justify-center h-32 w-96 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 shadow-inner">
        <div className="flex items-end justify-center gap-1 h-full w-full">
          {waveformData.map((value, index) => {
            const intensity = Math.min(value * 1.2, 1);
            const hue = 200 + (index / waveformData.length) * 60;
            
            return (
              <div
                key={index}
                className="rounded-t-sm transition-all duration-100"
                style={{
                  height: `${Math.max(intensity * 100, isMonitoring ? 4 : 8)}%`,
                  width: `${100 / waveformData.length - 0.5}%`,
                  minHeight: isMonitoring ? '4px' : '8px',
                  backgroundColor: isMonitoring 
                    ? `hsl(${hue}, ${intensity * 100}%, ${50 + intensity * 20}%)`
                    : 'hsl(220, 30%, 70%)',
                  opacity: isMonitoring ? (0.6 + intensity * 0.4) : 0.4,
                  boxShadow: intensity > 0.3 && isMonitoring ? `0 0 8px hsl(${hue}, 100%, 60%)` : 'none',
                }}
              />
            );
          })}
        </div>
        {!isMonitoring && (
          <div className="absolute text-gray-500 text-sm font-medium">
            Ready to Monitor
          </div>
        )}
      </div>

      {/* Control Button */}
      <div className="flex gap-4">
        {!isMonitoring ? (
          <Button
            onClick={startMonitoring}
            size="lg"
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Play className="w-6 h-6 mr-3" />
            Start Continuous Monitoring
          </Button>
        ) : (
          <Button
            onClick={stopMonitoring}
            size="lg"
            variant="destructive"
            className="px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Pause className="w-6 h-6 mr-3" />
            Stop Monitoring
          </Button>
        )}
      </div>

      {/* Instructions */}
      <div className="text-center text-gray-600 max-w-md">
        <p className="text-sm">
          {isMonitoring 
            ? 'The system is continuously monitoring for baby cries and will automatically analyze detected audio patterns.'
            : 'Click "Start Continuous Monitoring" to begin real-time baby cry detection and analysis.'
          }
        </p>
      </div>
    </div>
  );
};