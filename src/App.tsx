import './App.css'
import { useState } from 'react'
import { ContinuousMonitor } from '@/components/ContinuousMonitor'
import { AlertDashboard } from '@/components/AlertDashboard'
import { FeatureDisplay } from '@/components/FeatureDisplay'
import type { DetectionResult } from '@/lib/audioAnalysis'

function App() {
  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const handleDetectionResult = (result: DetectionResult) => {
    setDetectionResults(prev => [...prev, result].slice(-100)); // Keep last 100 results
  };

  const latestFeatures = detectionResults.length > 0 
    ? detectionResults[detectionResults.length - 1].features 
    : null;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className='text-6xl font-bold text-gray-900 mb-4'>DaBaby</h1>
          <p className="text-xl text-gray-600">Intelligent Baby Cry Analysis & Monitoring System</p>
          <p className="text-sm text-gray-500 mt-2">
            Real-time detection and heuristic analysis for early health indicators
          </p>
        </div>

        <div className="space-y-8">
          {/* Monitoring Control */}
          <div className="flex justify-center">
            <ContinuousMonitor 
              onDetectionResult={handleDetectionResult}
              isMonitoring={isMonitoring}
              onMonitoringChange={setIsMonitoring}
            />
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
