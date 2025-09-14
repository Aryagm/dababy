import './App.css'
import { useState } from 'react'
import { RecordingSection } from '@/components/RecordingSection'
import { ResultsSection } from '@/components/ResultsSection'
import { AIChatbot } from '@/components/AIChatbot'
import { ResultsExplanation } from '@/components/ResultsExplanation'
import { Button } from '@/components/ui/button'
import type { DetectionResult } from '@/lib/audioAnalysis'
import type { DiagnosisContext } from '@/lib/medicalDiagnosis'

function App() {
  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isCurrentlyDetecting, setIsCurrentlyDetecting] = useState(false);
  const [activeSection, setActiveSection] = useState<'recording' | 'results' | 'ai'>('recording');
  const [diagnosisContext, setDiagnosisContext] = useState<DiagnosisContext>({
    babyAge: undefined,
    isJaundiced: false,
    postFeed: false,
    hasFever: false,
    gestationalAge: undefined,
    feedingDifficulty: false,
    constipation: false
  });

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
              isCurrentlyDetecting={isCurrentlyDetecting}
              isRecording={isMonitoring}
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
              onDetectionStateChange={setIsCurrentlyDetecting}
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
            <div className="space-y-6">
              {/* Diagnosis Context Form */}
              <div className="bg-card/50 backdrop-blur-sm border rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Baby Information (Optional)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Age (weeks)</label>
                    <input
                      type="number"
                      value={diagnosisContext.babyAge || ''}
                      onChange={(e) => setDiagnosisContext(prev => ({
                        ...prev,
                        babyAge: e.target.value ? parseInt(e.target.value) : undefined
                      }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      placeholder="e.g., 8"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Gestational Age</label>
                    <input
                      type="number"
                      value={diagnosisContext.gestationalAge || ''}
                      onChange={(e) => setDiagnosisContext(prev => ({
                        ...prev,
                        gestationalAge: e.target.value ? parseInt(e.target.value) : undefined
                      }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      placeholder="e.g., 37"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="jaundiced"
                      checked={diagnosisContext.isJaundiced}
                      onChange={(e) => setDiagnosisContext(prev => ({
                        ...prev,
                        isJaundiced: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <label htmlFor="jaundiced" className="text-sm font-medium">Jaundiced</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="postFeed"
                      checked={diagnosisContext.postFeed}
                      onChange={(e) => setDiagnosisContext(prev => ({
                        ...prev,
                        postFeed: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <label htmlFor="postFeed" className="text-sm font-medium">Post-Feed</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="fever"
                      checked={diagnosisContext.hasFever}
                      onChange={(e) => setDiagnosisContext(prev => ({
                        ...prev,
                        hasFever: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <label htmlFor="fever" className="text-sm font-medium">Has Fever</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="feedingDifficulty"
                      checked={diagnosisContext.feedingDifficulty}
                      onChange={(e) => setDiagnosisContext(prev => ({
                        ...prev,
                        feedingDifficulty: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <label htmlFor="feedingDifficulty" className="text-sm font-medium">Feeding Issues</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="constipation"
                      checked={diagnosisContext.constipation}
                      onChange={(e) => setDiagnosisContext(prev => ({
                        ...prev,
                        constipation: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <label htmlFor="constipation" className="text-sm font-medium">Constipation</label>
                  </div>
                </div>
              </div>
              
              <AIChatbot 
                detectionResults={detectionResults}
                diagnosisContext={diagnosisContext}
              />
            </div>
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
