import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Clock, Eye, User, CalendarDays } from 'lucide-react';

const FeaturedArticleHero = ({ article, content, onReadMore }) => {
  if (!article) {
    return (
      <div className="h-96 flex items-center justify-center bg-muted rounded-xl shadow-inner">
        <p className="text-muted-foreground">{content.noNews}</p>
      </div>
    );
  }

  const { title, excerpt, category, time_ago, views, image_url, author, published_at, image_alt_text } = article;
  const categoryName = content.categories[category] || category;
  const authorName = author || (content.siteName || "News Team");
  const formattedDate = published_at
    ? new Date(published_at).toLocaleDateString(content.language === 'hi' ? 'hi-IN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative rounded-xl overflow-hidden shadow-2xl group bg-card border border-border/50"
    >
      <div className="aspect-w-16 aspect-h-9 lg:aspect-h-7">
        {image_url ? (
          <img
            src={image_url}
            alt={image_alt_text || title}
            className="w-full h-full object-cover transform transition-transform duration-500 ease-in-out group-hover:scale-105"
          />
        ) : (
           <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-xl">No Image Available</span>
           </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>
      </div>

      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 text-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <span className="bg-primary/80 backdrop-blur-sm text-primary-foreground px-4 py-1.5 rounded-full text-sm font-semibold shadow-md mb-3 inline-block">
            {categoryName}
          </span>
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold mb-3 leading-tight line-clamp-3 shadow-text">
            {title}
          </h1>
          <p className="text-sm md:text-base text-gray-200 mb-4 line-clamp-2 md:line-clamp-3 max-w-3xl shadow-text">
            {excerpt}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs md:text-sm text-gray-300 mb-6">
            <span className="flex items-center"><User className="h-4 w-4 mr-1.5" /> {authorName}</span>
            <span className="flex items-center"><CalendarDays className="h-4 w-4 mr-1.5" /> {formattedDate}</span>
            <span className="flex items-center"><Clock className="h-4 w-4 mr-1.5" /> {time_ago || 'N/A'}</span>
            <span className="flex items-center"><Eye className="h-4 w-4 mr-1.5" /> {views || 0} {content.views}</span>
          </div>

          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg group-hover:scale-105 transition-transform"
            onClick={onReadMore}
          >
            {content.readMore}
            <ArrowRight className="h-5 w-5 ml-2 transform transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default FeaturedArticleHero;
