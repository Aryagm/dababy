import './App.css'
import { useState } from 'react'
import { RecordingSection } from '@/components/RecordingSection'
import { ResultsSection } from '@/components/ResultsSection'
import { AIChatbot } from '@/components/AIChatbot'
import { ResultsExplanation } from '@/components/ResultsExplanation'
import { Button } from '@/components/ui/button'
import type { DetectionResult } from '@/lib/audioAnalysis'

function App() {
  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [activeSection, setActiveSection] = useState<'recording' | 'results' | 'ai'>('recording');

  const handleDetectionResult = (result: DetectionResult) => {
    setDetectionResults(prev => [...prev, result].slice(-100)); // Keep last 100 results
  };

  const latestFeatures = detectionResults.length > 0 
    ? detectionResults[detectionResults.length - 1].features 
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 fade-in">
      {/* Minimal Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-6 py-12 max-w-5xl">
          <div className="text-center space-y-4">
            <h1 className="text-8xl font-bold tracking-tight drop-shadow-sm">crai.</h1>
            <p className="text-2xl text-muted-foreground font-medium">
              AI-powered infant cry analysis
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-16 max-w-5xl">
        {/* Simple Navigation */}
        <div className="flex justify-center mb-16">
          <div className="flex bg-card/80 backdrop-blur-sm border rounded-xl p-1.5 shadow-lg">
            <Button
              variant={activeSection === 'recording' ? 'default' : 'ghost'}
              onClick={() => setActiveSection('recording')}
              className="px-10 py-4 text-lg font-medium rounded-lg"
            >
              Record
            </Button>
            <Button
              variant={activeSection === 'results' ? 'default' : 'ghost'}
              onClick={() => setActiveSection('results')}
              className="px-10 py-4 text-lg font-medium rounded-lg"
            >
              Results
            </Button>
            <Button
              variant={activeSection === 'ai' ? 'default' : 'ghost'}
              onClick={() => setActiveSection('ai')}
              className="px-10 py-4 text-lg font-medium rounded-lg"
            >
              AI Chat
            </Button>
          </div>
        </div>

        {/* Results Overview */}
        {detectionResults.length > 0 && activeSection !== 'ai' && (
          <div className="mb-12">
            <ResultsExplanation 
              latestResult={detectionResults[detectionResults.length - 1]}
              totalDetections={detectionResults.length}
            />
          </div>
        )}

        {/* Main Tool */}
        <div className="w-full">
          {activeSection === 'recording' && (
            <RecordingSection 
              onDetectionResult={handleDetectionResult}
              isMonitoring={isMonitoring}
              onMonitoringChange={setIsMonitoring}
            />
          )}

          {activeSection === 'results' && (
            <ResultsSection 
              detectionResults={detectionResults}
              isMonitoring={isMonitoring}
              latestFeatures={latestFeatures}
            />
          )}

          {activeSection === 'ai' && (
            <AIChatbot 
              detectionResults={detectionResults}
            />
          )}
        </div>
      </div>

      {/* Subtle background texture */}
      <div className="fixed inset-0 pointer-events-none opacity-5">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  )
}

export default App
