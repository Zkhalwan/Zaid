import React, { useState } from 'react';
import { Sparkles, X, Send, Loader2, ArrowLeft, ExternalLink, Lightbulb, Play } from 'lucide-react';
import { AiTool, AI_TOOLS } from '../data/toolsData';

interface AiAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectToolByName: (name: string) => void;
}

export const AiAdvisorModal: React.FC<AiAdvisorModalProps> = ({
  isOpen,
  onClose,
  onSelectToolByName,
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickQuestions = [
    'بدي أداة مجانية تحول الكتب والمستندات لبودكاست صوتي',
    'ما هي أفضل أداة لتوليد فيديوهات سينمائية متحركة من الصور؟',
    'أنا مبرمج، ما الفرق بين Cursor و Claude في كتابة الأكواد؟',
    'أداة لاستنساخ الصوت وقراءة المقالات بنبرة بشرية طبيعية',
  ];

  const handleAsk = async (textToAsk?: string) => {
    const q = textToAsk || query;
    if (!q || q.trim().length === 0) return;

    try {
      setIsLoading(true);
      setError(null);
      setResult(null);

      const res = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get recommendation');
      }

      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'تعذر الاتصال بالمستشار الذكي حالياً.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 font-bold flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">المستشار الذكي لأدوات الذكاء الاصطناعي</h2>
              <p className="text-xs text-slate-400">
                اكتب ما تريد إنجازه وسيرشح لك الذكاء الاصطناعي الأداة الأنسب لمشروعك فوراً
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-5 flex flex-col gap-5 scrollbar-thin">
          {/* Query Input */}
          <div className="flex flex-col gap-2">
            <div className="relative flex items-center">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAsk();
                }}
                placeholder="اكتب ماذا تريد أن تفعل (مثال: بدي أداة تصنع لي فيديو مجاني لمتجري)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pr-4 pl-12 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
              <button
                onClick={() => handleAsk()}
                disabled={isLoading || !query.trim()}
                className="absolute left-3 p-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl disabled:opacity-40 transition-colors"
                title="إرسال السؤال"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>

            {/* Quick Prompts */}
            {!result && (
              <div className="flex flex-col gap-1.5 pt-2">
                <span className="text-[11px] text-slate-500">أو جرب هذه الأسئلة الشائعة:</span>
                <div className="flex flex-col gap-1.5">
                  {quickQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setQuery(q);
                        handleAsk(q);
                      }}
                      className="text-right text-xs p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Result View */}
          {result && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              {/* Summary */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs">
                <span className="font-bold text-amber-400 block mb-1">توصية المستشار:</span>
                <p className="text-slate-200 leading-relaxed">{result.summary}</p>
              </div>

              {/* Recommended tools list */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold text-white">الأدوات المرشحة لك:</span>
                {result.recommendedTools?.map((t: any, idx: number) => {
                  // Find if tool exists in our dataset
                  const matchingTool = AI_TOOLS.find(
                    (item) => item.name.toLowerCase().includes(t.toolName.toLowerCase()) || 
                              t.toolName.toLowerCase().includes(item.name.toLowerCase())
                  );

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-white">{t.toolName}</h4>
                          <span className="text-slate-400 text-[11px] font-mono">({t.pricingInfo})</span>
                        </div>

                        {matchingTool && (
                          <button
                            onClick={() => {
                              onSelectToolByName(matchingTool.name);
                              onClose();
                            }}
                            className="flex items-center gap-1 text-[11px] text-amber-400 hover:underline"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>شاهد فيديو الشرح</span>
                          </button>
                        )}
                      </div>

                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        <strong className="text-amber-300">لماذا هذه الأداة: </strong>
                        {t.whyThisTool}
                      </p>

                      {t.recommendedPrompt && (
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 font-mono text-[11px] text-slate-300">
                          <span className="text-slate-500 block text-[10px] mb-0.5">برومبت مقترح لتجربته:</span>
                          "{t.recommendedPrompt}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pro Tip */}
              {result.proTip && (
                <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs flex items-start gap-2.5 text-indigo-200">
                  <Lightbulb className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-indigo-300 block mb-0.5">نصيحة ذهبية:</span>
                    <p className="leading-relaxed text-[11px]">{result.proTip}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
