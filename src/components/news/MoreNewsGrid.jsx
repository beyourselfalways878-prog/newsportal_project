import React from 'react';
import { motion } from 'framer-motion';

const MoreNewsGrid = ({ news, content }) => {
  if (!news || news.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">{content.noNews}</div>;
  }

  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">{content.moreNewsTitle || 'More News'}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.map((article, index) => (
          <motion.article
            key={article.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow border"
          >
            <div className="aspect-video bg-muted">
              <img
                alt={article.image_alt_text || article.title}
                className="w-full h-full object-cover"
               src={article.image_url || "https://images.unsplash.com/photo-1662485732745-5a841bfe7f65"} />
            </div>
            <div className="p-4">
              <h3 className="font-semibold mb-2 line-clamp-2">
                {article.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {article.excerpt}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{article.time || (Math.floor(Math.random() * 60) + 1)} {content.minutesAgo}</span>
                <span>{article.views || ((Math.random() * 10 + 1).toFixed(1) + 'K')} {content.views}</span>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
};

export default MoreNewsGrid;
