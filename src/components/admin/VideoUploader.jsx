import React, { useMemo, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient.js';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UploadCloud } from 'lucide-react';

// Optional uploader for video files to Supabase Storage.
// Not wired by default; safe to use inside admin-only areas.
const VideoUploader = ({ bucket = 'article-videos', onUploadSuccess }) => {
  const { toast } = useToast();

  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileLabel = useMemo(() => {
    if (!file) return 'No file selected';
    return `${file.name} (${Math.round(file.size / 1024 / 1024)} MB)`;
  }, [file]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `videos/${Date.now()}-${safeName}`;

      const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || undefined,
      });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

      toast({ title: 'Upload complete', description: 'Video uploaded successfully.' });
      onUploadSuccess?.({ path: data.path, publicUrl: urlData.publicUrl });
      setFile(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Upload failed', description: error?.message || 'Could not upload video.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Video Uploader</CardTitle>
        <CardDescription>Upload a video to Supabase Storage.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video">Select video</Label>
            <Input
              id="video"
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={isUploading}
            />
            <p className="text-xs text-muted-foreground">{fileLabel}</p>
          </div>

          <Button type="submit" disabled={!file || isUploading}>
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
            {isUploading ? 'Uploading…' : 'Upload'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default VideoUploader;
