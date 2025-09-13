import './App.css'
import { useState } from 'react'
import { ContinuousMonitor } from '@/components/ContinuousMonitor'
import { WaveformRecorder } from '@/components/WaveformRecorder'
import { AlertDashboard } from '@/components/AlertDashboard'
import { FeatureDisplay } from '@/components/FeatureDisplay'
import { CryAnalytics } from '@/components/CryAnalytics'
import { Button } from '@/components/ui/button'
import { BarChart3, Activity } from 'lucide-react'
import type { DetectionResult } from '@/lib/audioAnalysis'
import type { CryInstance } from '@/lib/cryDetection'

function App() {
  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentMode, setCurrentMode] = useState<'continuous' | 'single' | 'analytics'>('single');

  const handleDetectionResult = (result: DetectionResult) => {
    setDetectionResults(prev => [...prev, result].slice(-100)); // Keep last 100 results
  };

  const handleCryDetected = (cry: CryInstance) => {
    console.log('New cry detected:', cry);
  };

  const latestFeatures = detectionResults.length > 0 
    ? detectionResults[detectionResults.length - 1].features 
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8 space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">crai.</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            This demo is a stripped down version of the original project with client-side processing (we don't have the money to pay for all the tokens if people start using this lol)
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
              <Activity className="w-4 h-4 mr-2" />
              Continuous Monitoring
            </Button>
            <Button
              variant={currentMode === 'single' ? 'default' : 'outline'}
              onClick={() => setCurrentMode('single')}
            >
              Cry Detection
            </Button>
            <Button
              variant={currentMode === 'analytics' ? 'default' : 'outline'}
              onClick={() => setCurrentMode('analytics')}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Recording/Monitoring Section */}
          {currentMode === 'analytics' ? (
            <CryAnalytics />
          ) : (
            <div className="flex justify-center">
              {currentMode === 'continuous' ? (
                <ContinuousMonitor 
                  onDetectionResult={handleDetectionResult}
                  isMonitoring={isMonitoring}
                  onMonitoringChange={setIsMonitoring}
                />
              ) : (
                <WaveformRecorder 
                  onCryDetected={handleCryDetected}
                />
              )}
            </div>
          )}

          {/* Alert Dashboard - only show when not in analytics mode */}
          {currentMode !== 'analytics' && (
            <AlertDashboard 
              detectionResults={detectionResults}
              isMonitoring={isMonitoring}
            />
          )}

          {/* Feature Analysis - only show when not in analytics mode */}
          {currentMode !== 'analytics' && (
            <FeatureDisplay features={latestFeatures} />
          )}
        </div>
      </div>
    </div>
  )
}

export default App
