import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, SparklesIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { getAuthToken } from '../../utils/auth';
import { logger } from '../../lib/productionLogger'

interface CoachingWidgetProps {
  className?: string;
}

const CoachingWidget: React.FC<CoachingWidgetProps> = ({ className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{
    answer: string;
    tips: string[];
    priority: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAskQuestion = async () => {
    if (!question.trim() || loading) return;

    try {
      setLoading(true);
      setError(null);
      setResponse(null);

      const apiResponse = await fetch('/api/coaching/quick-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ question })
      });

      const data = await apiResponse.json();

      if (data.success) {
        setResponse(data.data);
        setQuestion(''); // Clear the question after successful response
      } else {
        setError(data.message || 'Neizdevās saņemt atbildi');
      }
    } catch (err) {
      setError('Error sazināties ar asistentu');
      logger.error('ERROR', 'Question error:', { error: err });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskQuestion();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-900/20 border-red-700';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-700';
      case 'low': return 'text-green-400 bg-green-900/20 border-green-700';
      default: return 'text-blue-400 bg-blue-900/20 border-blue-700';
    }
  };

  return (
    <div className={`bg-slate-800 border border-gray-700 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-700/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-coral/20 rounded-lg">
            <SparklesIcon className="w-5 h-5 text-coral" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-adaptive-white">Personālais Treneris</h3>
            <p className="text-sm text-adaptive-light">Uzdod jautājumu par treniņiem</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {loading && (
            <div className="animate-spin w-4 h-4 border-2 border-coral border-t-transparent rounded-full"></div>
          )}
          {isExpanded ? (
            <ChevronUpIcon className="w-5 h-5 text-adaptive-light" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-adaptive-light" />
          )}
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="border-t border-gray-700">
          {/* Question Input */}
          <div className="p-4 space-y-3">
            <div className="relative">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Piemēram: Kā uzlabot savu 5K laiku? Vai man vajag vairāk atpūtas?"
                rows={3}
                className="w-full px-3 py-2 pr-10 bg-slate-700 border border-gray-600 rounded-lg text-adaptive-white placeholder-gray-400 focus:border-coral focus:outline-none resize-none"
                disabled={loading}
              />
              <button
                onClick={handleAskQuestion}
                disabled={loading || !question.trim()}
                className="absolute bottom-2 right-2 p-1.5 bg-coral text-adaptive-white rounded-md hover:bg-coral-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChatBubbleLeftRightIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Questions */}
            <div className="flex flex-wrap gap-2">
              {[
                'Kā uzlabot savu tempo?',
                'Vai man vajag vairāk atpūtas?',
                'Ko ēst pirms garā skrējiena?',
                'Kā izvairīties no traumām?'
              ].map((quickQuestion) => (
                <button
                  key={quickQuestion}
                  onClick={() => setQuestion(quickQuestion)}
                  className="px-3 py-1 text-xs bg-slate-700 text-adaptive-light rounded-full hover:bg-slate-600 transition-colors"
                  disabled={loading}
                >
                  {quickQuestion}
                </button>
              ))}
            </div>
          </div>

          {/* Coach Response */}
          {response && (
            <div className="p-4 bg-slate-700/50 border-t border-gray-600">
              <div className="space-y-3">
                {/* Priority Badge */}
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(response.priority)}`}>
                    {response.priority === 'high' && '🔴 Augsta prioritāte'}
                    {response.priority === 'medium' && '🟡 Vidēja prioritāte'}
                    {response.priority === 'low' && '🟢 Zema prioritāte'}
                  </span>
                  <span className="text-xs text-muted">Trenera atbilde</span>
                </div>

                {/* Main Answer */}
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-adaptive-white text-sm leading-relaxed">{response.answer}</p>
                </div>

                {/* Additional Tips */}
                {response.tips && response.tips.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-adaptive-light mb-2">Papildus ieteikumi:</h4>
                    <div className="space-y-1">
                      {response.tips.slice(0, 3).map((tip, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 bg-coral rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-sm text-adaptive-light">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 bg-red-900/20 border-t border-red-700">
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-300 hover:text-red-200 text-xs mt-1 underline"
              >
                Aizvērt
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="p-4 bg-blue-900/20 border-t border-blue-700">
              <div className="flex items-center space-x-3">
                <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                <p className="text-blue-400 text-sm">Treneris analizē jūsu jautājumu...</p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-3 bg-slate-700/30 border-t border-gray-600">
            <p className="text-xs text-muted text-center">
              ⚡ Profesionālas konsultācijas • Atbildes ir informatīvas un neaizstāj ārsta padomu
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachingWidget;