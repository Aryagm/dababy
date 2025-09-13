import { useState } from 'react'
import { ContinuousMonitor } from '@/components/ContinuousMonitor'
import { WaveformRecorder } from '@/components/WaveformRecorder'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Mic } from 'lucide-react'
import type { DetectionResult } from '@/lib/audioAnalysis'
import type { CryInstance } from '@/lib/cryDetection'

interface RecordingSectionProps {
  onDetectionResult: (result: DetectionResult) => void;
  onCryDetected: (cry: CryInstance) => void;
  isMonitoring: boolean;
  onMonitoringChange: (monitoring: boolean) => void;
}

export function RecordingSection({ 
  onDetectionResult, 
  onCryDetected, 
  isMonitoring, 
  onMonitoringChange 
}: RecordingSectionProps) {
  const [recordingMode, setRecordingMode] = useState<'continuous' | 'single'>('single');

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Mic className="w-5 h-5" />
          Recording & Monitoring
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose your monitoring approach and start recording
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recording Mode Selection */}
        <div className="flex justify-center gap-2">
          <Button
            variant={recordingMode === 'continuous' ? 'default' : 'outline'}
            onClick={() => setRecordingMode('continuous')}
            className="flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            Continuous Monitoring
          </Button>
          <Button
            variant={recordingMode === 'single' ? 'default' : 'outline'}
            onClick={() => setRecordingMode('single')}
            className="flex items-center gap-2"
          >
            <Mic className="w-4 h-4" />
            Single Recording
          </Button>
        </div>

        {/* Recording Component */}
        <div className="flex justify-center">
          {recordingMode === 'continuous' ? (
            <ContinuousMonitor 
              onDetectionResult={onDetectionResult}
              isMonitoring={isMonitoring}
              onMonitoringChange={onMonitoringChange}
            />
          ) : (
            <WaveformRecorder 
              onCryDetected={onCryDetected}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}