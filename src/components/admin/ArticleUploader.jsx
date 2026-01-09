import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import mammoth from 'mammoth';
import { Loader2, FileText, Image as ImageIcon, Zap, Youtube } from 'lucide-react';

const ArticleUploader = ({ isOpen, setIsOpen, onUploadSuccess, currentContent, categories, article }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [articleData, setArticleData] = useState({});
  const [contentHtml, setContentHtml] = useState('');
  const [featuredImageFile, setFeaturedImageFile] = useState(null);
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');

  const { toast } = useToast();

  const resetForm = useCallback(() => {
    setArticleData({
      title_hi: '', excerpt_hi: '',
      category: 'indian', author: '', location: '', is_breaking: false,
      image_alt_text_hi: '',
      seo_title_hi: '',
      seo_keywords_hi: '',
      video_url: '',
    });
    setContentHtml('');
    setFeaturedImageUrl('');
    setFeaturedImageFile(null);
    setIsProcessing(false);
  }, []);

  useEffect(() => {
    if (article) {
      setArticleData({
        id: article.id,
        title_hi: article.title_hi || '',
        excerpt_hi: article.excerpt_hi || '',
        category: article.category || 'indian',
        author: article.author || '',
        location: article.location || '',
        is_breaking: article.is_breaking || false,
        published_at: article.published_at,
        image_alt_text_hi: article.image_alt_text_hi || '',
        seo_title_hi: article.seo_title_hi || '',
        seo_keywords_hi: article.seo_keywords_hi || '',
        video_url: article.video_url || '',
      });
      setContentHtml(article.content_hi || '');
      setFeaturedImageUrl(article.image_url || '');
    } else {
      resetForm();
    }
  }, [article, isOpen, resetForm]);

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

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    toast({ title: currentContent.uploader.processing, description: 'Converting .docx file...' });

    try {
      const options = {
        transformDocument: mammoth.transforms.paragraph((paragraph) => {
            let newChildren = [];
            paragraph.children.forEach(child => {
                if (child.type === 'run' && child.children) {
                    child.children.forEach(runChild => {
                        if (runChild.type === 'hyperlink') {
                            const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
                            const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/;
                            const youtubeMatch = runChild.href.match(youtubeRegex);
                            const vimeoMatch = runChild.href.match(vimeoRegex);

                            if (youtubeMatch || vimeoMatch) {
                                let iframeHtml;
                                if(youtubeMatch) {
                                    iframeHtml = `<iframe src="https://www.youtube.com/embed/${youtubeMatch[1]}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
                                } else {
                                    iframeHtml = `<iframe src="https://player.vimeo.com/video/${vimeoMatch[1]}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
                                }
                                newChildren.push({ type: 'text', value: `<div>${iframeHtml}</div>` });
                            } else {
                                newChildren.push(child);
                            }
                        } else {
                            newChildren.push(child);
                        }
                    });
                } else {
                     newChildren.push(child);
                }
            });
            paragraph.children = newChildren;
            return paragraph;
        }),
        convertImage: mammoth.images.imgElement(async (image) => {
          const imageBuffer = await image.read("base64");
          const blob = dataURItoBlob(`data:${image.contentType};base64,${imageBuffer}`);
          const fileName = `articles/${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('article-images')
            .upload(fileName, blob, { contentType: image.contentType });

          if (uploadError) {
            console.error('Image upload error:', uploadError);
            throw new Error(`Image upload failed: ${uploadError.message}`);
          }

          const { data: urlData } = supabase.storage
            .from('article-images')
            .getPublicUrl(uploadData.path);

          return { src: urlData.publicUrl };
        })
      };

      const { value: html } = await mammoth.convert({ arrayBuffer: await file.arrayBuffer() }, options);

      const firstImageUrl = html.match(/<img src="(.*?)"/)?.[1] || '';

      setContentHtml(html);
      setFeaturedImageUrl(prev => prev || firstImageUrl);

      toast({ title: 'Conversion Successful', description: 'Please fill in the remaining details.' });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({ variant: 'destructive', title: 'Conversion Failed', description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setArticleData(prev => ({ ...prev, [id]: value }));
  };

  const handleFeaturedImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFeaturedImageFile(file);
      setFeaturedImageUrl(URL.createObjectURL(file));
    }
  };

  const handleCategoryChange = (value) => {
    setArticleData(prev => ({ ...prev, category: value }));
  };

  const handleCheckboxChange = (checked) => {
    setArticleData(prev => ({ ...prev, is_breaking: checked }));
  };

  const handleSave = async () => {
    setIsProcessing(true);

    let finalImageUrl = articleData.id ? featuredImageUrl : (featuredImageUrl || article?.image_url);

    if (featuredImageFile) {
      const fileName = `featured/${Date.now()}-${featuredImageFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(fileName, featuredImageFile, { upsert: !!articleData.id });

      if (uploadError) {
        toast({ title: "Image Upload Error", description: uploadError.message, variant: "destructive" });
        setIsProcessing(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('article-images').getPublicUrl(uploadData.path);
      finalImageUrl = urlData.publicUrl;
    }

    try {
      const finalData = {
        ...articleData,
        title_en: articleData.title_hi,
        content_en: contentHtml,
        content_hi: contentHtml,
        image_url: finalImageUrl,
        published_at: articleData.id ? articleData.published_at : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      delete finalData.created_at;

      const { error } = await supabase.from('articles').upsert(finalData);
      if (error) throw error;

      toast({ title: articleData.id ? 'Article Updated!' : currentContent.uploader.uploadSuccess });
      onUploadSuccess();
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving article:', error);
      toast({ variant: 'destructive', title: currentContent.uploader.uploadError, description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const formTitle = article ? (currentContent.uploader.editTitle || 'Edit Article') : currentContent.uploader.title;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{formTitle}</DialogTitle>
          <DialogDescription>{currentContent.uploader.description}</DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto p-1 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="title_hi">शीर्षक (Title)</Label>
              <Input id="title_hi" value={articleData.title_hi || ''} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="excerpt_hi">अंश (Excerpt)</Label>
              <Textarea id="excerpt_hi" value={articleData.excerpt_hi || ''} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="category">श्रेणी (Category)</Label>
              <Select onValueChange={handleCategoryChange} value={articleData.category || 'indian'}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             <div>
              <Label htmlFor="author">लेखक (Author)</Label>
              <Input id="author" value={articleData.author || ''} onChange={handleInputChange} />
            </div>
             <div>
              <Label htmlFor="location">स्थान (Location)</Label>
              <Input id="location" value={articleData.location || ''} onChange={handleInputChange} />
            </div>
            <div className="flex items-center space-x-2 pt-4">
              <Checkbox id="is_breaking" checked={articleData.is_breaking} onCheckedChange={handleCheckboxChange} />
              <Label htmlFor="is_breaking" className="flex items-center gap-2 text-base font-medium text-orange-500">
                <Zap className="h-5 w-5" /> ब्रेकिंग न्यूज़ के रूप में चिह्नित करें
              </Label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>फीचर्ड इमेज (Featured Image)</Label>
              <div className="mt-2 flex items-center gap-x-3">
                <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                  {featuredImageUrl ? <img src={featuredImageUrl} alt="Featured preview" className="w-full h-full object-cover rounded-lg" /> : <ImageIcon className="h-8 w-8 text-muted-foreground" />}
                </div>
                <label htmlFor="featured-image-upload" className="cursor-pointer rounded-md bg-primary text-primary-foreground text-sm font-semibold px-3 py-2 hover:bg-primary/90">
                  <span>छवि अपलोड करें</span>
                  <input id="featured-image-upload" type="file" className="sr-only" accept="image/*" onChange={handleFeaturedImageChange} />
                </label>
              </div>
            </div>
            <div>
              <Label>.docx से आयात करें (Import from .docx)</Label>
              <label htmlFor="docx-upload" className="mt-2 flex justify-center w-full rounded-lg border-2 border-dashed border-border px-6 py-10 cursor-pointer hover:border-primary transition-colors">
                <div className="text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                    <p className="pl-1">अपलोड करने के लिए क्लिक करें या खींचें और छोड़ें</p>
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">DOCX 10MB तक</p>
                </div>
                <input id="docx-upload" type="file" className="sr-only" accept=".docx" onChange={handleFileChange} />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <Label htmlFor="image_alt_text_hi">छवि ऑल्ट टेक्स्ट (Image Alt Text)</Label>
              <Input id="image_alt_text_hi" value={articleData.image_alt_text_hi || ''} onChange={handleInputChange} placeholder="उदा., प्रधानमंत्री भाषण देते हुए" />
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-medium text-foreground">मीडिया और एसईओ (Media & SEO)</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="video_url" className="flex items-center gap-2"><Youtube className="h-5 w-5 text-red-500" /> वीडियो एम्बेड कोड (Video Embed Code)</Label>
                <Textarea id="video_url" value={articleData.video_url || ''} onChange={handleInputChange} placeholder="यहां वीडियो iframe एम्बेड कोड पेस्ट करें (उदा., YouTube, Vimeo से)" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div>
                <Label htmlFor="seo_title_hi">एसईओ शीर्षक (SEO Title)</Label>
                <Input id="seo_title_hi" value={articleData.seo_title_hi || ''} onChange={handleInputChange} placeholder="एक संक्षिप्त, कीवर्ड-युक्त शीर्षक दर्ज करें" />
              </div>
              <div>
                <Label htmlFor="seo_keywords_hi">एसईओ कीवर्ड (SEO Keywords)</Label>
                <Input id="seo_keywords_hi" value={articleData.seo_keywords_hi || ''} onChange={handleInputChange} placeholder="उदा., राजनीति, चुनाव, भारत" />
              </div>
            </div>
          </div>

          <div>
            <Label>लेख सामग्री (HTML पूर्वावलोकन)</Label>
            <div
              className="mt-2 w-full min-h-[200px] rounded-md border p-4 bg-muted/50 prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: contentHtml || '<p>.docx आयात के बाद सामग्री यहां दिखाई देगी।</p>' }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isProcessing}>
            {currentContent.uploader.form.cancel || 'Cancel'}
          </Button>
          <Button onClick={handleSave} disabled={isProcessing || !articleData.title_hi}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isProcessing ? (currentContent.uploader.form.saving || 'Saving...') : (currentContent.uploader.form.save || 'Save & Publish Article')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ArticleUploader;
