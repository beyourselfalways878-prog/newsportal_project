import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { TrendingUp, Clock, Eye, ChevronRight, Share2, BookmarkPlus, MessageCircle } from 'lucide-react';

const FeaturedNews = ({ news, content, categoriesContent }) => {
  if (!news || news.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">{content.noNews}</div>;
  }
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <TrendingUp className="h-6 w-6 mr-2 text-primary" />
        {content.latest}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {news.map((article, index) => (
          <motion.article
            key={article.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow border"
          >
            <div className="aspect-video bg-muted relative overflow-hidden">
              {article.image_url ? (
                <img
                  src={article.image_url}
                  alt={article.image_alt_text || article.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">No Image</span>
                </div>
              )}
              <div className="absolute top-4 left-4">
                <span className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
                  {categoriesContent[article.category] || article.category}
                </span>
              </div>
            </div>

            <div className="p-6">
              <h3 className="news-title font-bold mb-3 line-clamp-2 hover:text-primary transition-colors">
                {article.title}
              </h3>
              <p className="news-excerpt text-muted-foreground mb-4 line-clamp-2">
                {article.excerpt}
              </p>

              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {article.time} {content.minutesAgo}
                  </span>
                  <span className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    {article.views} {content.views}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm">
                  {content.readMore}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <BookmarkPlus className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
};

export default FeaturedNews;
