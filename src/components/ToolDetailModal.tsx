import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Play, 
  Check, 
  Copy, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  Info, 
  DollarSign, 
  ThumbsUp, 
  ThumbsDown,
  Layers,
  Bot,
  Video,
  Heart,
  Star,
  MessageSquare,
  Trash2,
  Send,
  LogIn,
  Loader2,
  HardDrive
} from 'lucide-react';
import { AiTool } from '../data/toolsData';
import { AiVideoPlayer } from './AiVideoPlayer';
import { useFirebase } from '../context/FirebaseContext';
import { exportToolGuideToDrive } from '../services/googleDriveService';

interface ToolDetailModalProps {
  tool: AiTool | null;
  onClose: () => void;
}

export const ToolDetailModal: React.FC<ToolDetailModalProps> = ({
  tool,
  onClose,
}) => {
  const [videoMode, setVideoMode] = useState<'ai' | 'youtube'>('ai');
  const [copiedPromptIdx, setCopiedPromptIdx] = useState<number | null>(null);

  // Reviews and Firebase state
  const { user, signIn, getDriveToken, isFavorite, toggleFavorite, getToolReviews, addReview, deleteReview } = useFirebase();
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Google Drive export state
  const [isExportingToDrive, setIsExportingToDrive] = useState(false);
  const [driveExportResult, setDriveExportResult] = useState<string | null>(null);

  if (!tool) return null;

  const favorited = isFavorite(tool.id);
  const reviews = getToolReviews(tool.id);

  const handleCopyPrompt = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptIdx(idx);
    setTimeout(() => setCopiedPromptIdx(null), 2500);
  };

  const handleToggleFavorite = async () => {
    await toggleFavorite(tool);
  };

  const handleSaveGuideToDrive = async () => {
    setIsExportingToDrive(true);
    setDriveExportResult(null);
    try {
      const token = await getDriveToken();
      if (!token) return;
      const file = await exportToolGuideToDrive(token, tool);
      setDriveExportResult(`تم حفظ الدليل بنجاح في Google Drive (${file.name})`);
      setTimeout(() => setDriveExportResult(null), 4000);
    } catch (err: any) {
      console.error(err);
      setDriveExportResult('حدث خطأ أثناء التصدير إلى Google Drive.');
      setTimeout(() => setDriveExportResult(null), 4000);
    } finally {
      setIsExportingToDrive(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || newComment.trim().length < 3) {
      setReviewError('يرجى كتابة تعليق لا يقل عن 3 أحرف.');
      return;
    }
    setReviewError(null);
    setIsSubmittingReview(true);
    try {
      await addReview(tool.id, newRating, newComment);
      setNewComment('');
    } catch (err: any) {
      console.error(err);
      setReviewError('حدث خطأ أثناء حفظ التقييم. تأكد من اتصالك بالإنترنت.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-slate-200 flex flex-col max-h-[94vh] overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-rose-500 text-slate-950 font-bold flex items-center justify-center text-lg">
              {tool.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{tool.name}</h2>
                <span className="text-xs text-slate-400">({tool.arabicName})</span>
              </div>
              <div className="text-xs text-slate-400">
                <span>تطوير: {tool.developer}</span>
                <span className="mx-1.5 text-slate-600">·</span>
                <span>{tool.pricing}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Google Drive Export Button */}
            <button
              onClick={handleSaveGuideToDrive}
              disabled={isExportingToDrive}
              title="حفظ دليل الأداة وملخصها في Google Drive"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-sky-500/40 bg-sky-950/30 text-sky-300 hover:bg-sky-900/40 transition-all disabled:opacity-50"
            >
              {isExportingToDrive ? (
                <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
              ) : (
                <HardDrive className="w-4 h-4 text-sky-400" />
              )}
              <span className="hidden sm:inline">حفظ في Drive</span>
            </button>

            {/* Firebase Favorite Toggle */}
            <button
              onClick={handleToggleFavorite}
              title={favorited ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                favorited
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <Heart className={`w-4 h-4 ${favorited ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span className="hidden sm:inline">{favorited ? 'في المفضلة' : 'حفظ'}</span>
            </button>

            <a
              href={tool.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors"
            >
              <span>الموقع الرسمي للأداة</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drive Toast Message */}
        {driveExportResult && (
          <div className="px-6 py-2 bg-sky-950 border-b border-sky-500/30 text-sky-300 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-sky-400" />
              <span>{driveExportResult}</span>
            </span>
            <button onClick={() => setDriveExportResult(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-7 scrollbar-thin">
          {/* Video Mode Switcher */}
          <div className="flex items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setVideoMode('ai')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  videoMode === 'ai'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bot className="w-4 h-4" />
                <span>فيديو شرح بالذكاء الاصطناعي (AI Presenter)</span>
              </button>

              <button
                onClick={() => setVideoMode('youtube')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  videoMode === 'youtube'
                    ? 'bg-slate-800 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>فيديو يوتيوب التوضيحي</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-500 hidden sm:inline">
              {videoMode === 'ai' ? 'مشاهد ومحاكاة ناطقة بصوت الذكاء الاصطناعي' : 'تسجيل تطبيقي كامل'}
            </span>
          </div>

          {/* Video Player Display */}
          <div className="w-full rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-xl">
            {videoMode === 'ai' ? (
              <AiVideoPlayer 
                tool={tool} 
                onOpenOfficialUrl={() => window.open(tool.officialUrl, '_blank')} 
              />
            ) : (
              <div className="relative aspect-video w-full">
                <iframe
                  src={tool.videoUrl}
                  title={tool.videoTitle}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
            )}
          </div>

          {/* Description & Core Specs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-400" />
                  <span>نبذة تعريفية ودليل الاستخدام:</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              {/* Features List */}
              <div>
                <h4 className="text-xs font-bold text-slate-200 mb-2">الميزات الرئيسية:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {tool.keyFeatures.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-slate-300">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Specs Sidebar */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-2">
                بيانات سريعة
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">التصنيف الرئيسي</span>
                  <span className="text-slate-200 font-medium">
                    {tool.category === 'text'
                      ? 'توليد نصوص'
                      : tool.category === 'image'
                      ? 'تصميم صور'
                      : tool.category === 'video'
                      ? 'صناعة فيديو'
                      : tool.category === 'coding'
                      ? 'برمجة'
                      : tool.category === 'audio'
                      ? 'صوتيات وموسيقى'
                      : 'إنتاجية وأبحاث'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px]">المستوى المطلوب</span>
                  <span className="text-slate-200 font-medium">{tool.level}</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px]">باقة الأسعار</span>
                  <span className="text-amber-300 font-medium">{tool.pricing}</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px]">تقييم المنصة</span>
                  <span className="text-slate-200 font-mono font-medium flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{tool.rating} / 5.0</span>
                  </span>
                </div>
              </div>

              {/* Use Cases */}
              <div className="border-t border-slate-800 pt-3">
                <span className="text-slate-400 font-semibold block text-xs mb-2">أفضل حالات الاستخدام:</span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {tool.useCases.map((uc, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>{uc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pros & Cons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5 mb-1.5">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>نقاط القوة:</span>
                  </span>
                  <ul className="space-y-1 text-[11px] text-slate-300">
                    {tool.pros.map((p, i) => (
                      <li key={i}>· {p}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 text-xs">
                  <span className="font-semibold text-rose-400 flex items-center gap-1.5 mb-1.5">
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span>القيود والسلبيات:</span>
                  </span>
                  <ul className="space-y-1 text-[11px] text-slate-300">
                    {tool.cons.map((c, i) => (
                      <li key={i}>· {c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Ready-to-use Prompt Templates */}
          {tool.samplePrompts.length > 0 && (
            <div className="flex flex-col gap-3 pt-4 border-t border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>نماذج أوامر (Prompts) جاهزة للنسخ والتجربة:</span>
              </h3>

              <div className="grid grid-cols-1 gap-3">
                {tool.samplePrompts.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-amber-300">{p.title}</span>
                      <button
                        onClick={() => handleCopyPrompt(p.prompt, idx)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
                      >
                        {copiedPromptIdx === idx ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">تم النسخ!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>نسخ الأمر</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="font-mono text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg leading-relaxed select-all">
                      {p.prompt}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Real-time Firebase Community Reviews & Ratings Section */}
          <div className="flex flex-col gap-4 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  تقييمات وتجارب المستخدمين (مزامنة فورية عبر Firebase)
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {reviews.length} {reviews.length === 1 ? 'تقييم' : 'تقييمات'}
              </span>
            </div>

            {/* Review Submission Form or Auth Callout */}
            {user ? (
              <form
                onSubmit={handleReviewSubmit}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">
                    أضف تقييمك وتجربتك العملية مع {tool.name}:
                  </span>
                  {/* Star Rating Selector */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((starVal) => (
                      <button
                        type="button"
                        key={starVal}
                        onClick={() => setNewRating(starVal)}
                        className="p-1 text-slate-600 hover:text-amber-400 transition-colors"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            starVal <= newRating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-mono font-bold text-amber-400 mr-1.5">
                      {newRating} / 5
                    </span>
                  </div>
                </div>

                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="اكتب انطباعك، نصيحة لمستخدمي الأداة، أو كيف ساعدتك في عملك..."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />

                {reviewError && (
                  <span className="text-xs text-rose-400">{reviewError}</span>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">
                    المشارك: {user.displayName || 'مستخدم مسجل'}
                  </span>
                  <button
                    type="submit"
                    disabled={isSubmittingReview || !newComment.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                  >
                    {isSubmittingReview ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>نشر التقييم في السحابة</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      هل جربت أداة {tool.name}؟
                    </span>
                    <span className="text-[11px] text-slate-400">
                      سجّل الدخول بحساب Google لمشاركة رأيك وحفظ الأداة في قائمتك المفضلة.
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => signIn()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-semibold rounded-xl transition-all shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>تسجيل الدخول بـ Google</span>
                </button>
              </div>
            )}

            {/* List of Reviews from Firestore */}
            <div className="space-y-3 mt-2">
              {reviews.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-850">
                  كن أول من يشارك تجربة وتقييم حول {tool.name} عبر مجتمع المنصة!
                </div>
              ) : (
                reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {rev.userPhoto ? (
                          <img
                            src={rev.userPhoto}
                            alt={rev.userName}
                            referrerPolicy="no-referrer"
                            className="w-6 h-6 rounded-full object-cover border border-amber-400/20"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-800 text-[10px] font-bold text-amber-300 flex items-center justify-center">
                            {rev.userName.charAt(0)}
                          </div>
                        )}
                        <span className="text-xs font-bold text-white">
                          {rev.userName}
                        </span>
                        <div className="flex items-center gap-0.5 mr-2">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= rev.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(rev.createdAt).toLocaleDateString('ar-EG')}
                        </span>
                        {user && user.uid === rev.userId && (
                          <button
                            onClick={() => deleteReview(rev.id)}
                            title="حذف تقييمي"
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed pr-8">
                      {rev.comment}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-500 hidden sm:inline">
              موسوعة أدوات الذكاء الاصطناعي · متكاملة مع Google Drive و Firebase
            </span>
            <button
              onClick={handleSaveGuideToDrive}
              disabled={isExportingToDrive}
              className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-medium"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>تصدير هذا الدليل إلى Google Drive</span>
            </button>
          </div>

          <a
            href={tool.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-amber-400 hover:underline font-semibold"
          >
            <span>زيارة موقع {tool.name} الآن</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
