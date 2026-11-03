import React, { useState } from 'react';
import { Sparkles, Compass, Video, BookOpen, Layers, Smartphone, Heart, LogIn, LogOut, User as UserIcon, Loader2, HardDrive, History, FileText } from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';

interface HeaderProps {
  onOpenAdvisor: () => void;
  onOpenPrompts: () => void;
  onOpenGooglePlay: () => void;
  onOpenGoogleDrive: () => void;
  onOpenDocumentStudio: () => void;
  onScrollToSection: (sectionId: string) => void;
  onToggleFavoritesFilter?: () => void;
  isShowingFavoritesOnly?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAdvisor,
  onOpenPrompts,
  onOpenGooglePlay,
  onOpenGoogleDrive,
  onOpenDocumentStudio,
  onScrollToSection,
  onToggleFavoritesFilter,
  isShowingFavoritesOnly,
}) => {
  const { user, authLoading, signIn, signOut, favorites } = useFirebase();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signIn();
    } catch (err) {
      console.error('Sign in error:', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <header className="flex items-center justify-between gap-4 md:gap-8 px-4 sm:px-6 py-3.5 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Brand mark */}
      <a 
        href="#" 
        onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        className="flex items-center gap-3 text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-500 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/10">
          <Compass className="w-5 h-5 text-slate-950" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm sm:text-base font-bold text-white leading-tight">موسوعة الذكاء الاصطناعي</span>
          <span className="text-[10px] sm:text-[11px] text-slate-400 font-normal">AI Tools Atlas & Video Guides</span>
        </div>
      </a>

      {/* Zone 2: Navigation links */}
      <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-300">
        <button
          onClick={() => onScrollToSection('catalog')}
          className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <Layers className="w-4 h-4 text-slate-400" />
          <span>دليل الأدوات</span>
        </button>

        <button
          onClick={onOpenDocumentStudio}
          className="text-amber-300 hover:text-amber-200 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 font-semibold"
        >
          <History className="w-4 h-4 text-amber-400" />
          <span>المستندات وسجل الإصدارات</span>
        </button>

        <button
          onClick={() => onScrollToSection('featured-videos')}
          className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <Video className="w-4 h-4 text-slate-400" />
          <span>فيديوهات الشرح</span>
        </button>

        <button
          onClick={onOpenPrompts}
          className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <BookOpen className="w-4 h-4 text-slate-400" />
          <span>بنك الأوامر (Prompts)</span>
        </button>

        <button
          onClick={onOpenGoogleDrive}
          className="text-sky-400 hover:text-sky-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <HardDrive className="w-4 h-4" />
          <span>Google Drive</span>
        </button>

        <button
          onClick={onOpenGooglePlay}
          className="text-emerald-400 hover:text-emerald-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <Smartphone className="w-4 h-4" />
          <span>نشر وتنزيل Google Play</span>
        </button>
      </nav>

      {/* Zone 3: Actions & Auth */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Document Studio & Version History Trigger */}
        <button
          onClick={onOpenDocumentStudio}
          title="محرر المستندات وسجل الإصدارات والتراجع"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-all shadow-sm"
        >
          <History className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">سجل الإصدارات</span>
        </button>

        {/* Google Drive Shortcut */}
        <button
          onClick={onOpenGoogleDrive}
          title="افتح مساحة Google Drive السحابية"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-sky-500/30 bg-sky-950/20 text-sky-300 hover:bg-sky-900/30 transition-all"
        >
          <HardDrive className="w-3.5 h-3.5 text-sky-400" />
          <span>Drive</span>
        </button>

        {/* Favorites quick toggle button */}
        {onToggleFavoritesFilter && (
          <button
            onClick={onToggleFavoritesFilter}
            title={user ? 'عرض أدواتك المفضلة' : 'سجل الدخول لحفظ واستعراض المفضلة'}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              isShowingFavoritesOnly
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-sm'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-rose-400 hover:border-rose-500/40'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isShowingFavoritesOnly || favorites.length > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span className="hidden sm:inline">المفضلة</span>
            {favorites.length > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-500/30 text-rose-300 rounded-full text-[10px] font-mono font-bold">
                {favorites.length}
              </span>
            )}
          </button>
        )}

        <button
          onClick={onOpenAdvisor}
          className="hidden md:flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow-md shadow-amber-500/20 transition-all whitespace-nowrap shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>المستشار الذكي</span>
        </button>

        {/* Firebase Auth Pill */}
        {authLoading ? (
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center animate-pulse">
            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
          </div>
        ) : user ? (
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-lg object-cover border border-amber-400/30"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center">
                {user.displayName?.charAt(0) || <UserIcon className="w-3.5 h-3.5" />}
              </div>
            )}
            <span className="text-xs text-slate-200 font-medium max-w-[90px] sm:max-w-[120px] truncate hidden xs:inline">
              {user.displayName?.split(' ')[0] || 'حسابي'}
            </span>
            <button
              onClick={() => signOut()}
              title="تسجيل الخروج"
              className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-amber-400/40 rounded-lg shadow-sm transition-all whitespace-nowrap"
          >
            {isSigningIn ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
            ) : (
              <LogIn className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>تسجيل الدخول</span>
          </button>
        )}
      </div>
    </header>
  );
};
