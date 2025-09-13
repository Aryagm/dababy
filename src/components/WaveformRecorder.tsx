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
      console.log('Waveform update stopped - no analyser');
      return;
    }
    
    // Don't rely on isRecording state for animation, check if mediaRecorder is active
    const isActivelyRecording = mediaRecorderRef.current?.state === 'recording';
    
    if (!isActivelyRecording) {
      console.log('Waveform update stopped - not actively recording, state:', mediaRecorderRef.current?.state);
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
      console.log('Raw audio data detected - average:', rawAverage, 'max:', Math.max(...dataArray));
    }
    
    // Process data into 40 bars - spread across full frequency range
    const bars = 40;
    const usableRange = Math.floor(bufferLength * 0.8); // Use 80% of frequency range
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
        // Average and normalize (0-255 to 0-1)
        const average = sum / count;
        const normalized = average / 255;
        // Reduce amplification and add logarithmic scaling for better visual balance
        const scaled = Math.pow(normalized, 0.7) * 1.5; // Less aggressive amplification
        waveData.push(Math.min(scaled, 1));
      } else {
        waveData.push(0);
      }
    }
    
    setWaveformData(waveData);
    
    // Debug: log max value to console
    const maxValue = Math.max(...waveData);
    if (maxValue > 0.01) {
      console.log('Processed waveform data - max value:', maxValue);
    }
    
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
      
      console.log('Audio context created, sample rate:', audioContextRef.current.sampleRate);
      console.log('Audio context state:', audioContextRef.current.state);
      console.log('Analyser frequency bin count:', analyserRef.current.frequencyBinCount);
      
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
      console.log('MediaRecorder started, state:', mediaRecorderRef.current.state);
      setIsRecording(true);
      console.log('Set isRecording to true');
      
      // Start waveform animation immediately
      console.log('Starting waveform animation...');
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
