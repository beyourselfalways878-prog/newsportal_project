import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Share2, Bookmark, MessageSquare, Clock, Eye, User, CalendarDays, MapPin } from 'lucide-react';

const ArticleModal = ({ article, isOpen, onClose, currentContent }) => {
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!article) return null;

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 50 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    exit: { opacity: 0, scale: 0.9, y: -50, transition: { duration: 0.2 } },
  };

  const { title, content, category, time_ago, views, author, published_at, image_url, image_alt_text } = article;
  const categoryName = currentContent.categories[category] || category;
  const authorName = author || (currentContent.siteName || "News Team");
  const formattedDate = published_at
    ? new Date(published_at).toLocaleDateString(currentContent.language === 'hi' ? 'hi-IN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';


  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
        >
          <motion.div
            className="bg-card w-full max-w-3xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-border"
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="p-4 sm:p-6 border-b flex items-center justify-between sticky top-0 bg-card/80 backdrop-blur-sm z-10">
              <div className="flex items-center space-x-3">
                <span className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm">
                  {categoryName}
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-foreground line-clamp-1">{title}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </Button>
            </header>

            <div className="flex-grow overflow-y-auto p-4 sm:p-6">
              {image_url && (
                <div className="mb-6 rounded-lg overflow-hidden aspect-video">
                  <img src={image_url} alt={image_alt_text || title} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-muted-foreground mb-4">
                <span className="flex items-center"><User className="h-4 w-4 mr-1.5" /> {authorName}</span>
                <span className="flex items-center"><CalendarDays className="h-4 w-4 mr-1.5" /> {formattedDate}</span>
                <span className="flex items-center"><Clock className="h-4 w-4 mr-1.5" /> {time_ago || 'N/A'}</span>
                <span className="flex items-center"><Eye className="h-4 w-4 mr-1.5" /> {views || 0} {currentContent.views}</span>
                {article.location && <span className="flex items-center"><MapPin className="h-4 w-4 mr-1.5" /> {article.location}</span>}
              </div>

              <div
                className="prose prose-sm sm:prose-base dark:prose-invert max-w-none leading-relaxed text-foreground article-content"
                dangerouslySetInnerHTML={{ __html: content || currentContent.noNews }}
              />
            </div>

            <footer className="p-4 sm:p-6 border-t flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 sticky bottom-0 bg-card/80 backdrop-blur-sm z-10">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" className="text-xs">
                  <Share2 className="h-3.5 w-3.5 mr-1.5" /> {currentContent.shareArticle}
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  <Bookmark className="h-3.5 w-3.5 mr-1.5" /> {currentContent.bookmark}
                </Button>
              </div>
              <Button size="sm" className="w-full sm:w-auto text-xs">
                <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> {currentContent.comments} ({article.comment_count || 0})
              </Button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ArticleModal;
