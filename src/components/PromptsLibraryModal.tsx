import React, { useState } from 'react';
import { BookOpen, X, Copy, Check, Sparkles, Search, Plus, Trash2, Cloud, LogIn, Loader2, HardDrive, Download } from 'lucide-react';
import { AI_TOOLS, SamplePrompt } from '../data/toolsData';
import { useFirebase } from '../context/FirebaseContext';
import { exportPromptsListToDrive } from '../services/googleDriveService';

interface PromptsLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialToolFilter?: string | null;
}

export const PromptsLibraryModal: React.FC<PromptsLibraryModalProps> = ({
  isOpen,
  onClose,
  initialToolFilter,
}) => {
  const { user, signIn, getDriveToken, customPrompts, addCustomPrompt, deleteCustomPrompt } = useFirebase();
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedTool, setSelectedTool] = useState<string>(initialToolFilter || 'all');

  // Custom prompt form state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTool, setNewTool] = useState('ChatGPT');
  const [newCategory, setNewCategory] = useState('كتابة وبرمجة');
  const [newPromptText, setNewPromptText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Google Drive Export state
  const [isExportingToDrive, setIsExportingToDrive] = useState(false);
  const [driveExportSuccess, setDriveExportSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  // Flatten all preset prompts
  const allPrompts: { toolName: string; prompt: SamplePrompt }[] = [];
  AI_TOOLS.forEach((tool) => {
    tool.samplePrompts.forEach((p) => {
      allPrompts.push({ toolName: tool.name, prompt: p });
    });
  });

  const filteredPresets = allPrompts.filter((item) => {
    const matchesTool = selectedTool === 'all' || item.toolName === selectedTool;
    const matchesSearch =
      !search ||
      item.prompt.title.toLowerCase().includes(search.toLowerCase()) ||
      item.prompt.prompt.toLowerCase().includes(search.toLowerCase()) ||
      item.prompt.category.toLowerCase().includes(search.toLowerCase()) ||
      item.toolName.toLowerCase().includes(search.toLowerCase());
    return matchesTool && matchesSearch;
  });

  const filteredCustom = customPrompts.filter((item) => {
    const matchesTool = selectedTool === 'all' || item.toolName === selectedTool;
    const matchesSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.prompt.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()) ||
      item.toolName.toLowerCase().includes(search.toLowerCase());
    return matchesTool && matchesSearch;
  });

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSaveCustomPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPromptText.trim()) {
      setFormError('يرجى كتابة عنوان الأمر ومحتوى البرومبت.');
      return;
    }
    setFormError(null);
    setIsSubmitting(true);
    try {
      await addCustomPrompt(newTool, newTitle, newCategory, newPromptText);
      setNewTitle('');
      setNewPromptText('');
      setIsAddingNew(false);
    } catch (err) {
      console.error(err);
      setFormError('حدث خطأ أثناء حفظ الأمر في السحابة.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportToGoogleDrive = async () => {
    setIsExportingToDrive(true);
    setDriveExportSuccess(null);
    try {
      const token = await getDriveToken();
      if (!token) return;

      const itemsToExport = activeTab === 'presets'
        ? filteredPresets.map(p => ({
            toolName: p.toolName,
            title: p.prompt.title,
            category: p.prompt.category,
            prompt: p.prompt.prompt,
          }))
        : filteredCustom.map(c => ({
            toolName: c.toolName,
            title: c.title,
            category: c.category,
            prompt: c.prompt,
          }));

      if (itemsToExport.length === 0) {
        setDriveExportSuccess('لا توجد أوامر لتصديرها.');
        setTimeout(() => setDriveExportSuccess(null), 3000);
        return;
      }

      const fileTitle = activeTab === 'presets'
        ? `حزمة أوامر AI Atlas (${selectedTool === 'all' ? 'جميع الأدوات' : selectedTool})`
        : 'أوامري المخصصة AI Atlas';

      const file = await exportPromptsListToDrive(token, itemsToExport, fileTitle);
      setDriveExportSuccess(`تم التصدير بنجاح إلى Google Drive (${file.name})`);
      setTimeout(() => setDriveExportSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setDriveExportSuccess('تعذر التصدير إلى Google Drive. تحقق من الصلاحيات.');
      setTimeout(() => setDriveExportSuccess(null), 4000);
    } finally {
      setIsExportingToDrive(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-indigo-600 text-slate-950 font-bold flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">بنك أوامر الذكاء الاصطناعي (Prompts)</h2>
              <p className="text-xs text-slate-400">
                أوامر احترافية جاهزة مع إمكانية تصديرها إلى Google Drive وحفظها سحابياً
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

        {/* Tab Selection & Drive Export */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-4 pb-2">
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'presets'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              الأوامر المعتمدة ({filteredPresets.length})
            </button>

            <button
              onClick={() => setActiveTab('custom')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'custom'
                  ? 'bg-indigo-600 text-white shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>أوامري المحفوظة ({customPrompts.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Export to Google Drive Button */}
            <button
              onClick={handleExportToGoogleDrive}
              disabled={isExportingToDrive}
              title="تصدير هذه الأوامر إلى Google Drive كملف Markdown/Doc"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-950/40 hover:bg-sky-900/50 border border-sky-500/40 text-sky-300 text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
            >
              {isExportingToDrive ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
              ) : (
                <HardDrive className="w-3.5 h-3.5 text-sky-400" />
              )}
              <span>تصدير إلى Drive</span>
            </button>

            {activeTab === 'custom' && user && !isAddingNew && (
              <button
                onClick={() => setIsAddingNew(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة أمر</span>
              </button>
            )}
          </div>
        </div>

        {/* Drive Toast Notification */}
        {driveExportSuccess && (
          <div className="my-2 p-2.5 rounded-xl bg-sky-950 border border-sky-500/40 text-sky-300 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-sky-400" />
              <span>{driveExportSuccess}</span>
            </span>
            <button onClick={() => setDriveExportSuccess(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="py-3 border-b border-slate-800 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث في الأوامر (مثال: سيو، تصوير سينمائي، React)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pr-9 pl-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <select
            value={selectedTool}
            onChange={(e) => setSelectedTool(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-amber-400"
          >
            <option value="all">جميع الأدوات</option>
            {AI_TOOLS.map((t) => (
              <option key={t.id} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-3 scrollbar-thin">
          {/* Custom Prompt Creation Form */}
          {activeTab === 'custom' && isAddingNew && (
            <form
              onSubmit={handleSaveCustomPrompt}
              className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/40 flex flex-col gap-3 mb-2"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>إنشاء برومبت مخصص وحفظه بحسابك السحابي</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">عنوان الأمر:</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="مثال: تحليل نص قانوني"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">الأداة المستهدفة:</label>
                  <select
                    value={newTool}
                    onChange={(e) => setNewTool(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {AI_TOOLS.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">التصنيف:</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="مثال: بحث وتحليل"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">نص البرومبت:</label>
                <textarea
                  value={newPromptText}
                  onChange={(e) => setNewPromptText(e.target.value)}
                  placeholder="اكتب البرومبت بالتفصيل مع وضع المتغيرات بين أقواس..."
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 font-mono text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {formError && <span className="text-xs text-rose-400">{formError}</span>}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Cloud className="w-3.5 h-3.5" />
                  )}
                  <span>حفظ في Firestore</span>
                </button>
              </div>
            </form>
          )}

          {/* Tab 1: Presets Prompts */}
          {activeTab === 'presets' && (
            <>
              {filteredPresets.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  لم يتم العثور على أوامر تطابق بحثك.
                </div>
              ) : (
                filteredPresets.map((item, idx) => {
                  const key = `preset-${item.toolName}-${idx}`;
                  return (
                    <div
                      key={key}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-300 text-sm">
                            {item.prompt.title}
                          </span>
                          <span className="text-slate-500 font-mono text-[11px]">
                            [{item.toolName}] · {item.prompt.category}
                          </span>
                        </div>

                        <button
                          onClick={() => handleCopy(item.prompt.prompt, key)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                        >
                          {copiedKey === key ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">تم النسخ!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>نسخ البرومبت</span>
                            </>
                          )}
                        </button>
                      </div>

                      <p className="font-mono text-slate-300 bg-slate-900/90 p-3 rounded-xl leading-relaxed text-[11px] select-all">
                        {item.prompt.prompt}
                      </p>
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* Tab 2: Custom User Prompts (Firestore) */}
          {activeTab === 'custom' && (
            <>
              {!user ? (
                <div className="py-12 flex flex-col items-center justify-center text-center gap-3 bg-slate-950/60 rounded-2xl border border-slate-800 p-6">
                  <Cloud className="w-10 h-10 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">
                    سجّل الدخول للوصول إلى بنك أوامرك السحابي
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md">
                    يمكنك كتابة وحفظ أوامر برومبت مخصصة ومزامنتها عبر Firebase وتصديرها إلى Google Drive.
                  </p>
                  <button
                    onClick={() => signIn()}
                    className="mt-2 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>تسجيل الدخول بـ Google</span>
                  </button>
                </div>
              ) : filteredCustom.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800 p-6 flex flex-col items-center gap-2">
                  <Sparkles className="w-6 h-6 text-indigo-400 mb-1" />
                  <p>ليس لديك أي أوامر مخصصة محفوظة حتى الآن.</p>
                  <button
                    onClick={() => setIsAddingNew(true)}
                    className="mt-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold rounded-lg transition-colors"
                  >
                    + أضف أول برومبت لك
                  </button>
                </div>
              ) : (
                filteredCustom.map((cp) => {
                  const key = `custom-${cp.id}`;
                  return (
                    <div
                      key={cp.id}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/40 flex flex-col gap-2.5 text-xs transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-indigo-300 text-sm">
                            {cp.title}
                          </span>
                          <span className="text-slate-500 font-mono text-[11px]">
                            [{cp.toolName}] · {cp.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(cp.prompt, key)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                          >
                            {copiedKey === key ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">تم النسخ!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>نسخ البرومبت</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => deleteCustomPrompt(cp.id)}
                            title="حذف هذا البرومبت من السحابة"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p className="font-mono text-slate-300 bg-slate-900/90 p-3 rounded-xl leading-relaxed text-[11px] select-all">
                        {cp.prompt}
                      </p>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-amber-400" />
              <span>Firebase</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-sky-400" />
              <span>Google Drive Export</span>
            </span>
          </div>

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
