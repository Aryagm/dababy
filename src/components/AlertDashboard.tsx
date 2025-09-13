import React, { useState, useEffect } from 'react';
import type { Alert, DetectionResult } from '@/lib/audioAnalysis';
import { AlertTriangle, Heart, Brain, Stethoscope, Ear, Volume2, Activity, AlertCircle } from 'lucide-react';

interface AlertDashboardProps {
  detectionResults: DetectionResult[];
  isMonitoring: boolean;
}

export const AlertDashboard: React.FC<AlertDashboardProps> = ({ detectionResults, isMonitoring }) => {
  const [currentAlerts, setCurrentAlerts] = useState<Alert[]>([]);
  const [alertHistory, setAlertHistory] = useState<Array<{ timestamp: Date; alert: Alert }>>([]);

  useEffect(() => {
    if (detectionResults.length > 0) {
      const latest = detectionResults[detectionResults.length - 1];
      setCurrentAlerts(latest.alerts);
      
      // Add new alerts to history
      latest.alerts.forEach(alert => {
        setAlertHistory(prev => [...prev, { timestamp: latest.timestamp, alert }].slice(-50)); // Keep last 50 alerts
      });
    }
  }, [detectionResults]);

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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50 text-red-900';
      case 'high': return 'border-orange-500 bg-orange-50 text-orange-900';
      case 'medium': return 'border-yellow-500 bg-yellow-50 text-yellow-900';
      case 'low': return 'border-blue-500 bg-blue-50 text-blue-900';
      default: return 'border-gray-500 bg-gray-50 text-gray-900';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const currentRiskLevel = detectionResults.length > 0 ? 
    detectionResults[detectionResults.length - 1].riskLevel : 'low';

  const criticalAlerts = currentAlerts.filter(a => a.severity === 'critical');
  const highAlerts = currentAlerts.filter(a => a.severity === 'high');

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Status Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-4 h-4 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <h1 className="text-2xl font-bold text-gray-900">
              Baby Cry Monitoring Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Current Risk Level:</span>
            <div className={`px-4 py-2 rounded-full text-white font-semibold ${getRiskLevelColor(currentRiskLevel)}`}>
              {currentRiskLevel.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-600 text-white rounded-xl p-6 border-l-4 border-red-800">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold">CRITICAL ALERT</h2>
              <p className="text-red-100">Immediate medical attention may be required</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {criticalAlerts.map((alert, index) => (
              <div key={index} className="bg-red-700 rounded-lg p-3">
                <div className="font-semibold">{alert.message}</div>
                <div className="text-sm text-red-100">{alert.recommendation}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* High Priority Alerts */}
      {highAlerts.length > 0 && (
        <div className="bg-orange-100 border-l-4 border-orange-500 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-orange-600" />
            <h3 className="text-lg font-semibold text-orange-900">High Priority Alerts</h3>
          </div>
          <div className="space-y-3">
            {highAlerts.map((alert, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-orange-200">
                <div className="flex items-start gap-3">
                  <div className="text-orange-600">{getAlertIcon(alert.type)}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-orange-900">{alert.message}</div>
                    <div className="text-sm text-orange-700 mt-1">{alert.description}</div>
                    <div className="text-sm text-orange-800 mt-2 font-medium">{alert.recommendation}</div>
                    <div className="text-xs text-orange-600 mt-1">
                      Confidence: {(alert.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Active Alerts */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Active Alerts</h3>
        {currentAlerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No active alerts - monitoring normal</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {currentAlerts.map((alert, index) => (
              <div key={index} className={`border-l-4 rounded-lg p-4 ${getSeverityColor(alert.severity)}`}>
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getAlertIcon(alert.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{alert.message}</span>
                      <span className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded-full">
                        {alert.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{alert.description}</p>
                    <p className="text-sm font-medium mb-1">{alert.recommendation}</p>
                    <div className="flex items-center gap-4 text-xs">
                      <span>Confidence: {(alert.confidence * 100).toFixed(0)}%</span>
                      <span>Type: {alert.type}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analysis History */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Analysis History</h3>
        {detectionResults.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No analysis data available</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {detectionResults.slice(-10).reverse().map((result, index) => (
              <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    {result.timestamp.toLocaleTimeString()}
                  </span>
                  <div className={`px-2 py-1 rounded text-xs text-white ${getRiskLevelColor(result.riskLevel)}`}>
                    {result.riskLevel}
                  </div>
                </div>
                <div className="text-sm text-gray-700">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div>F0: {result.features.f0Mean.toFixed(0)}Hz</div>
                    <div>Duration: {result.features.duration.toFixed(1)}s</div>
                    <div>HNR: {result.features.hnr.toFixed(1)}dB</div>
                    <div>Alerts: {result.alerts.length}</div>
                  </div>
                </div>
                {result.alerts.length > 0 && (
                  <div className="mt-2 text-xs text-gray-600">
                    Alert types: {result.alerts.map(a => a.type).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Total Sessions</h4>
          <div className="text-3xl font-bold text-blue-600">{detectionResults.length}</div>
          <div className="text-sm text-gray-600">Analysis sessions completed</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Total Alerts</h4>
          <div className="text-3xl font-bold text-orange-600">{alertHistory.length}</div>
          <div className="text-sm text-gray-600">Alerts generated</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Critical Events</h4>
          <div className="text-3xl font-bold text-red-600">
            {alertHistory.filter(h => h.alert.severity === 'critical').length}
          </div>
          <div className="text-sm text-gray-600">Requiring immediate attention</div>
        </div>
      </div>
    </div>
  );
};