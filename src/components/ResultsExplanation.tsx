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
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          {explanation.icon}
          <span className="text-lg font-semibold">AI Analysis Summary</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-6">
        {/* Current Status */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-base mb-2">{explanation.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{explanation.description}</p>
          </div>
          <Badge variant={explanation.variant} className="px-3 py-1 text-xs font-medium">
            {latestResult?.riskLevel?.toUpperCase() || 'NONE'}
          </Badge>
        </div>

        {/* Session Statistics */}
        <div className="grid grid-cols-2 gap-6 p-4 bg-muted/20 rounded-lg">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold text-foreground">{totalDetections}</span>
            </div>
            <p className="text-sm text-muted-foreground font-medium">Total Detections</p>
          </div>
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold text-foreground">
                {latestResult ? latestResult.features.duration.toFixed(1) : '0.0'}s
              </span>
            </div>
            <p className="text-sm text-muted-foreground font-medium">Last Duration</p>
          </div>
        </div>

        {/* AI Insights */}
        {explanation.insights.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-foreground">AI Insights:</h4>
            <div className="space-y-3">
              {explanation.insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}