import React, { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, UploadCloud, Video as VideoIcon, Trash2 } from 'lucide-react';

const VideoUploader = ({ onUploadSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [tags, setTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [videos, setVideos] = useState([]);
  const { toast } = useToast();

  const fetchVideos = useCallback(async () => {
    const { data, error } = await supabase.from('videos').select('*').order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Error fetching videos', description: error.message, variant: 'destructive' });
    } else {
      setVideos(data);
    }
  }, [toast]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleVideoFileChange = (e) => {
    setVideoFile(e.target.files[0]);
  };

  const handleThumbnailFileChange = (e) => {
    setThumbnailFile(e.target.files[0]);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setVideoFile(null);
    setThumbnailFile(null);
    setTags('');
    document.getElementById('video-file-input').value = '';
    document.getElementById('thumbnail-file-input').value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile || !title) {
      toast({ title: 'Missing fields', description: 'Please provide a title and a video file.', variant: 'destructive' });
      return;
    }
    setIsUploading(true);

    try {
      const videoFileName = `videos/${Date.now()}-${videoFile.name}`;
      const { data: videoUploadData, error: videoUploadError } = await supabase.storage
        .from('videos')
        .upload(videoFileName, videoFile);

      if (videoUploadError) throw videoUploadError;
      const { data: videoUrlData } = supabase.storage.from('videos').getPublicUrl(videoUploadData.path);

      let thumbnailUrl = null;
      if (thumbnailFile) {
        const thumbnailFileName = `thumbnails/${Date.now()}-${thumbnailFile.name}`;
        const { data: thumbUploadData, error: thumbUploadError } = await supabase.storage
          .from('videos')
          .upload(thumbnailFileName, thumbnailFile);

        if (thumbUploadError) throw thumbUploadError;
        const { data: thumbUrlData } = supabase.storage.from('videos').getPublicUrl(thumbUploadData.path);
        thumbnailUrl = thumbUrlData.publicUrl;
      }

      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(Boolean);

      const { error: insertError } = await supabase.from('videos').insert({
        title_en: title,
        title_hi: title,
        description_en: description,
        description_hi: description,
        video_url: videoUrlData.publicUrl,
        thumbnail_url: thumbnailUrl,
        tags: tagsArray,
        published_at: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      toast({ title: 'Video Uploaded!', description: 'Your video is now live.' });
      resetForm();
      fetchVideos();
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (videoId, videoPath, thumbPath) => {
    const confirmed = window.confirm('Are you sure you want to delete this video? This action cannot be undone.');
    if (!confirmed) return;

    try {
      const { error: dbError } = await supabase.from('videos').delete().eq('id', videoId);
      if (dbError) throw dbError;

      const filesToDelete = [];
      if (videoPath) filesToDelete.push(videoPath.split('/').slice(-2).join('/'));
      if (thumbPath) filesToDelete.push(thumbPath.split('/').slice(-2).join('/'));

      if (filesToDelete.length > 0) {
        const { error: storageError } = await supabase.storage.from('videos').remove(filesToDelete);
        if (storageError) console.error("Storage deletion warning:", storageError.message);
      }

      toast({ title: 'Video Deleted', description: 'The video has been removed.' });
      fetchVideos();
    } catch (error) {
      toast({ title: 'Deletion Failed', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Upload New Video</CardTitle>
            <CardDescription>Fill in the details and upload your video file.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Video Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g., tech, review, unboxing" />
              </div>
              <div>
                <Label htmlFor="video-file-input">Video File</Label>
                <Input id="video-file-input" type="file" accept="video/*" onChange={handleVideoFileChange} required className="file:text-primary-foreground" />
              </div>
              <div>
                <Label htmlFor="thumbnail-file-input">Thumbnail Image</Label>
                <Input id="thumbnail-file-input" type="file" accept="image/*" onChange={handleThumbnailFileChange} className="file:text-primary-foreground" />
              </div>
              <Button type="submit" disabled={isUploading} className="w-full">
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                Upload Video
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Videos</CardTitle>
            <CardDescription>Manage your existing video library.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {videos.length > 0 ? videos.map(video => (
                <div key={video.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                  {video.thumbnail_url ? (
                    <img src={video.thumbnail_url} alt={video.title_en} className="w-24 h-16 object-cover rounded-md" />
                  ) : (
                    <div className="w-24 h-16 bg-muted rounded-md flex items-center justify-center">
                      <VideoIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-grow">
                    <p className="font-semibold line-clamp-1">{video.title_en}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(video.published_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="destructive" size="icon" onClick={() => handleDelete(video.id, video.video_url, video.thumbnail_url)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )) : (
                <p className="text-center text-muted-foreground py-8">No videos uploaded yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VideoUploader;
