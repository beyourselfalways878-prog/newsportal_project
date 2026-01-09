import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, UploadCloud, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import * as mammoth from "mammoth";

const ArticleEditor = ({ isOpen, onClose, article, onSave, currentContent }) => {
  const [formData, setFormData] = useState({});
  const [contentHtml, setContentHtml] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [featuredImageFile, setFeaturedImageFile] = useState(null);
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');

  useEffect(() => {
    if (article) {
      setFormData({
        id: article.id,
        title_en: article.title_en || '',
        title_hi: article.title_hi || '',
        excerpt_en: article.excerpt_en || '',
        excerpt_hi: article.excerpt_hi || '',
        category: article.category || 'indian',
        author: article.author || '',
        location: article.location || '',
      });
      setContentHtml(article.content_en || '');
      setFeaturedImageUrl(article.image_url || '');
    } else {
      setFormData({
        title_en: '', title_hi: '', excerpt_en: '', excerpt_hi: '',
        category: 'indian', author: '', location: '',
      });
      setContentHtml('');
      setFeaturedImageUrl('');
    }
    setFeaturedImageFile(null);
  }, [article]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleCategoryChange = (value) => {
    setFormData(prev => ({ ...prev, category: value }));
  };

  const handleFeaturedImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFeaturedImageFile(file);
      setFeaturedImageUrl(URL.createObjectURL(file));
    }
  };

  const dataURItoBlob = (dataURI) => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  const handleDocxUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    toast({ title: "Processing .docx file...", description: "Please wait while we convert and upload images." });

    try {
      const options = {
        convertImage: mammoth.images.imgElement(async (image) => {
          const imageBuffer = await image.read("base64");
          const blob = dataURItoBlob(`data:${image.contentType};base64,${imageBuffer}`);
          const fileName = `articles/${Date.now()}-${Math.random().toString(36).substring(7)}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('article-images')
            .upload(fileName, blob, { contentType: image.contentType });

          if (uploadError) {
            console.error('Image upload error:', uploadError);
            return { src: '' };
          }

          const { data: urlData } = supabase.storage
            .from('article-images')
            .getPublicUrl(fileName);

          return { src: urlData.publicUrl };
        }),
      };

      const { value: html } = await mammoth.convert({ arrayBuffer: await file.arrayBuffer() }, options);
      setContentHtml(html);
      toast({ title: "File processed successfully!", description: "Article content has been imported." });
    } catch (error) {
      console.error("DOCX conversion error:", error);
      toast({ title: "Error processing file", description: "Could not convert the .docx file.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    let finalImageUrl = article?.image_url || '';

    if (featuredImageFile) {
      const fileName = `featured/${Date.now()}-${featuredImageFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(fileName, featuredImageFile);

      if (uploadError) {
        toast({ title: "Image Upload Error", description: uploadError.message, variant: "destructive" });
        setIsProcessing(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('article-images').getPublicUrl(fileName);
      finalImageUrl = urlData.publicUrl;
    }

    const articleData = {
      ...formData,
      content_en: contentHtml,
      content_hi: contentHtml, // Assuming same content for now
      image_url: finalImageUrl,
      published_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase.from('articles').upsert(articleData);
      if (error) throw error;
      toast({ title: "Article Saved!", description: "Your article has been successfully saved." });
      onSave();
    } catch (error) {
      console.error("Article save error:", error);
      toast({ title: "Save Error", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-card w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-border"
      >
        <header className="p-4 border-b flex items-center justify-between sticky top-0 bg-card/80 backdrop-blur-sm z-10">
          <h2 className="text-xl font-bold text-foreground">{article ? 'Edit Article' : 'Create New Article'}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </Button>
        </header>

        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="title_en">Title (English)</Label>
              <Input id="title_en" value={formData.title_en || ''} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="title_hi">Title (Hindi)</Label>
              <Input id="title_hi" value={formData.title_hi || ''} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="excerpt_en">Excerpt (English)</Label>
              <Textarea id="excerpt_en" value={formData.excerpt_en || ''} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="excerpt_hi">Excerpt (Hindi)</Label>
              <Textarea id="excerpt_hi" value={formData.excerpt_hi || ''} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={handleCategoryChange} defaultValue={formData.category}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(currentContent.categories).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             <div>
              <Label htmlFor="author">Author</Label>
              <Input id="author" value={formData.author || ''} onChange={handleInputChange} />
            </div>
             <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={formData.location || ''} onChange={handleInputChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Featured Image</Label>
              <div className="mt-2 flex items-center gap-x-3">
                <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                  {featuredImageUrl ? <img src={featuredImageUrl} alt="Featured" className="w-full h-full object-cover rounded-lg" /> : <ImageIcon className="h-8 w-8 text-muted-foreground" />}
                </div>
                <label htmlFor="featured-image-upload" className="cursor-pointer rounded-md bg-primary text-primary-foreground text-sm font-semibold px-3 py-2 hover:bg-primary/90">
                  <span>Upload Image</span>
                  <input id="featured-image-upload" type="file" className="sr-only" accept="image/*" onChange={handleFeaturedImageChange} />
                </label>
              </div>
            </div>
            <div>
              <Label>Import from .docx</Label>
              <label htmlFor="docx-upload" className="mt-2 flex justify-center w-full rounded-lg border-2 border-dashed border-border px-6 py-10 cursor-pointer hover:border-primary transition-colors">
                <div className="text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                    <p className="pl-1">Click to upload or drag and drop</p>
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">DOCX up to 10MB</p>
                </div>
                <input id="docx-upload" type="file" className="sr-only" accept=".docx" onChange={handleDocxUpload} />
              </label>
            </div>
          </div>

          <div>
            <Label>Article Content (HTML Preview)</Label>
            <div
              className="mt-2 w-full min-h-[200px] rounded-md border p-4 bg-muted/50 prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: contentHtml || '<p>Content will appear here after .docx import.</p>' }}
            />
          </div>
        </form>

        <footer className="p-4 border-t flex justify-end items-center space-x-3 sticky bottom-0 bg-card/80 backdrop-blur-sm z-10">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancel</Button>
          <Button type="submit" onClick={handleSubmit} disabled={isProcessing} className="btn-gradient">
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isProcessing ? 'Saving...' : 'Publish Article'}
          </Button>
        </footer>
      </motion.div>
    </div>
  );
};

export default ArticleEditor;
