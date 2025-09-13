import React, { useState, useEffect } from 'react';
import type { Alert, DetectionResult } from '@/lib/audioAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert as AlertComponent, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Heart, Brain, Stethoscope, Ear, Volume2, Activity, AlertCircle } from 'lucide-react';

interface AlertDashboardProps {
  detectionResults: DetectionResult[];
  isMonitoring: boolean;
}

export const AlertDashboard: React.FC<AlertDashboardProps> = ({ detectionResults, isMonitoring }) => {
  const [currentAlerts, setCurrentAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    if (detectionResults.length > 0) {
      const latest = detectionResults[detectionResults.length - 1];
      setCurrentAlerts(latest.alerts);
    }
  }, [detectionResults]);

  const currentRiskLevel = detectionResults.length > 0 ? 
    detectionResults[detectionResults.length - 1].riskLevel : 'low';

  const criticalAlerts = currentAlerts.filter(a => a.severity === 'critical');

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'hyperphonation': return <Brain className="w-5 h-5" />;
      case 'hoarseness': return <Volume2 className="w-5 h-5" />;
      case 'cri_du_chat': return <AlertTriangle className="w-5 h-5" />;
      case 'weak_cry': return <Activity className="w-5 h-5" />;
      case 'grunting': return <Stethoscope className="w-5 h-5" />;
      case 'serious_illness': return <Heart className="w-5 h-5" />;
      case 'hearing_impairment': return <Ear className="w-5 h-5" />;
      case 'hypernasality': return <Volume2 className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'critical';
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'secondary';
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Monitoring Status</CardTitle>
            <Badge variant={isMonitoring ? 'success' : 'secondary'}>
              {isMonitoring ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">{detectionResults.length}</div>
              <div className="text-sm text-muted-foreground">Total Sessions</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{currentAlerts.length}</div>
              <div className="text-sm text-muted-foreground">Active Alerts</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">{criticalAlerts.length}</div>
              <div className="text-sm text-muted-foreground">Critical Events</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className={`text-2xl font-bold ${
                currentRiskLevel === 'critical' ? 'text-red-600' :
                currentRiskLevel === 'high' ? 'text-orange-600' :
                currentRiskLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {currentRiskLevel.toUpperCase()}
              </div>
              <div className="text-sm text-muted-foreground">Risk Level</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <AlertComponent variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Alert</AlertTitle>
          <AlertDescription>
            {criticalAlerts.length} critical issue(s) detected. Immediate medical attention may be required.
            <div className="mt-2 space-y-1">
              {criticalAlerts.map((alert, index) => (
                <div key={index} className="text-sm font-medium">
                  • {alert.message}: {alert.recommendation}
                </div>
              ))}
            </div>
          </AlertDescription>
        </AlertComponent>
      )}

      {/* Current Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {currentAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No active alerts - monitoring normal</p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentAlerts.map((alert, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getAlertIcon(alert.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">{alert.message}</span>
                        <Badge variant={getBadgeVariant(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                      <p className="text-sm font-medium mb-2">{alert.recommendation}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Confidence: {(alert.confidence * 100).toFixed(0)}%</span>
                        <span>Type: {alert.type}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Analysis History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          {detectionResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No analysis data available</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {detectionResults.slice(-10).reverse().map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      {result.timestamp.toLocaleTimeString()}
                    </span>
                    <Badge variant={getBadgeVariant(result.riskLevel)}>
                      {result.riskLevel}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>F0: <span className="font-mono">{result.features.f0Mean.toFixed(0)}Hz</span></div>
                    <div>Duration: <span className="font-mono">{result.features.duration.toFixed(1)}s</span></div>
                    <div>HNR: <span className="font-mono">{result.features.hnr.toFixed(1)}dB</span></div>
                    <div>Alerts: <span className="font-mono">{result.alerts.length}</span></div>
                  </div>
                  {result.alerts.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Alert types: {result.alerts.map(a => a.type).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};