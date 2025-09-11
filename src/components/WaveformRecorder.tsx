import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square } from 'lucide-react';

interface WaveformRecorderProps {
  onRecordingComplete?: (audioBlob: Blob) => void;
}

export const WaveformRecorder: React.FC<WaveformRecorderProps> = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>(Array(40).fill(0));
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const updateWaveform = () => {
    if (!analyserRef.current) {
      return;
    }
    
    // Don't rely on isRecording state for animation, check if mediaRecorder is active
    const isActivelyRecording = mediaRecorderRef.current?.state === 'recording';
    
    if (!isActivelyRecording) {
      return;
    }
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Get frequency data instead of time domain for better visualization
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Log raw data for debugging
    const rawSum = Array.from(dataArray).reduce((sum, val) => sum + val, 0);
    const rawAverage = rawSum / dataArray.length;
    
    if (rawAverage > 1) {
return;    }
    
    // Process data into 40 bars - focus on voice frequency range
    const bars = 40;
    // Human voice is mostly 85Hz-4kHz, which is roughly the first 20-25% of the frequency spectrum
    // Let's map this range across all 40 bars for better visualization
    const voiceRangeEnd = Math.floor(bufferLength * 0.3); // Use first 30% which covers voice range
    const waveData: number[] = [];
    
    // Calculate overall energy level
    const totalEnergy = Array.from(dataArray.slice(0, voiceRangeEnd)).reduce((sum, val) => sum + val, 0) / voiceRangeEnd;
    
    for (let i = 0; i < bars; i++) {
      let maxValue = 0;
      
      // Map each bar to a portion of the voice frequency range
      const startIndex = Math.floor((i / bars) * voiceRangeEnd);
      const endIndex = Math.floor(((i + 1) / bars) * voiceRangeEnd);
      
      // Use the maximum value in the range instead of average for better responsiveness
      for (let j = startIndex; j < endIndex; j++) {
        if (j < dataArray.length) {
          maxValue = Math.max(maxValue, dataArray[j]);
        }
      }
      
      // Normalize and apply moderate scaling
      let normalized = maxValue / 255;
      
      // Add some randomness based on overall energy to create more dynamic visualization
      if (totalEnergy > 10) { // Only when there's actual audio
        const randomFactor = 0.7 + (Math.random() * 0.6); // 0.7 to 1.3
        normalized *= randomFactor;
      }
      
      // Use square root for more sensitive response to lower levels
      const scaled = Math.sqrt(normalized) * 2;
      waveData.push(Math.min(scaled, 1));
    }
    
    setWaveformData(waveData);
    
    // Debug: log max value to console
    const maxValue = Math.max(...waveData);
    if (maxValue > 0.01) {
        return;    }
    
    // Continue animation if still recording
    if (isActivelyRecording) {
      animationRef.current = requestAnimationFrame(updateWaveform);
    }
  };

  const startRecording = async () => {
    try {
      // Request microphone access
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
      
      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      // Configure analyser for better responsiveness and frequency distribution
      analyserRef.current.fftSize = 1024; // Larger for better frequency resolution
      analyserRef.current.smoothingTimeConstant = 0.3; // Moderate smoothing
      analyserRef.current.minDecibels = -80; // Better dynamic range
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
      
      // Start recording
      mediaRecorderRef.current.start(100); // Collect data every 100ms
      setIsRecording(true);
      
      // Start waveform animation immediately
      animationRef.current = requestAnimationFrame(updateWaveform);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // Reset waveform
      setWaveformData(Array(40).fill(0));
    }
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

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Waveform Visualization */}
      <div className="flex items-center justify-center h-32 w-96 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 shadow-inner">
        <div className="flex items-end justify-center gap-1 h-full w-full">
          {waveformData.map((value, index) => {
            // Create a gradient effect from low to high frequencies
            const intensity = Math.min(value * 1.2, 1);
            const hue = 200 + (index / waveformData.length) * 60; // Blue to cyan gradient
            
            return (
              <div
                key={index}
                className="rounded-t-sm transition-all duration-100"
                style={{
                  height: `${Math.max(intensity * 100, 4)}%`,
                  width: `${100 / waveformData.length - 0.5}%`,
                  minHeight: '4px',
                  backgroundColor: `hsl(${hue}, ${intensity * 100}%, ${50 + intensity * 20}%)`,
                  opacity: isRecording ? (0.6 + intensity * 0.4) : 0.3,
                  boxShadow: intensity > 0.3 ? `0 0 8px hsl(${hue}, 100%, 60%)` : 'none',
                }}
              />
            );
          })}
        </div>
        {/* Debug info */}
        {isRecording && (
          <div className="absolute mt-24 text-xs text-gray-500">
            Max: {Math.max(...waveformData).toFixed(2)}
          </div>
        )}
      </div>

      {/* Control Button */}
      <div className="flex gap-4">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            size="lg"
            className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Mic className="w-6 h-6 mr-3" />
            Start Recording
          </Button>
        ) : (
          <Button
            onClick={stopRecording}
            size="lg"
            variant="destructive"
            className="px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Square className="w-6 h-6 mr-3" />
            Stop Recording
          </Button>
        )}
      </div>

      {/* Recording Status */}
      {isRecording && (
        <div className="flex items-center gap-3 text-red-500 font-semibold text-lg">
          <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-lg" />
          Recording in progress...
        </div>
      )}
    </div>
  );
};
