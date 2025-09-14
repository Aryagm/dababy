import { ContinuousMonitor } from '@/components/ContinuousMonitor'
import type { DetectionResult } from '@/lib/audioAnalysis'

interface RecordingSectionProps {
  onDetectionResult: (result: DetectionResult) => void;
  isMonitoring: boolean;
  onMonitoringChange: (monitoring: boolean) => void;
  onDetectionStateChange?: (isDetecting: boolean) => void;
}

export function RecordingSection({ 
  onDetectionResult, 
  isMonitoring, 
  onMonitoringChange,
  onDetectionStateChange
}: RecordingSectionProps) {
  return (
    <div className="w-full">
      {/* Recording Component */}
      <div className="flex justify-center">
        <ContinuousMonitor 
          onDetectionResult={onDetectionResult}
          isMonitoring={isMonitoring}
          onMonitoringChange={onMonitoringChange}
          onDetectionStateChange={onDetectionStateChange}
        />
      </div>
    </div>
  );
}