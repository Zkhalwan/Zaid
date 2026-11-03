import React, { useState, useEffect } from 'react';
import {
  X,
  HardDrive,
  FileText,
  Search,
  ExternalLink,
  Trash2,
  RefreshCw,
  Plus,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Folder,
  FileCode,
  Image as ImageIcon,
  Video,
  Download,
  Loader2,
  LogIn,
  History
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import {
  DriveFileItem,
  listDriveFiles,
  uploadFileToDrive,
  deleteDriveFile,
  exportPromptsListToDrive,
  getOrCreateAtlasFolder
} from '../services/googleDriveService';
import { AI_TOOLS } from '../data/toolsData';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDocumentStudio?: () => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  onOpenDocumentStudio,
}) => {
  const { user, getDriveToken, customPrompts } = useFirebase();

  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Note Modal state
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Deletion Confirmation Modal state (MANDATORY per skill guidelines)
  const [fileToDelete, setFileToDelete] = useState<DriveFileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch files when modal opens and token is available
  const loadFiles = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const token = await getDriveToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      const fetchedFiles = await listDriveFiles(token, searchQuery);
      setFiles(fetchedFiles);
    } catch (err: any) {
      console.error('Error loading Google Drive files:', err);
      setStatusMessage({
        type: 'error',
        text: 'تعذر تحميل ملفات Google Drive. يرجى التحقق من تسجيل الدخول ومنح الأذونات.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadFiles();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Quick Export of all Custom Prompts to Google Drive
  const handleExportAllPrompts = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const token = await getDriveToken();
      if (!token) return;

      // Collect prompts to export
      const promptsToExport = customPrompts.length > 0 
        ? customPrompts 
        : AI_TOOLS.slice(0, 5).flatMap(t => t.samplePrompts.map(p => ({
            toolName: t.name,
            title: p.title,
            category: p.category,
            prompt: p.prompt
          })));

      const createdFile = await exportPromptsListToDrive(token, promptsToExport);
      setStatusMessage({
        type: 'success',
        text: `تم تصدير ملف "${createdFile.name}" بنجاح إلى مجلد AI Tools Atlas في Google Drive!`,
      });
      // Refresh list
      await loadFiles();
    } catch (err: any) {
      console.error('Export error:', err);
      setStatusMessage({
        type: 'error',
        text: `فشل التصدير إلى Google Drive: ${err.message || 'خطأ غير معروف'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Create New Custom Document/Note in Drive
  const handleSaveNewNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;

    setIsSavingNote(true);
    try {
      const token = await getDriveToken();
      if (!token) return;

      const folderId = await getOrCreateAtlasFolder(token);
      const fileName = `${newNoteTitle.trim()}.md`;
      await uploadFileToDrive(token, fileName, newNoteContent, 'text/markdown', folderId);

      setStatusMessage({
        type: 'success',
        text: `تم حفظ المستند "${fileName}" في Google Drive بنجاح!`,
      });
      setIsCreatingNote(false);
      setNewNoteTitle('');
      setNewNoteContent('');
      await loadFiles();
    } catch (err: any) {
      console.error('Save error:', err);
      setStatusMessage({
        type: 'error',
        text: `فشل حفظ الملف: ${err.message || 'خطأ غير متوقع'}`,
      });
    } finally {
      setIsSavingNote(false);
    }
  };

  // Execute Safe File Deletion after Confirmation
  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;

    setIsDeleting(true);
    try {
      const token = await getDriveToken();
      if (!token) return;

      await deleteDriveFile(token, fileToDelete.id);
      setStatusMessage({
        type: 'success',
        text: `تم حذف الملف "${fileToDelete.name}" من Google Drive بنجاح.`,
      });
      setFileToDelete(null);
      await loadFiles();
    } catch (err: any) {
      console.error('Delete error:', err);
      setStatusMessage({
        type: 'error',
        text: `تعذر حذف الملف: ${err.message || 'خطأ في الصلاحيات'}`,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Icon selector based on file mime type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('folder')) return <Folder className="w-5 h-5 text-amber-400" />;
    if (mimeType.includes('image')) return <ImageIcon className="w-5 h-5 text-indigo-400" />;
    if (mimeType.includes('video')) return <Video className="w-5 h-5 text-rose-400" />;
    if (mimeType.includes('json') || mimeType.includes('javascript') || mimeType.includes('code'))
      return <FileCode className="w-5 h-5 text-emerald-400" />;
    return <FileText className="w-5 h-5 text-sky-400" />;
  };

  // Formatter for byte sizes
  const formatFileSize = (bytes?: string) => {
    if (!bytes) return '';
    const num = parseInt(bytes, 10);
    if (isNaN(num)) return '';
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-emerald-400 to-sky-500 text-slate-950 font-bold flex items-center justify-center shadow-lg">
              <HardDrive className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">مساحة عمل Google Drive السحابية</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Google Workspace
                </span>
              </div>
              <p className="text-xs text-slate-400">
                تصفح وتصدير وحفظ أوامر ومذكرات الذكاء الاصطناعي مباشرة إلى Google Drive
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

        {/* Status Notification Message */}
        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-center justify-between gap-2 border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-white text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Unauthenticated View */}
        {!user ? (
          <div className="flex-1 py-16 flex flex-col items-center justify-center text-center gap-3 bg-slate-950/60 rounded-2xl border border-slate-800 p-6 my-4">
            <HardDrive className="w-12 h-12 text-sky-400" />
            <h3 className="text-base font-bold text-white">
              اربط حساب Google Drive الخاص بك
            </h3>
            <p className="text-xs text-slate-400 max-w-md">
              يتيح لك ربط Google Drive استعراض ملفاتك، تصدير أوامر البرومبت الخاصة بك بنقرة واحدة، وتخزين ملخصات أدوات الذكاء الاصطناعي في مجلد آمن.
            </p>
            <button
              onClick={async () => {
                await getDriveToken();
                await loadFiles();
              }}
              className="mt-3 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول وربط Google Drive</span>
            </button>
          </div>
        ) : (
          <>
            {/* Action Bar */}
            <div className="py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-800">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleExportAllPrompts}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير بنك الأوامر إلى Drive</span>
                </button>

                <button
                  onClick={() => setIsCreatingNote(!isCreatingNote)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-sky-400" />
                  <span>إنشاء مستند ملاحظات جديد</span>
                </button>

                <button
                  onClick={loadFiles}
                  disabled={isLoading}
                  title="تحديث ملفات Drive"
                  className="p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
                </button>

                {onOpenDocumentStudio && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenDocumentStudio();
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold rounded-xl border border-amber-500/30 transition-colors"
                  >
                    <History className="w-3.5 h-3.5 text-amber-400" />
                    <span>محرر وسجل الإصدارات</span>
                  </button>
                )}
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadFiles()}
                  placeholder="ابحث في Google Drive..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pr-9 pl-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-400"
                />
              </div>
            </div>

            {/* Create Note Inline Form */}
            {isCreatingNote && (
              <form
                onSubmit={handleSaveNewNote}
                className="my-3 p-4 rounded-2xl bg-slate-950 border border-sky-500/40 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-sky-400" />
                    <span>إنشاء مستند جديد وحفظه في مجلد AI Tools Atlas</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCreatingNote(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    إلغاء
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">اسم المستند:</label>
                  <input
                    type="text"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder="مثال: ملخص أفضل أوامر توليد الفيديو في Runway"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">المحتوى (Markdown / Text):</label>
                  <textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="اكتب ملاحظاتك، شروحاتك، أو قوالب البرومبت الخاصة بك..."
                    rows={4}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 font-mono text-xs text-white focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreatingNote(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingNote || !newNoteTitle.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                  >
                    {isSavingNote ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Cloud className="w-3.5 h-3.5" />
                    )}
                    <span>حفظ في Google Drive</span>
                  </button>
                </div>
              </form>
            )}

            {/* Files List Display */}
            <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-2.5 scrollbar-thin">
              {isLoading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
                  <span>جاري مزامنة وقراءة ملفات Google Drive...</span>
                </div>
              ) : files.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800/80 p-6 flex flex-col items-center gap-2">
                  <Folder className="w-8 h-8 text-slate-600 mb-1" />
                  <p>لم يتم العثور على ملفات تطابق بحثك في Google Drive.</p>
                  <button
                    onClick={handleExportAllPrompts}
                    className="mt-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-lg transition-colors"
                  >
                    + تصدير حزمة أوامر أولى إلى Drive الآن
                  </button>
                </div>
              ) : (
                files.map((file) => (
                  <div
                    key={file.id}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 text-xs transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                        {getFileIcon(file.mimeType)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-white truncate group-hover:text-sky-300 transition-colors">
                          {file.name}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                          {file.size && <span>{formatFileSize(file.size)}</span>}
                          {file.size && <span>·</span>}
                          {file.modifiedTime && (
                            <span>
                              {new Date(file.modifiedTime).toLocaleDateString('ar-EG', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-400 hover:text-sky-300 border border-slate-800 transition-colors"
                        >
                          <span>فتح في Drive</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}

                      {/* Delete Trigger - Opens Confirmation Modal */}
                      <button
                        onClick={() => setFileToDelete(file)}
                        title="حذف الملف من Google Drive"
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>متصل بـ Google Drive API v3 · مع تشفير وأمان كامل</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>

      {/* MANDATORY User Confirmation Modal for Destructive Deletion */}
      {fileToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/50 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-right">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">تأكيد حذف الملف من Google Drive</h3>
                <span className="text-xs text-slate-400">عملية غير قابلة للتراجع</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
              هل أنت متأكد من رغبتك في حذف الملف التالي نهائياً من حساب Google Drive الخاص بك؟
              <br />
              <strong className="text-amber-300 block mt-1.5 font-mono truncate">
                "{fileToDelete.name}"
              </strong>
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md transition-all disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>تأكيد الحذف نهائياً</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
