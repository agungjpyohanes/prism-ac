import React from 'react';

export default function PrismLogo({
  className = "w-full h-full",
  withText = false,
  size = "md",
  imgClassName = ""
}) {
  // Ukuran dimensi container logo
  const sizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const containerSize = sizeMap[size] || sizeMap.md;

  return (
    <div className="flex items-center gap-3 select-none">
      <div
        className={`relative ${containerSize} rounded-2xl bg-blue-50 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-400/30 p-1.5 flex items-center justify-center shrink-0 shadow-sm overflow-hidden`}
      >
        <img
          src="/prism-logo.png"
          alt="PRISM Logo"
          className={`${className} ${imgClassName} object-contain`}
        />
      </div>

      {withText && (
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="font-display font-black text-base sm:text-lg tracking-wider text-slate-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-cyan-300 dark:via-sky-200 dark:to-indigo-300 leading-none">
              PRISM
            </h2>
            <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-cyan-500/20 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-cyan-400/30">
              V2.5
            </span>
          </div>
          <p className="text-[10px] font-mono text-blue-600 dark:text-cyan-400 font-bold truncate mt-0.5">
            Integrated System &amp; Monitoring
          </p>
        </div>
      )}
    </div>
  );
}
