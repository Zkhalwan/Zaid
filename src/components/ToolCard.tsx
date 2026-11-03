import React from 'react';
import { Play, ExternalLink, Star, ChevronLeft, BookOpen, Heart, MessageSquare } from 'lucide-react';
import { AiTool } from '../data/toolsData';
import { useFirebase } from '../context/FirebaseContext';

interface ToolCardProps {
  tool: AiTool;
  onSelect: (tool: AiTool) => void;
  onOpenPromptsForTool: (tool: AiTool) => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  onSelect,
  onOpenPromptsForTool,
}) => {
  const { isFavorite, toggleFavorite, getToolReviews } = useFirebase();
  const favorited = isFavorite(tool.id);
  const toolReviews = getToolReviews(tool.id);

  // Calculate dynamic review average if community reviews exist
  const averageRating =
    toolReviews.length > 0
      ? (
          (tool.rating * 2 +
            toolReviews.reduce((acc, r) => acc + r.rating, 0)) /
          (2 + toolReviews.length)
        ).toFixed(1)
      : tool.rating.toFixed(1);

  // Extract video ID from youtube URL for thumbnail
  const getThumbnailUrl = (embedUrl: string) => {
    const match = embedUrl.match(/embed\/([A-Za-z0-9_-]+)/);
    if (match && match[1]) {
      return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
    }
    return '';
  };

  const thumb = getThumbnailUrl(tool.videoUrl);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleFavorite(tool);
  };

  return (
    <article className="group bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-amber-500/5 transition-all duration-300 flex flex-col justify-between relative">
      <div>
        {/* Video Thumbnail Cover with Play Trigger */}
        <div 
          onClick={() => onSelect(tool)}
          className="relative w-full aspect-video bg-slate-950 overflow-hidden cursor-pointer group/video"
        >
          {thumb ? (
            <img
              src={thumb}
              alt={tool.videoTitle}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover/video:scale-105 transition-transform duration-500 opacity-90 group-hover/video:opacity-100"
            />
          ) : (
            <div className="w-full h-full bg-slate-950 flex items-center justify-center">
              <Play className="w-8 h-8 text-slate-700" />
            </div>
          )}

          {/* Dark gradient scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

          {/* Central Play Badge */}
          <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-xl group-hover/video:scale-110 transition-transform">
            <Play className="w-5 h-5 translate-x-0.5 fill-current" />
          </div>

          {/* Video Duration Badge */}
          <span className="absolute bottom-2.5 left-2.5 bg-slate-950/85 backdrop-blur-xs text-[11px] font-mono font-medium text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>شرح فيديو AI · 5 مشاهد</span>
          </span>

          {/* Developer Tag */}
          <span className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-xs text-[11px] font-medium text-amber-300 px-2 py-0.5 rounded border border-slate-700/50">
            {tool.developer}
          </span>

          {/* Firebase Favorite Button */}
          <button
            onClick={handleFavoriteClick}
            title={favorited ? 'إزالة من المفضلة' : 'حفظ في المفضلة عبر Firebase'}
            className="absolute top-2.5 left-2.5 w-8 h-8 rounded-full bg-slate-950/85 backdrop-blur-xs border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-rose-400 hover:scale-110 transition-all z-10"
          >
            <Heart
              className={`w-4 h-4 ${
                favorited ? 'fill-rose-500 text-rose-500' : 'text-slate-300'
              }`}
            />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col gap-3">
          {/* Metadata Discipline */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>
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
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className={tool.pricing === 'مجاني بالكامل' ? 'text-emerald-400' : 'text-slate-300'}>
              {tool.pricing}
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>{tool.level}</span>
          </div>

          {/* Title and Arabic Name */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                {tool.name}
              </h2>
              <span className="text-xs text-slate-400">
                {tool.arabicName}
              </span>
            </div>

            <div className="flex flex-col items-end shrink-0">
              <div className="flex items-center gap-1 text-xs text-amber-400 font-mono tabular-nums">
                <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
                <span>{averageRating}</span>
              </div>
              {toolReviews.length > 0 && (
                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                  <MessageSquare className="w-2.5 h-2.5" />
                  <span>({toolReviews.length})</span>
                </span>
              )}
            </div>
          </div>

          {/* Tagline */}
          <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
            {tool.tagline}
          </p>

          {/* Key Features preview bullet */}
          <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span className="text-amber-400 font-medium ml-1">أبرز ميزة:</span>
            <span>{tool.keyFeatures[0]}</span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-5 pb-5 pt-1 flex items-center gap-2 border-t border-slate-800/60 mt-2">
        <button
          onClick={() => onSelect(tool)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-amber-500/15 to-indigo-500/15 border border-amber-500/30 hover:border-amber-400 text-amber-300 hover:text-white text-xs font-semibold rounded-xl transition-all"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>شرح فيديو بالذكاء الاصطناعي</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <a
          href={tool.officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={`زيارة الموقع الرسمي لـ ${tool.name}`}
          className="p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </a>

        {tool.samplePrompts.length > 0 && (
          <button
            onClick={() => onOpenPromptsForTool(tool)}
            title="استعراض نماذج أوامر برومبت جاهزة"
            className="p-2 bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-amber-400 rounded-xl transition-colors"
          >
            <BookOpen className="w-4 h-4" />
          </button>
        )}
      </div>
    </article>
  );
};
