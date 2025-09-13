import React from 'react';
import type { AudioFeatures } from '@/lib/audioAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Volume2, Zap, BarChart3, Clock, Waves } from 'lucide-react';

interface FeatureDisplayProps {
  features: AudioFeatures | null;
}

export const FeatureDisplay: React.FC<FeatureDisplayProps> = ({ features }) => {
  if (!features) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Audio Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No audio data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatValue = (value: number, decimals: number = 1): string => {
    return isNaN(value) ? 'N/A' : value.toFixed(decimals);
  };

  const getStatusBadge = (value: number, thresholds: { high: number, medium?: number, label?: string }) => {
    if (value > thresholds.high) {
      return <Badge variant="warning">High</Badge>;
    } else if (thresholds.medium && value > thresholds.medium) {
      return <Badge variant="info">Elevated</Badge>;
    } else {
      return <Badge variant="success">Normal</Badge>;
    }
  };

  const featureGroups: Array<{
    title: string;
    icon: React.ReactNode;
    items: Array<{
      label: string;
      value: string;
      badge?: React.ReactNode;
      description?: string;
    }>;
  }> = [
    {
      title: 'Fundamental Frequency',
      icon: <Waves className="w-5 h-5" />,
      items: [
        {
          label: 'Mean F0',
          value: `${formatValue(features.f0Mean, 0)} Hz`,
          badge: getStatusBadge(features.f0Mean, { high: 1000, medium: 800 })
        },
        {
          label: 'F0 Standard Deviation',
          value: `${formatValue(features.f0Std, 0)} Hz`,
          description: 'Frequency stability measure'
        },
        {
          label: 'F0 Range',
          value: features.f0.length > 0 
            ? `${Math.min(...features.f0).toFixed(0)}-${Math.max(...features.f0).toFixed(0)} Hz`
            : 'N/A'
        }
      ]
    },
    {
      title: 'Voice Quality',
      icon: <Volume2 className="w-5 h-5" />,
      items: [
        {
          label: 'Harmonics-to-Noise Ratio',
          value: `${formatValue(features.hnr)} dB`,
          badge: getStatusBadge(-features.hnr, { high: -5, medium: -10 }), // Inverted because lower HNR is worse
          description: 'Voice clarity measure'
        },
        {
          label: 'Jitter',
          value: `${formatValue(features.jitter, 2)}%`,
          badge: getStatusBadge(features.jitter, { high: 1.5, medium: 1.0 }),
          description: 'Frequency perturbation'
        },
        {
          label: 'Shimmer',
          value: `${formatValue(features.shimmer, 2)}%`,
          badge: getStatusBadge(features.shimmer, { high: 4.0, medium: 2.5 }),
          description: 'Amplitude perturbation'
        }
      ]
    },
    {
      title: 'Spectral Analysis',
      icon: <BarChart3 className="w-5 h-5" />,
      items: [
        {
          label: 'RMS Amplitude',
          value: formatValue(features.rms, 3),
          description: 'Overall signal strength'
        },
        {
          label: 'Spectral Centroid',
          value: `${formatValue(features.spectralCentroid, 0)} Hz`,
          description: 'Frequency brightness measure'
        },
        {
          label: 'Spectral Flatness',
          value: formatValue(features.spectralFlatness, 3),
          description: 'Signal tonality (0=tonal, 1=noisy)'
        }
      ]
    },
    {
      title: 'Temporal Features',
      icon: <Clock className="w-5 h-5" />,
      items: [
        {
          label: 'Total Duration',
          value: `${formatValue(features.duration)} s`
        },
        {
          label: 'Voiced Segments',
          value: features.voicedSegmentLengths.length.toString(),
          description: features.voicedSegmentLengths.length > 0 
            ? `Average: ${formatValue(features.voicedSegmentLengths.reduce((a, b) => a + b) / features.voicedSegmentLengths.length, 2)} s`
            : 'No segments detected'
        },
        {
          label: 'Pause Count',
          value: features.pauseLengths.length.toString(),
          description: features.pauseLengths.length > 0 
            ? `Average: ${formatValue(features.pauseLengths.reduce((a, b) => a + b) / features.pauseLengths.length, 2)} s`
            : 'No pauses detected'
        }
      ]
    },
    {
      title: 'Pattern Analysis',
      icon: <Activity className="w-5 h-5" />,
      items: [
        {
          label: 'Repetition Rate',
          value: `${formatValue(features.repetitionRate, 2)} Hz`,
          description: 'Burst frequency rate'
        },
        {
          label: 'Nasal Energy Ratio',
          value: formatValue(features.nasalEnergyRatio, 3),
          badge: getStatusBadge(features.nasalEnergyRatio, { high: 0.4, medium: 0.25 })
        },
        {
          label: 'Low-Mid Harmonics',
          value: formatValue(features.lowMidHarmonics, 3),
          description: 'Low frequency emphasis ratio'
        }
      ]
    },
    {
      title: 'Signal Properties',
      icon: <Zap className="w-5 h-5" />,
      items: [
        {
          label: 'Sample Rate',
          value: `${features.sampleRate} Hz`
        },
        {
          label: 'Burst Segments',
          value: features.burstLengths.length.toString(),
          description: features.burstLengths.length > 0 
            ? `Average: ${formatValue(features.burstLengths.reduce((a, b) => a + b) / features.burstLengths.length, 2)} s`
            : 'None detected'
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Audio Features Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureGroups.map((group, groupIndex) => (
              <Card key={groupIndex} className="border-muted">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="text-muted-foreground">{group.icon}</div>
                    <CardTitle className="text-base">{group.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {group.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">
                            {item.label}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono">
                              {item.value}
                            </span>
                            {item.badge}
                          </div>
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* F0 Contour Visualization */}
      {features.f0.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">F0 Contour Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-20 flex items-end justify-center gap-1 bg-muted/30 rounded-lg p-4">
              {features.f0.slice(0, 50).map((f0, index) => {
                const normalizedHeight = Math.min((f0 - 100) / 1000, 1) * 100;
                const isElevated = f0 > 1000;
                const isHigh = f0 > 800;
                
                return (
                  <div
                    key={index}
                    className={`w-1 rounded-t-sm transition-all duration-100 ${
                      isElevated ? 'bg-red-500' : 
                      isHigh ? 'bg-yellow-500' : 
                      'bg-primary/60'
                    }`}
                    style={{
                      height: `${Math.max(normalizedHeight, 2)}%`,
                      minHeight: '2px'
                    }}
                    title={`${f0.toFixed(0)} Hz`}
                  />
                );
              })}
            </div>
            <div className="text-xs text-muted-foreground mt-2 text-center">
              Fundamental frequency over time (first 50 frames) • Red: {'>'} 1000Hz • Yellow: {'>'} 800Hz
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};