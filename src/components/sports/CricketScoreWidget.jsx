import React, { useEffect } from 'react';

const widgetSrc = 'https://cdorgapi.b-cdn.net/widgets/score.js';

const CricketScoreWidget = () => {
  useEffect(() => {
    const existingScript = document.querySelector(`script[src="${widgetSrc}"]`);

    if (!existingScript) {
      const script = document.createElement('script');
      script.src = widgetSrc;
      script.id = 'cricdata-score-widget-script';
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className="w-full max-w-[320px] min-w-[280px]">
      <div
        id="cric_data_live_score"
        data-api-key={import.meta.env.VITE_CRICKETDATA_API_KEY}
        className="mx-auto h-[320px] w-full rounded-xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800"
        aria-label="Live cricket scores"
      >
        <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-300">
          Live cricket scores are loading...
        </div>
      </div>
    </div>
  );
};

export default CricketScoreWidget;
