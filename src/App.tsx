import './App.css'
import { useState } from 'react'
import { ContinuousMonitor } from '@/components/ContinuousMonitor'
import { WaveformRecorder } from '@/components/WaveformRecorder'
import { AlertDashboard } from '@/components/AlertDashboard'
import { FeatureDisplay } from '@/components/FeatureDisplay'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { DetectionResult } from '@/lib/audioAnalysis'

function App() {
  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentMode, setCurrentMode] = useState<'continuous' | 'single'>('continuous');

  const handleDetectionResult = (result: DetectionResult) => {
    setDetectionResults(prev => [...prev, result].slice(-100)); // Keep last 100 results
  };

  const latestFeatures = detectionResults.length > 0 
    ? detectionResults[detectionResults.length - 1].features 
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8 space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">DaBaby</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Intelligent Baby Cry Analysis & Monitoring System
          </p>
          <p className="text-sm text-muted-foreground">
            Real-time detection and heuristic analysis for early health indicators
          </p>
          
          {/* Mode Selection */}
          <div className="flex justify-center gap-2 pt-4">
            <Button
              variant={currentMode === 'continuous' ? 'default' : 'outline'}
              onClick={() => setCurrentMode('continuous')}
            >
              Continuous Monitoring
            </Button>
            <Button
              variant={currentMode === 'single' ? 'default' : 'outline'}
              onClick={() => setCurrentMode('single')}
            >
              Single Recording
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Recording/Monitoring Section */}
          <div className="flex justify-center">
            {currentMode === 'continuous' ? (
              <ContinuousMonitor 
                onDetectionResult={handleDetectionResult}
                isMonitoring={isMonitoring}
                onMonitoringChange={setIsMonitoring}
              />
            ) : (
              <WaveformRecorder 
                onRecordingComplete={(blob) => {
                  // Handle single recording completion
                  console.log('Single recording completed', blob);
                }}
              />
            )}
          </div>

          {/* Alert Dashboard */}
          <AlertDashboard 
            detectionResults={detectionResults}
            isMonitoring={isMonitoring}
          />

          {/* Feature Analysis */}
          <FeatureDisplay features={latestFeatures} />
        </div>
      </div>
    </div>
  )
}

export default App
