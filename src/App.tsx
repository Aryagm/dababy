import './App.css'
import { useState } from 'react'
import { RecordingSection } from '@/components/RecordingSection'
import { ResultsSection } from '@/components/ResultsSection'
import { AIChatbot } from '@/components/AIChatbot'
import { ResultsExplanation } from '@/components/ResultsExplanation'
import { Button } from '@/components/ui/button'
import { Mic, BarChart3, Bot } from 'lucide-react'
import type { DetectionResult } from '@/lib/audioAnalysis'
import type { CryInstance } from '@/lib/cryDetection'

function App() {
  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [activeSection, setActiveSection] = useState<'recording' | 'results' | 'ai'>('recording');

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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8 space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">crai.</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            This demo is a stripped down version of the original project with client-side processing (we don't have the money to pay for all the tokens if people start using this lol)
          </p>
          <p className="text-sm text-muted-foreground">
            Real-time detection and heuristic analysis for early health indicators
          </p>
        </div>

        {/* Section Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={activeSection === 'recording' ? 'default' : 'ghost'}
              onClick={() => setActiveSection('recording')}
              className="flex items-center gap-2"
            >
              <Mic className="w-4 h-4" />
              Recording
            </Button>
            <Button
              variant={activeSection === 'results' ? 'default' : 'ghost'}
              onClick={() => setActiveSection('results')}
              className="flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Results
            </Button>
            <Button
              variant={activeSection === 'ai' ? 'default' : 'ghost'}
              onClick={() => setActiveSection('ai')}
              className="flex items-center gap-2"
            >
              <Bot className="w-4 h-4" />
              AI Assistant
            </Button>
          </div>
        </div>

        {/* Results Explanation - Show at top when there are results, or when in results section */}
        {(detectionResults.length > 0 || activeSection === 'results') && activeSection !== 'ai' && (
          <div className="mb-8">
            <ResultsExplanation 
              latestResult={detectionResults.length > 0 ? detectionResults[detectionResults.length - 1] : null}
              totalDetections={detectionResults.length}
            />
          </div>
        )}

        {/* Single Section Display */}
        <div className="w-full">
          {activeSection === 'recording' && (
            <RecordingSection 
              onDetectionResult={handleDetectionResult}
              onCryDetected={handleCryDetected}
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
    </div>
  )
}

export default App
