import { AlertDashboard } from '@/components/AlertDashboard'
import { FeatureDisplay } from '@/components/FeatureDisplay'
import { CryAnalytics } from '@/components/CryAnalytics'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, AlertTriangle, Cpu } from 'lucide-react'
import { useState } from 'react'
import type { DetectionResult, AudioFeatures } from '@/lib/audioAnalysis'

interface ResultsSectionProps {
  detectionResults: DetectionResult[];
  isMonitoring: boolean;
  latestFeatures: AudioFeatures | null;
}

export function ResultsSection({ detectionResults, isMonitoring, latestFeatures }: ResultsSectionProps) {
  const [resultsView, setResultsView] = useState<'dashboard' | 'features' | 'analytics'>('dashboard');

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Analysis & Results
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          View detection results, analytics, and feature analysis
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Results View Selection */}
        <div className="flex justify-center gap-2">
          <Button
            variant={resultsView === 'dashboard' ? 'default' : 'outline'}
            onClick={() => setResultsView('dashboard')}
            className="flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Alert Dashboard
          </Button>
          <Button
            variant={resultsView === 'features' ? 'default' : 'outline'}
            onClick={() => setResultsView('features')}
            className="flex items-center gap-2"
          >
            <Cpu className="w-4 h-4" />
            Feature Analysis
          </Button>
          <Button
            variant={resultsView === 'analytics' ? 'default' : 'outline'}
            onClick={() => setResultsView('analytics')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </Button>
        </div>

        {/* Results Display */}
        <div className="min-h-[400px]">
          {resultsView === 'dashboard' && (
            <AlertDashboard 
              detectionResults={detectionResults}
              isMonitoring={isMonitoring}
            />
          )}

          {resultsView === 'features' && (
            <FeatureDisplay features={latestFeatures} />
          )}

          {resultsView === 'analytics' && (
            <CryAnalytics />
          )}
        </div>
      </CardContent>
    </Card>
  );
}