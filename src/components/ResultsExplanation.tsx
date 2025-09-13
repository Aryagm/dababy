import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Info, TrendingUp, Clock } from 'lucide-react';
import type { DetectionResult } from '@/lib/audioAnalysis';

interface ResultsExplanationProps {
  latestResult: DetectionResult | null;
  totalDetections: number;
}

export function ResultsExplanation({ latestResult, totalDetections }: ResultsExplanationProps) {
  const getExplanation = () => {
    if (!latestResult) {
      return {
        title: "No Recent Analysis",
        description: "Start recording to see AI-powered cry analysis and insights.",
        icon: <Info className="w-5 h-5" />,
        variant: "secondary" as const,
        insights: []
      };
    }

    const { features, riskLevel, alerts } = latestResult;
    
    // Heuristic-based analysis
    const insights = [];
    let title = "";
    let description = "";
    let icon = <CheckCircle className="w-5 h-5" />;
    let variant: "success" | "warning" | "destructive" | "secondary" = "success";

    // Analyze fundamental frequency (pitch)
    if (features.f0Mean > 600) {
      insights.push("High-pitched crying detected - may indicate distress or pain");
    } else if (features.f0Mean < 300) {
      insights.push("Low-pitched crying - often associated with hunger or tiredness");
    } else {
      insights.push("Normal pitch range detected - typical crying pattern");
    }

    // Analyze cry duration
    if (features.duration > 10) {
      insights.push("Extended crying duration - monitor for signs of discomfort");
    } else if (features.duration < 3) {
      insights.push("Brief crying episode - likely expressing immediate need");
    }

    // Analyze harmonics and voice quality
    if (features.hnr < 10) {
      insights.push("Breathy or hoarse quality detected - may indicate vocal strain");
    }

    // Analyze intensity patterns
    if (features.rms > 0.3) {
      insights.push("High intensity crying - strong emotional or physical response");
    }

    // Risk level assessment
    switch (riskLevel) {
      case 'critical':
        title = "Critical Alert Detected";
        description = "Immediate attention recommended based on cry characteristics";
        icon = <AlertTriangle className="w-5 h-5" />;
        variant = "destructive";
        break;
      case 'high':
        title = "High Priority Detection";
        description = "Crying patterns suggest possible discomfort or urgent need";
        icon = <AlertTriangle className="w-5 h-5" />;
        variant = "warning";
        break;
      case 'medium':
        title = "Moderate Crying Detected";
        description = "Normal crying with some indicators worth monitoring";
        icon = <TrendingUp className="w-5 h-5" />;
        variant = "warning";
        break;
      default:
        title = "Normal Crying Pattern";
        description = "Typical crying characteristics within expected ranges";
        icon = <CheckCircle className="w-5 h-5" />;
        variant = "success";
    }

    // Add alert-specific insights
    if (alerts.length > 0) {
      alerts.forEach(alert => {
        insights.push(`Alert: ${alert.message}`);
      });
    }

    return { title, description, icon, variant, insights };
  };

  const explanation = getExplanation();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {explanation.icon}
          AI Analysis Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{explanation.title}</h3>
            <p className="text-sm text-muted-foreground">{explanation.description}</p>
          </div>
          <Badge variant={explanation.variant}>
            {latestResult?.riskLevel?.toUpperCase() || 'NONE'}
          </Badge>
        </div>

        {/* Session Statistics */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{totalDetections}</span>
            </div>
            <p className="text-xs text-muted-foreground">Total Detections</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {latestResult ? latestResult.features.duration.toFixed(1) : '0.0'}s
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Last Duration</p>
          </div>
        </div>

        {/* AI Insights */}
        {explanation.insights.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <h4 className="font-medium text-sm">AI Insights:</h4>
            <ul className="space-y-1">
              {explanation.insights.map((insight, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}