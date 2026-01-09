import React from 'react';
import { motion } from 'framer-motion';

// Lightweight grid for secondary news blocks.
// Not wired by default; safe to import and use anywhere.
const MoreNewsGrid = ({ news, content, onArticleClick, title }) => {
  if (!news || news.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">{content?.noNews || 'No Articles Available'}</div>;
  }

  return (
    <section className="py-6">
      <h2 className="text-2xl font-bold mb-6 text-foreground">{title || content?.moreNewsTitle || 'More News'}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.map((article, index) => (
          <motion.article
            key={article.id || index}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="bg-card/70 backdrop-blur-md rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-white/10 cursor-pointer group"
            onClick={() => onArticleClick?.(article)}
          >
            <div className="aspect-video bg-muted overflow-hidden relative">
              {article.image_url ? (
                <img
                  alt={article.image_alt_text || article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  src={article.image_url}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">No Image</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-4">
                <h3 className="font-semibold line-clamp-2 text-white shadow-text">{article.title}</h3>
              </div>
            </div>

            <div className="p-4">
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{article.excerpt}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{article.time_ago || article.time || 'N/A'} {content?.minutesAgo || ''}</span>
                <span>{article.views || 0} {content?.views || ''}</span>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
};

export default MoreNewsGrid;
