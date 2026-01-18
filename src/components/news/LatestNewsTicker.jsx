import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient.js';

const LatestNewsTicker = () => {
  const [headlines, setHeadlines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const fetchHeadlines = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('articles')
        .select('id,title_hi,title_en,title,published_at')
        .order('published_at', { ascending: false })
        .limit(12);

      if (!isActive) return;

      if (error) {
        console.error('Latest ticker fetch error:', error);
        setHeadlines([]);
      } else {
        const mapped = (data || []).map((article) => ({
          id: article.id,
          title:
            article.title_hi ||
            article.title ||
            article.title_en ||
            'नया लेख'
        }));
        setHeadlines(mapped);
      }
      setLoading(false);
    };

    fetchHeadlines();

    // Optional: refresh periodically (every 60s)
    const interval = setInterval(fetchHeadlines, 60000);
    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, []);

  const renderItems = () => {
    if (loading) {
      return [
        'ताज़ा खबरें लोड हो रही हैं...',
        'कृपया प्रतीक्षा करें',
      ].map((text, idx) => (
        <span key={`loading-${idx}`} className="mx-6 whitespace-nowrap opacity-90">
          {text}
        </span>
      ));
    }

    if (!headlines.length) {
      return (
        <span className="mx-6 whitespace-nowrap opacity-90">
          अभी कोई नई खबर उपलब्ध नहीं है
        </span>
      );
    }

    // Repeat the list twice for seamless scroll
    const doubled = [...headlines, ...headlines];

    return doubled.map((item, idx) => (
      <Link
        key={`${item.id}-${idx}`}
        to={`/article/${item.id}`}
        className="mx-6 whitespace-nowrap hover:underline"
      >
        {item.title}
      </Link>
    ));
  };

  return (
    <div className="ribbon ribbon--ticker text-white text-sm">
      <div className="ribbon__marquee">
        <div className="ribbon__track">
          {renderItems()}
        </div>
      </div>
    </div>
  );
};

export default LatestNewsTicker;
