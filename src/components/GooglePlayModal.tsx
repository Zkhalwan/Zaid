import React from 'react';
import { X, Smartphone, Download, CheckCircle2, ExternalLink, ShieldCheck, ArrowRight, Layers } from 'lucide-react';

interface GooglePlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUrl: string;
}

export const GooglePlayModal: React.FC<GooglePlayModalProps> = ({
  isOpen,
  onClose,
  appUrl,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-bold flex items-center justify-center shadow-lg">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">دليل نشر وتنزيل التطبيق على Google Play و Android</h2>
              <p className="text-xs text-slate-400">
                خطوات تحويل الموقع إلى تطبيق أندرويد رسمي بصيغة AAB ونشره على المتجر
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
        <div className="flex-1 overflow-y-auto py-5 flex flex-col gap-5 text-xs text-slate-300 scrollbar-thin">
          {/* Quick Notice */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block mb-0.5">الموقع مهيأ بنسبة 100% كـ PWA معتمد من Google</span>
              <p className="text-[11px] text-amber-300/90 leading-relaxed">
                تم تجهيز ملف <code className="bg-slate-950 px-1.5 py-0.5 rounded text-amber-300">manifest.json</code> والأيقونات بدقة 192x192 و 512x512، مما يجعله جاهزاً تماماً للتحويل الفوري إلى حزمة متجر جوجل بلاي.
              </p>
            </div>
          </div>

          {/* Steps for Google Play */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-xs font-bold">1</span>
              <span>الخطوة الأولى: توليد حزمة متجر جوجل بلاي (AAB Package)</span>
            </h3>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
              <p className="leading-relaxed">
                تعتمد Google رسمياً تقنية <strong>Trusted Web Activity (TWA)</strong> عبر منصة <strong>PWABuilder</strong> المعتمدة من مايكروسوفت وجوجل:
              </p>
              
              <ol className="list-decimal list-inside space-y-1.5 text-slate-300 mr-2">
                <li>افتح موقع: <a href="https://www.pwabuilder.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 font-mono hover:underline">pwabuilder.com</a></li>
                <li>الصق رابط موقعك الحالي: <code className="bg-slate-900 px-2 py-0.5 rounded text-slate-300 select-all font-mono">{appUrl}</code></li>
                <li>اضغط <strong>Start</strong> وسيقوم الموقع بفحص المعايير وإعطائك تقييماً كاملاً.</li>
                <li>انقر على <strong>Package for Store</strong> واختر <strong>Google Play (Android)</strong>.</li>
                <li>سيطلب منك إدخال اسم حزمة الأندرويد (مثال: <code className="text-amber-400">com.aitools.atlas</code>).</li>
                <li>اضغط <strong>Generate Package</strong> لتحميل ملف <code className="text-emerald-400 font-mono">.aab</code> و <code className="text-emerald-400 font-mono">assetlinks.json</code> فوراً!</li>
              </ol>

              <div className="pt-2">
                <a
                  href="https://www.pwabuilder.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all"
                >
                  <span>فتح أداة PWABuilder الآن</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Step 2: Google Play Console */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-xs font-bold">2</span>
              <span>الخطوة الثانية: الرفع على حساب Google Play Console</span>
            </h3>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 leading-relaxed">
              <ul className="space-y-1.5 mr-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>سجل دخولك في <a href="https://play.google.com/console" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">Google Play Console</a> (يتطلب حساب مطور رسوم 25$ لمرة واحدة).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>انقر على <strong>Create App</strong> واكتب اسم التطبيق (موسوعة أدوات الذكاء الاصطناعي).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>في قسم <strong>App Bundle</strong>، ارفع ملف <code className="text-emerald-400 font-mono">.aab</code> الذي تم تنزيله من الخطوة الأولى.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>أضف صور الشاشة (Screenshots) والوصف بالعربية، ثم اضغط <strong>Send for Review</strong>.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Direct Install option on Android Phone */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <span className="font-bold text-white block mb-0.5">التثبيت الفوري على هاتفك الآن (بدون متجر):</span>
              <p className="text-[11px] text-slate-400">
                افتح رابط الموقع من متصفح Chrome على هاتفك واضغط على خيارات المتصفح (⋮) ثم اختر <strong>"إضافة إلى الشاشة الرئيسية (Install App)"</strong> وسيعمل كتطبيق أندرويد مستقل فوراً.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-xl transition-colors"
          >
            فهمت الخطوات
          </button>
        </div>
      </div>
    </div>
  );
};
