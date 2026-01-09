import React from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

// Optional modal reader experience.
// This is intentionally simple and safe: it renders the article HTML as-is.
// If you plan to accept arbitrary HTML from users, add sanitization.
const ArticleModal = ({ article, isOpen, onClose, currentContent, baseUrl, language }) => {
  if (!article) return null;

  const {
    id,
    title,
    excerpt,
    content,
    image_url,
    image_alt_text,
    seo_title,
    seo_keywords,
  } = article;

  const canonicalUrl = baseUrl ? `${baseUrl}/article/${id}` : undefined;
  const generalKeywords = "भारत समाचार आज, आज की ताजा खबर, राष्ट्रीय समाचार, भाजपा, कांग्रेस, नवीनतम समाचार, ब्रेकिंग न्यूज";
  const combinedKeywords = [seo_keywords, generalKeywords].filter(Boolean).join(', ');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose?.() : null)}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <Helmet>
          {language && <html lang={language} />}
          <title>{`${seo_title || title} | ${currentContent?.siteName || '24x7 Indian News'}`}</title>
          {excerpt && <meta name="description" content={excerpt} />}
          {combinedKeywords && <meta name="keywords" content={combinedKeywords} />}
          {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
          {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
          <meta property="og:type" content="article" />
          <meta property="og:title" content={seo_title || title} />
          {excerpt && <meta property="og:description" content={excerpt} />}
          {image_url && <meta property="og:image" content={image_url} />}
        </Helmet>

        <DialogHeader>
          <DialogTitle className="text-2xl md:text-3xl font-extrabold">{title}</DialogTitle>
          {excerpt ? (
            <DialogDescription className="text-muted-foreground">{excerpt}</DialogDescription>
          ) : null}
        </DialogHeader>

        {image_url ? (
          <div className="rounded-lg overflow-hidden aspect-video bg-muted">
            <img src={image_url} alt={image_alt_text || title} className="w-full h-full object-cover" />
          </div>
        ) : null}

        <div
          className="prose prose-sm sm:prose-base dark:prose-invert max-w-none leading-relaxed text-foreground article-content"
          dangerouslySetInnerHTML={{ __html: content || '' }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ArticleModal;
