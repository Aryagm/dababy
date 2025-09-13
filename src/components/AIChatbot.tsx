import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import type { DetectionResult } from '@/lib/audioAnalysis';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface AIChatbotProps {
  detectionResults: DetectionResult[];
  className?: string;
}

export function AIChatbot({ detectionResults, className = '' }: AIChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm your AI assistant for cry analysis. I can help explain detection results, provide insights about baby crying patterns, and answer questions about the analysis. How can I help you today?",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Get latest detection for context
    const latestDetection = detectionResults[detectionResults.length - 1];
    
    // Pattern matching for different types of questions
    if (lowerMessage.includes('what') && lowerMessage.includes('mean')) {
      if (latestDetection) {
        const { features, riskLevel } = latestDetection;
        return `Based on your latest detection: The crying pattern shows a fundamental frequency of ${features.f0Mean.toFixed(0)}Hz (pitch), duration of ${features.duration.toFixed(1)} seconds, and ${riskLevel} risk level. Higher frequencies often indicate distress, while lower frequencies may suggest hunger or tiredness.`;
      }
      return "I can explain cry analysis results once you have some detections. The main factors I analyze include pitch (fundamental frequency), duration, intensity, and voice quality to assess the baby's needs.";
    }
    
    if (lowerMessage.includes('risk') || lowerMessage.includes('alert')) {
      if (latestDetection) {
        const alertCount = latestDetection.alerts.length;
        return `Your latest detection shows ${latestDetection.riskLevel} risk level with ${alertCount} alerts. ${latestDetection.riskLevel === 'critical' ? 'This suggests immediate attention may be needed.' : latestDetection.riskLevel === 'high' ? 'This indicates the baby may need attention soon.' : 'This appears to be normal crying behavior.'}`;
      }
      return "Risk levels help prioritize responses: 'Low' indicates normal crying, 'Medium' suggests monitoring, 'High' indicates attention needed, and 'Critical' suggests immediate response.";
    }
    
    if (lowerMessage.includes('frequency') || lowerMessage.includes('pitch')) {
      return "Fundamental frequency (pitch) is crucial in cry analysis. Higher pitches (>500Hz) often indicate pain or distress, moderate pitches (300-500Hz) suggest discomfort or general needs, and lower pitches (<300Hz) typically indicate hunger or tiredness.";
    }
    
    if (lowerMessage.includes('duration') || lowerMessage.includes('long')) {
      return "Cry duration patterns are important: Brief cries (<3s) often express immediate needs, moderate durations (3-10s) indicate general discomfort, and extended crying (>10s) may suggest persistent discomfort requiring attention.";
    }
    
    if (lowerMessage.includes('hungry') || lowerMessage.includes('hunger')) {
      return "Hunger cries typically have lower fundamental frequencies (250-400Hz), regular rhythmic patterns, and start softly then build in intensity. They often have a repetitive, demanding quality.";
    }
    
    if (lowerMessage.includes('pain') || lowerMessage.includes('hurt')) {
      return "Pain cries are usually high-pitched (>500Hz), sudden onset, intense, and piercing. They often have irregular patterns and may be accompanied by breathlessness or voice breaks.";
    }
    
    if (lowerMessage.includes('tired') || lowerMessage.includes('sleep')) {
      return "Tired or sleepy cries tend to be lower in pitch, have a whining quality, and may be accompanied by rubbing eyes or yawning. They often build gradually and have a fussy, irritable tone.";
    }
    
    if (lowerMessage.includes('normal') || lowerMessage.includes('typical')) {
      if (detectionResults.length > 0) {
        const avgDuration = detectionResults.reduce((sum, r) => sum + r.features.duration, 0) / detectionResults.length;
        const avgPitch = detectionResults.reduce((sum, r) => sum + r.features.f0Mean, 0) / detectionResults.length;
        return `Based on your ${detectionResults.length} detections: Average duration is ${avgDuration.toFixed(1)}s, average pitch is ${avgPitch.toFixed(0)}Hz. Normal crying typically ranges 300-500Hz in pitch and 3-8 seconds in duration.`;
      }
      return "Normal baby crying typically has frequencies between 300-500Hz, durations of 3-8 seconds, and shows some variation in intensity. Consistent patterns outside these ranges may indicate specific needs.";
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
      return "I can help explain your cry analysis results, identify patterns in the data, and provide insights about what different crying characteristics might mean. You can ask about specific measurements like pitch, duration, or risk levels, or ask about general crying patterns.";
    }
    
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return "You're welcome! I'm here to help you understand your baby's crying patterns. Feel free to ask any questions about the analysis results or crying behavior in general.";
    }
    
    // Default responses based on context
    if (detectionResults.length === 0) {
      return "I notice you haven't recorded any crying yet. Once you start recording, I can provide detailed analysis and insights about the crying patterns detected.";
    }
    
    // Generic helpful response
    const responses = [
      "That's an interesting question! Could you be more specific about what aspect of cry analysis you'd like to know about?",
      "I'd be happy to help! You can ask me about pitch frequencies, cry durations, risk levels, or what different crying patterns might indicate.",
      "Based on your detection data, I can provide insights about crying patterns. What would you like to know more about?",
      "Feel free to ask about any aspect of the cry analysis - I can explain the measurements, what they mean, or help interpret the results."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateAIResponse(inputMessage),
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1500); // Random delay 1-2.5s
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "What does my latest detection mean?",
    "How do I interpret the risk levels?",
    "What's a normal crying pattern?",
    "What do different pitches indicate?"
  ];

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          AI Assistant
          <Badge variant="secondary" className="ml-auto">
            <Sparkles className="w-3 h-3 mr-1" />
            Beta
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chat Messages */}
        <div className="h-80 overflow-y-auto space-y-3 p-3 border rounded-lg bg-muted/20">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-2 ${
                message.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.sender === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {message.sender === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              <div className={`max-w-[80%] p-3 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-primary text-primary-foreground ml-auto'
                  : 'bg-background border'
              }`}>
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-background border p-3 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length <= 1 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setInputMessage(question)}
                  className="text-xs"
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="flex gap-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about cry analysis, patterns, or interpretations..."
            className="flex-1 min-h-[40px] max-h-[120px] px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={isTyping}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            size="sm"
            className="px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}