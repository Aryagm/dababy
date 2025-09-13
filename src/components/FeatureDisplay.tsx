import React from 'react';
import type { AudioFeatures } from '@/lib/audioAnalysis';
import { Activity, Volume2, Zap, BarChart3, Clock, Waves } from 'lucide-react';

interface FeatureItem {
  label: string;
  value: string;
  status?: string;
  color?: string;
  description?: string;
  warning?: boolean;
}

interface FeatureDisplayProps {
  features: AudioFeatures | null;
}

export const FeatureDisplay: React.FC<FeatureDisplayProps> = ({ features }) => {
  if (!features) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Audio Features</h3>
        <div className="text-center py-8 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No audio data available</p>
        </div>
      </div>
    );
  }

  const formatValue = (value: number, decimals: number = 1): string => {
    return isNaN(value) ? 'N/A' : value.toFixed(decimals);
  };

  const getF0Status = (f0: number) => {
    if (f0 > 1000) return { color: 'text-red-600', status: 'Very High' };
    if (f0 > 800) return { color: 'text-orange-600', status: 'High' };
    if (f0 > 300) return { color: 'text-green-600', status: 'Normal' };
    if (f0 > 100) return { color: 'text-blue-600', status: 'Low' };
    return { color: 'text-gray-600', status: 'Very Low' };
  };

  const getHNRStatus = (hnr: number) => {
    if (hnr < 5) return { color: 'text-red-600', status: 'Poor' };
    if (hnr < 10) return { color: 'text-orange-600', status: 'Fair' };
    if (hnr < 15) return { color: 'text-green-600', status: 'Good' };
    return { color: 'text-blue-600', status: 'Excellent' };
  };

  const f0Status = getF0Status(features.f0Mean);
  const hnrStatus = getHNRStatus(features.hnr);

  const featureGroups: Array<{
    title: string;
    icon: React.ReactNode;
    items: FeatureItem[];
  }> = [
    {
      title: 'Fundamental Frequency',
      icon: <Waves className="w-5 h-5" />,
      items: [
        {
          label: 'Mean F0',
          value: `${formatValue(features.f0Mean, 0)} Hz`,
          status: f0Status.status,
          color: f0Status.color
        },
        {
          label: 'F0 Std Dev',
          value: `${formatValue(features.f0Std, 0)} Hz`,
          description: 'Frequency stability'
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
          label: 'HNR',
          value: `${formatValue(features.hnr)} dB`,
          status: hnrStatus.status,
          color: hnrStatus.color,
          description: 'Harmonics-to-noise ratio'
        },
        {
          label: 'Jitter',
          value: `${formatValue(features.jitter, 2)}%`,
          warning: features.jitter > 1.5,
          description: 'Frequency perturbation'
        },
        {
          label: 'Shimmer',
          value: `${formatValue(features.shimmer, 2)}%`,
          warning: features.shimmer > 4,
          description: 'Amplitude perturbation'
        }
      ]
    },
    {
      title: 'Amplitude & Spectral',
      icon: <BarChart3 className="w-5 h-5" />,
      items: [
        {
          label: 'RMS Level',
          value: formatValue(features.rms, 3),
          description: 'Overall amplitude'
        },
        {
          label: 'Spectral Centroid',
          value: `${formatValue(features.spectralCentroid, 0)} Hz`,
          description: 'Brightness measure'
        },
        {
          label: 'Spectral Flatness',
          value: formatValue(features.spectralFlatness, 3),
          description: 'Tonality measure'
        }
      ]
    },
    {
      title: 'Temporal Features',
      icon: <Clock className="w-5 h-5" />,
      items: [
        {
          label: 'Duration',
          value: `${formatValue(features.duration)} s`
        },
        {
          label: 'Voiced Segments',
          value: features.voicedSegmentLengths.length.toString(),
          description: `Avg: ${features.voicedSegmentLengths.length > 0 
            ? formatValue(features.voicedSegmentLengths.reduce((a, b) => a + b) / features.voicedSegmentLengths.length, 2) 
            : '0'} s`
        },
        {
          label: 'Pause Count',
          value: features.pauseLengths.length.toString(),
          description: `Avg: ${features.pauseLengths.length > 0 
            ? formatValue(features.pauseLengths.reduce((a, b) => a + b) / features.pauseLengths.length, 2) 
            : '0'} s`
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
          description: 'Burst frequency'
        },
        {
          label: 'Nasal Energy Ratio',
          value: formatValue(features.nasalEnergyRatio, 3),
          warning: features.nasalEnergyRatio > 0.4
        },
        {
          label: 'Low-Mid Harmonics',
          value: formatValue(features.lowMidHarmonics, 3),
          description: 'Low frequency emphasis'
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
            ? `Avg: ${formatValue(features.burstLengths.reduce((a, b) => a + b) / features.burstLengths.length, 2)} s`
            : 'None detected'
        }
      ]
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Audio Features Analysis</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featureGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="text-blue-600">{group.icon}</div>
              <h4 className="font-semibold text-gray-800">{group.title}</h4>
            </div>
            
            <div className="space-y-3">
              {group.items.map((item, itemIndex) => (
                <div key={itemIndex} className="text-sm">
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600 font-medium">{item.label}:</span>
                    <div className="text-right">
                      <span className={`font-mono ${
                        item.color || (item.warning ? 'text-red-600' : 'text-gray-900')
                      }`}>
                        {item.value}
                      </span>
                      {item.status && (
                        <div className={`text-xs ${item.color}`}>
                          {item.status}
                        </div>
                      )}
                    </div>
                  </div>
                  {item.description && (
                    <div className="text-xs text-gray-500 mt-1">
                      {item.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* F0 Contour Visualization */}
      {features.f0.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-3">F0 Contour</h4>
          <div className="h-20 flex items-end justify-center gap-1">
            {features.f0.slice(0, 50).map((f0, index) => {
              const normalizedHeight = Math.min((f0 - 100) / 1000, 1) * 100;
              const color = f0 > 1000 ? 'bg-red-500' : f0 > 800 ? 'bg-orange-500' : 'bg-blue-500';
              
              return (
                <div
                  key={index}
                  className={`w-1 ${color} opacity-70`}
                  style={{
                    height: `${Math.max(normalizedHeight, 2)}%`,
                    minHeight: '2px'
                  }}
                  title={`${f0.toFixed(0)} Hz`}
                />
              );
            })}
          </div>
          <div className="text-xs text-gray-600 mt-2 text-center">
            Fundamental frequency over time (first 50 frames)
          </div>
        </div>
      )}
    </div>
  );
};