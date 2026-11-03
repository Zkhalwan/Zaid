import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  FileText,
  History,
  RotateCcw,
  Sparkles,
  User as UserIcon,
  Bot,
  Plus,
  Save,
  Check,
  Eye,
  Edit3,
  HardDrive,
  Clock,
  ArrowRight,
  AlertCircle,
  Copy,
  Trash2,
  ChevronLeft,
  Loader2,
  Layers,
  FileCheck,
  SplitSquareVertical,
  Wand2,
  Share2
} from 'lucide-react';
import { AppDocument, DocumentVersion } from '../types';
import { INITIAL_DOCUMENTS } from '../utils/initialDocuments';
import { computeWordDiff, countWords, estimateReadTime, DiffPart } from '../utils/diffHelper';
import { useFirebase } from '../context/FirebaseContext';
import { uploadFileToDrive, getOrCreateAtlasFolder } from '../services/googleDriveService';

interface DocumentStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDocumentId?: string;
}

const STORAGE_KEY = 'ai_tools_atlas_documents_v1';

export const DocumentStudioModal: React.FC<DocumentStudioModalProps> = ({
  isOpen,
  onClose,
  initialDocumentId,
}) => {
  const { user, getDriveToken } = useFirebase();

  // Documents state loaded from LocalStorage or initial
  const [documents, setDocuments] = useState<AppDocument[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not read saved documents from storage:', e);
    }
    return INITIAL_DOCUMENTS;
  });

  const [activeDocId, setActiveDocId] = useState<string>(
    initialDocumentId || documents[0]?.id || 'doc-ai-mastery-guide'
  );

  // Active document object
  const activeDoc = useMemo(() => {
    return documents.find((d) => d.id === activeDocId) || documents[0];
  }, [documents, activeDocId]);

  // Current editing drafts
  const [currentTitle, setCurrentTitle] = useState(activeDoc?.title || '');
  const [currentContent, setCurrentContent] = useState(activeDoc?.content || '');

  // Editor View Mode: 'edit' | 'preview' | 'split'
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');

  // Version History Panel Open State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [historyDiffMode, setHistoryDiffMode] = useState<'diff' | 'preview'>('diff');

  // AI Editor state
  const [aiInstruction, setAiInstruction] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Toast / notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Revert Confirmation Modal state
  const [versionToRevert, setVersionToRevert] = useState<DocumentVersion | null>(null);

  // Sync state whenever activeDoc changes
  useEffect(() => {
    if (activeDoc) {
      setCurrentTitle(activeDoc.title);
      setCurrentContent(activeDoc.content);
      setSelectedVersionId(activeDoc.versions[activeDoc.versions.length - 1]?.id || null);
    }
  }, [activeDocId]);

  // Persist documents whenever modified
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
    } catch (e) {
      console.error('Failed to save documents to storage:', e);
    }
  }, [documents]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const syncVersionToBackend = async (
    docId: string,
    title: string,
    content: string,
    category: string,
    versionNumber: number,
    summary: string,
    author: string,
    changeType: string
  ) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      fetch('/api/user/documents/version', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: docId,
          title,
          content,
          category,
          versionNumber,
          summary,
          author,
          changeType,
        }),
      }).catch((e) => console.warn('Cloud SQL version sync note:', e));
    } catch (e) {
      console.warn('Failed to get token for version sync:', e);
    }
  };

  if (!isOpen || !activeDoc) return null;

  // Selected version object for history inspection
  const selectedVersion = useMemo(() => {
    if (!activeDoc || !selectedVersionId) {
      return activeDoc?.versions[activeDoc.versions.length - 1] || null;
    }
    return activeDoc.versions.find((v) => v.id === selectedVersionId) || null;
  }, [activeDoc, selectedVersionId]);

  // Previous version to compare against (or compare with current)
  const previousVersionForDiff = useMemo(() => {
    if (!activeDoc || !selectedVersion) return null;
    const index = activeDoc.versions.findIndex((v) => v.id === selectedVersion.id);
    if (index > 0) {
      return activeDoc.versions[index - 1];
    }
    return null;
  }, [activeDoc, selectedVersion]);

  // Computed word diff between previous version and selected version
  const diffParts: DiffPart[] = useMemo(() => {
    if (!selectedVersion) return [];
    const baseContent = previousVersionForDiff ? previousVersionForDiff.content : '';
    return computeWordDiff(baseContent, selectedVersion.content);
  }, [selectedVersion, previousVersionForDiff]);

  // Word counts
  const currentWordCount = countWords(currentContent);
  const readTimeStr = estimateReadTime(currentWordCount);

  // Check if current text differs from latest recorded version
  const latestRecordedVersion = activeDoc.versions[activeDoc.versions.length - 1];
  const hasUnsavedChanges =
    currentContent !== latestRecordedVersion?.content ||
    currentTitle !== latestRecordedVersion?.title;

  // Save manual edit as a new version
  const handleSaveManualVersion = (customDesc?: string) => {
    if (!hasUnsavedChanges && !customDesc) {
      showToast('المحتوى الحالي محفوظ مسبقاً في سجل الإصدارات.');
      return;
    }

    const nextVerNumber = (latestRecordedVersion?.versionNumber || 0) + 1;
    const newVersion: DocumentVersion = {
      id: `ver-${Date.now()}`,
      versionNumber: nextVerNumber,
      timestamp: new Date().toISOString(),
      author: 'user',
      authorName: user?.displayName || 'المستخدم',
      changeDescription: customDesc || 'تعديل وحفظ يدوي من المستخدم',
      title: currentTitle.trim() || 'مستند بدون عنوان',
      content: currentContent,
      wordCount: currentWordCount,
    };

    const updatedDocuments = documents.map((doc) => {
      if (doc.id === activeDoc.id) {
        return {
          ...doc,
          title: newVersion.title,
          content: newVersion.content,
          updatedAt: new Date().toISOString(),
          versions: [...doc.versions, newVersion],
        };
      }
      return doc;
    });

    setDocuments(updatedDocuments);
    setSelectedVersionId(newVersion.id);
    syncVersionToBackend(
      activeDoc.id,
      newVersion.title,
      newVersion.content,
      activeDoc.category || 'general',
      nextVerNumber,
      newVersion.changeDescription,
      newVersion.author,
      'manual_save'
    );
    showToast(`تم حفظ الإصدار ${nextVerNumber} بنجاح في سجل الإصدارات!`);
  };

  // Revert to any selected version
  const handleExecuteRevert = () => {
    if (!versionToRevert) return;

    const nextVerNumber = (latestRecordedVersion?.versionNumber || 0) + 1;
    const revertVersion: DocumentVersion = {
      id: `ver-revert-${Date.now()}`,
      versionNumber: nextVerNumber,
      timestamp: new Date().toISOString(),
      author: 'user',
      authorName: user?.displayName || 'المستخدم',
      changeDescription: `استعادة الإصدار ${versionToRevert.versionNumber}: (${versionToRevert.changeDescription})`,
      title: versionToRevert.title,
      content: versionToRevert.content,
      wordCount: versionToRevert.wordCount,
    };

    setCurrentTitle(versionToRevert.title);
    setCurrentContent(versionToRevert.content);

    const updatedDocuments = documents.map((doc) => {
      if (doc.id === activeDoc.id) {
        return {
          ...doc,
          title: revertVersion.title,
          content: revertVersion.content,
          updatedAt: new Date().toISOString(),
          versions: [...doc.versions, revertVersion],
        };
      }
      return doc;
    });

    setDocuments(updatedDocuments);
    setSelectedVersionId(revertVersion.id);
    setVersionToRevert(null);
    syncVersionToBackend(
      activeDoc.id,
      revertVersion.title,
      revertVersion.content,
      activeDoc.category || 'general',
      nextVerNumber,
      revertVersion.changeDescription,
      revertVersion.author,
      'revert'
    );
    showToast(`تمت استعادة الإصدار ${versionToRevert.versionNumber} بنجاح!`);
  };

  // AI Document Edit Request
  const handleAiEdit = async (actionType: string, specificInstruction?: string) => {
    const instruction = specificInstruction || aiInstruction.trim();
    if (!instruction) {
      setAiError('يرجى تحديد تعليمات التعديل للذكاء الاصطناعي.');
      return;
    }

    setIsAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai/edit-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentTitle,
          content: currentContent,
          instruction,
          actionType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل التعديل بالذكاء الاصطناعي');
      }

      const updatedText = data.updatedContent || currentContent;
      const changeSummary = data.changeSummary || 'تعديل وتحسين الصياغة بالذكاء الاصطناعي';

      // Update current draft
      setCurrentContent(updatedText);

      // Log AI Edit into Version History
      const nextVerNumber = (latestRecordedVersion?.versionNumber || 0) + 1;
      const aiVersion: DocumentVersion = {
        id: `ver-ai-${Date.now()}`,
        versionNumber: nextVerNumber,
        timestamp: new Date().toISOString(),
        author: 'ai',
        authorName: 'الذكاء الاصطناعي (Gemini)',
        changeDescription: changeSummary,
        title: currentTitle,
        content: updatedText,
        wordCount: countWords(updatedText),
      };

      const updatedDocuments = documents.map((doc) => {
        if (doc.id === activeDoc.id) {
          return {
            ...doc,
            content: updatedText,
            updatedAt: new Date().toISOString(),
            versions: [...doc.versions, aiVersion],
          };
        }
        return doc;
      });

      setDocuments(updatedDocuments);
      setSelectedVersionId(aiVersion.id);
      syncVersionToBackend(
        activeDoc.id,
        aiVersion.title,
        aiVersion.content,
        activeDoc.category || 'general',
        nextVerNumber,
        aiVersion.changeDescription,
        aiVersion.author,
        'ai_edit'
      );
      setAiInstruction('');
      showToast(`تم تطبيق تعديل الذكاء الاصطناعي وتوثيقه كـ الإصدار ${nextVerNumber}!`);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'حدث خطأ أثناء معالجة الطلب عبر الذكاء الاصطناعي');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Create brand new blank document
  const handleCreateNewDocument = () => {
    const newDocId = `doc-${Date.now()}`;
    const newDoc: AppDocument = {
      id: newDocId,
      title: 'مستند أوامر ذكي جديد',
      content: `# مستند جديد

اكتب ملاحظاتك، شروحات الأدوات، أو قوالب البرومبت هنا...`,
      category: 'مسودات وملاحظات',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      versions: [
        {
          id: `ver-${Date.now()}`,
          versionNumber: 1,
          timestamp: new Date().toISOString(),
          author: 'user',
          authorName: user?.displayName || 'المستخدم',
          changeDescription: 'إنشاء المستند الأولي',
          title: 'مستند أوامر ذكي جديد',
          content: `# مستند جديد

اكتب ملاحظاتك، شروحات الأدوات، أو قوالب البرومبت هنا...`,
          wordCount: 12,
        },
      ],
    };

    setDocuments([newDoc, ...documents]);
    setActiveDocId(newDocId);
    showToast('تم إنشاء مستند جديد بنجاح.');
  };

  // Export Document to Google Drive
  const handleExportToDrive = async () => {
    try {
      const token = await getDriveToken();
      if (!token) return;

      const folderId = await getOrCreateAtlasFolder(token);
      const fileName = `${currentTitle.trim() || 'مستند AI'}.md`;
      await uploadFileToDrive(token, fileName, currentContent, 'text/markdown', folderId);
      showToast(`تم تصدير المستند "${fileName}" إلى Google Drive بنجاح!`);
    } catch (err: any) {
      console.error(err);
      showToast('تعذر التصدير إلى Google Drive. يرجى التحقق من الصلاحيات.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-slate-200 flex flex-col h-[94vh] overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 text-slate-950 flex items-center justify-center shadow-md">
              <FileText className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">محرر المستندات وسجل الإصدارات الذكي</h2>
                <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Version History & AI Logs
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                توثيق كامل لكافة التعديلات (المستخدم + AI) مع إمكانية التراجع لأي إصدار سابق ومقارنة الفروقات
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Version History Toggle Button */}
            <button
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isHistoryOpen
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md'
                  : 'bg-slate-950 border-slate-800 text-amber-300 hover:border-amber-500/40'
              }`}
            >
              <History className="w-4 h-4" />
              <span>سجل الإصدارات</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-800/80 text-amber-300 border border-amber-500/30">
                {activeDoc.versions.length}
              </span>
            </button>

            {/* Google Drive Export */}
            <button
              onClick={handleExportToDrive}
              title="تصدير المستند الحالي إلى Google Drive"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-sky-950/30 border border-sky-500/40 text-sky-300 hover:bg-sky-900/40 text-xs font-semibold rounded-xl transition-all"
            >
              <HardDrive className="w-3.5 h-3.5 text-sky-400" />
              <span>تصدير إلى Drive</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-2 text-xs text-amber-300 flex items-center justify-between animate-in fade-in">
            <span className="flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{toastMessage}</span>
            </span>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Studio Body: Sidebar + Main Workspace + Version History Drawer */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left / Secondary Sidebar: Documents Switcher */}
          <div className="w-56 sm:w-64 border-l border-slate-800 bg-slate-950/70 p-3 flex flex-col gap-3 shrink-0 hidden md:flex">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <span className="text-xs font-bold text-slate-300">مستنداتك ({documents.length})</span>
              <button
                onClick={handleCreateNewDocument}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white transition-colors"
                title="إنشاء مستند جديد"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin">
              {documents.map((doc) => {
                const isActive = doc.id === activeDoc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setActiveDocId(doc.id)}
                    className={`p-2.5 rounded-xl text-xs cursor-pointer transition-all border ${
                      isActive
                        ? 'bg-slate-900 border-amber-500/50 text-white shadow-sm'
                        : 'bg-slate-950 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="font-semibold truncate">{doc.title}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-mono">
                      <span>{doc.versions.length} إصدارات</span>
                      <span>
                        {new Date(doc.updatedAt).toLocaleDateString('ar-EG', {
                          month: 'numeric',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 flex flex-col gap-1">
              <span className="font-semibold text-white flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>ميزة سجل الإصدارات</span>
              </span>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                كل تعديل تقوم به أو يجريه الذكاء الاصطناعي يتم حفظه بنسخة مستقلة مع إمكانية التراجع الفوري ومقارنة الكلمات المضافة والمحذوفة.
              </p>
            </div>
          </div>

          {/* Central Workspace: Editor */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/50">
            {/* Document Header Controls */}
            <div className="p-3 sm:px-6 sm:py-3 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80">
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={currentTitle}
                  onChange={(e) => setCurrentTitle(e.target.value)}
                  placeholder="عنوان المستند..."
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-400 rounded-xl px-3 py-1.5 text-sm font-bold text-white focus:outline-none"
                />
              </div>

              {/* View mode & Save actions */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setViewMode('edit')}
                    className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                      viewMode === 'edit'
                        ? 'bg-slate-800 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>محرر</span>
                  </button>

                  <button
                    onClick={() => setViewMode('preview')}
                    className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                      viewMode === 'preview'
                        ? 'bg-slate-800 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>معاينة</span>
                  </button>

                  <button
                    onClick={() => setViewMode('split')}
                    className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 hidden sm:flex ${
                      viewMode === 'split'
                        ? 'bg-slate-800 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <SplitSquareVertical className="w-3 h-3" />
                    <span>منقسم</span>
                  </button>
                </div>

                {/* Save New Version Button */}
                <button
                  onClick={() => handleSaveManualVersion()}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    hasUnsavedChanges
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20 animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{hasUnsavedChanges ? 'حفظ كإصدار جديد' : 'محفوظ'}</span>
                </button>
              </div>
            </div>

            {/* AI Assistant Quick Tool Bar */}
            <div className="px-4 sm:px-6 py-2.5 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
                <span className="text-amber-400 font-bold flex items-center gap-1 shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>مساعد التحرير AI:</span>
                </span>

                <button
                  onClick={() => handleAiEdit('improve', 'تحسين الأسلوب والصياغة اللغوية والتنسيق')}
                  disabled={isAiLoading}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-400/40 text-slate-300 hover:text-white transition-colors shrink-0 flex items-center gap-1"
                >
                  <Wand2 className="w-3 h-3 text-amber-400" />
                  <span>تحسين الصياغة</span>
                </button>

                <button
                  onClick={() => handleAiEdit('prompts', 'إضافة 3 أوامر برومبت احترافية وعملية لهذا الموضوع')}
                  disabled={isAiLoading}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-400/40 text-slate-300 hover:text-white transition-colors shrink-0 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>إضافة أوامر برومبت</span>
                </button>

                <button
                  onClick={() => handleAiEdit('summarize', 'تلخيص المستند في نقاط رئيسية مركزة')}
                  disabled={isAiLoading}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-sky-400/40 text-slate-300 hover:text-white transition-colors shrink-0"
                >
                  <span>تلخيص في نقاط</span>
                </button>

                <button
                  onClick={() => handleAiEdit('format', 'تدقيق إملائي وتنسيق كامل بصيغة Markdown الاحترافية')}
                  disabled={isAiLoading}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-400/40 text-slate-300 hover:text-white transition-colors shrink-0"
                >
                  <span>تدقيق وتنسيق Markdown</span>
                </button>
              </div>

              {/* Custom AI Instruction Bar */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={aiInstruction}
                  onChange={(e) => setAiInstruction(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiEdit('custom')}
                  placeholder="أو اكتب طلباً خاصاً لـ AI..."
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 w-full sm:w-48"
                />
                <button
                  onClick={() => handleAiEdit('custom')}
                  disabled={isAiLoading || !aiInstruction.trim()}
                  className="p-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors disabled:opacity-40"
                  title="تنفيذ بواسطة الذكاء الاصطناعي"
                >
                  {isAiLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Bot className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {aiError && (
              <div className="px-6 py-1.5 bg-rose-950/40 text-rose-300 border-b border-rose-500/30 text-xs flex items-center justify-between">
                <span>{aiError}</span>
                <button onClick={() => setAiError(null)}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Main Content Area: Editor & Preview */}
            <div className="flex-1 overflow-hidden flex">
              {(viewMode === 'edit' || viewMode === 'split') && (
                <div className={`h-full flex flex-col ${viewMode === 'split' ? 'w-1/2 border-l border-slate-800' : 'w-full'}`}>
                  <textarea
                    value={currentContent}
                    onChange={(e) => setCurrentContent(e.target.value)}
                    placeholder="اكتب أو الصق نص المستند بصيغة Markdown..."
                    className="flex-1 w-full bg-slate-950/40 p-4 sm:p-6 font-mono text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              )}

              {(viewMode === 'preview' || viewMode === 'split') && (
                <div className={`h-full overflow-y-auto p-4 sm:p-6 bg-slate-950/80 ${viewMode === 'split' ? 'w-1/2' : 'w-full'} prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed scrollbar-thin`}>
                  <div className="space-y-4">
                    <h1 className="text-xl sm:text-2xl font-extrabold text-white pb-2 border-b border-slate-800">
                      {currentTitle}
                    </h1>
                    <div className="whitespace-pre-wrap font-sans text-slate-300 leading-relaxed">
                      {currentContent}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Status Footer Bar */}
            <div className="px-4 sm:px-6 py-2 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <div className="flex items-center gap-4">
                <span>الكلمات: <strong className="text-slate-300">{currentWordCount}</strong></span>
                <span>وقت القراءة: <strong className="text-slate-300">{readTimeStr}</strong></span>
                <span>الحالة: {hasUnsavedChanges ? <span className="text-amber-400">تعديلات غير محفوظة</span> : <span className="text-emerald-400">محفوظ</span>}</span>
              </div>

              <div className="flex items-center gap-2">
                <span>الإصدار الأحدث: v{latestRecordedVersion?.versionNumber || 1}</span>
              </div>
            </div>
          </div>

          {/* Right Sliding Drawer: VERSION HISTORY LOG & REVERT */}
          {isHistoryOpen && (
            <div className="w-80 sm:w-96 border-r border-slate-800 bg-slate-950 flex flex-col shrink-0 shadow-2xl z-10 animate-in slide-in-from-right duration-200">
              {/* History Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold text-white">سجل الإصدارات والتراجع</h3>
                </div>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Version History List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
                <div className="text-[10px] text-slate-400 px-1 font-mono uppercase tracking-wider">
                  سجل التعديلات الزمني ({activeDoc.versions.length} نسخ)
                </div>

                {/* Display versions in reverse chronological order (newest first) */}
                {[...activeDoc.versions].reverse().map((ver, idx) => {
                  const isSelected = selectedVersion?.id === ver.id;
                  const isCurrentActive = ver.id === latestRecordedVersion?.id;
                  const isAi = ver.author === 'ai';

                  return (
                    <div
                      key={ver.id}
                      onClick={() => setSelectedVersionId(ver.id)}
                      className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex flex-col gap-2 ${
                        isSelected
                          ? 'bg-slate-900 border-amber-400/80 shadow-md ring-1 ring-amber-400/30'
                          : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-xs">
                            الإصدار {ver.versionNumber}
                          </span>
                          {isCurrentActive && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              الحالي
                            </span>
                          )}
                        </div>

                        {/* Author Badge */}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 border ${
                            isAi
                              ? 'bg-purple-950/40 border-purple-500/40 text-purple-300'
                              : 'bg-sky-950/40 border-sky-500/40 text-sky-300'
                          }`}
                        >
                          {isAi ? (
                            <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                          ) : (
                            <UserIcon className="w-2.5 h-2.5 text-sky-400" />
                          )}
                          <span>{ver.authorName}</span>
                        </span>
                      </div>

                      {/* Change Description */}
                      <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800/60">
                        {ver.changeDescription}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(ver.timestamp).toLocaleTimeString('ar-EG', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            ·{' '}
                            {new Date(ver.timestamp).toLocaleDateString('ar-EG', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </span>

                        <span>{ver.wordCount} كلمة</span>
                      </div>

                      {/* Revert Button on each card */}
                      {!isCurrentActive && (
                        <div className="pt-1 flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setVersionToRevert(ver);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-bold rounded-lg transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>استعادة هذه النسخة</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Version Inspector / Diff Preview Section */}
              {selectedVersion && (
                <div className="p-3 border-t border-slate-800 bg-slate-900/90 flex flex-col gap-2.5 max-h-64 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white flex items-center gap-1">
                      <span>معاينة إصدار {selectedVersion.versionNumber}:</span>
                    </span>

                    <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                      <button
                        onClick={() => setHistoryDiffMode('diff')}
                        className={`px-2 py-0.5 rounded transition-colors ${
                          historyDiffMode === 'diff'
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        الفروقات (Diff)
                      </button>
                      <button
                        onClick={() => setHistoryDiffMode('preview')}
                        className={`px-2 py-0.5 rounded transition-colors ${
                          historyDiffMode === 'preview'
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        النص
                      </button>
                    </div>
                  </div>

                  {/* Diff Viewer Body */}
                  <div className="flex-1 overflow-y-auto p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono leading-relaxed max-h-36 scrollbar-thin">
                    {historyDiffMode === 'diff' ? (
                      diffParts.length === 0 ? (
                        <span className="text-slate-500">لا توجد فروقات عن النسخة السابقة.</span>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-[10px] text-slate-500 mb-1 border-b border-slate-800 pb-1">
                            {previousVersionForDiff
                              ? `مقارنة الإصدار ${selectedVersion.versionNumber} مع الإصدار ${previousVersionForDiff.versionNumber}:`
                              : 'الإصدار الأول (كافة الكلمات مضافة):'}
                          </div>
                          <div className="whitespace-pre-wrap">
                            {diffParts.map((part, index) => {
                              if (part.added) {
                                return (
                                  <span
                                    key={index}
                                    className="bg-emerald-950/80 text-emerald-300 font-semibold px-0.5 rounded border border-emerald-500/30"
                                  >
                                    {part.value}
                                  </span>
                                );
                              }
                              if (part.removed) {
                                return (
                                  <span
                                    key={index}
                                    className="bg-rose-950/80 text-rose-300 line-through px-0.5 rounded border border-rose-500/30 opacity-70"
                                  >
                                    {part.value}
                                  </span>
                                );
                              }
                              return <span key={index} className="text-slate-400">{part.value}</span>;
                            })}
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="whitespace-pre-wrap text-slate-300">
                        {selectedVersion.content}
                      </div>
                    )}
                  </div>

                  {/* Primary Revert Action for selected version */}
                  <button
                    onClick={() => setVersionToRevert(selectedVersion)}
                    className="w-full py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>استعادة الإصدار {selectedVersion.versionNumber} الآن</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Reverting Version */}
      {versionToRevert && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/50 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-right">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">تأكيد استعادة الإصدار السابق</h3>
                <span className="text-xs text-slate-400">العودة إلى الإصدار {versionToRevert.versionNumber}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
              هل أنت متأكد من رغبتك في استعادة الإصدار رقم <strong className="text-amber-400">{versionToRevert.versionNumber}</strong>؟
              <br />
              <span className="text-slate-400 mt-1 block">
                ملاحظة: سيتم حفظ محتوى هذه النسخة كإصدار جديد ولن تفقد أي نسخة من تاريخ تعديلاتك السابقة.
              </span>
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setVersionToRevert(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleExecuteRevert}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 shadow-md transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>تأكيد الاستعادة</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
