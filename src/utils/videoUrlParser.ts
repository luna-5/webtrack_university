export const parseVideoUrl = (url: string): { embedUrl: string; type: string } => {
  if (!url || !url.trim()) {
    return { embedUrl: '', type: 'none' };
  }

  const trimmedUrl = url.trim();

  if (trimmedUrl.startsWith('<iframe') || trimmedUrl.startsWith('<embed')) {
    const srcMatch = trimmedUrl.match(/src=["']([^"']+)["']/);
    if (srcMatch) {
      return { embedUrl: srcMatch[1], type: 'iframe' };
    }
    return { embedUrl: '', type: 'invalid' };
  }

  if (trimmedUrl.includes('drive.google.com')) {
    const fileIdMatch = trimmedUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch) {
      return {
        embedUrl: `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`,
        type: 'google-drive',
      };
    }
    return { embedUrl: trimmedUrl, type: 'google-drive' };
  }

  if (trimmedUrl.includes('youtube.com') || trimmedUrl.includes('youtu.be')) {
    let videoId = '';

    if (trimmedUrl.includes('youtube.com/embed/')) {
      return { embedUrl: trimmedUrl, type: 'youtube' };
    }

    const watchMatch = trimmedUrl.match(/youtube\.com\/watch\?v=([^&]+)/);
    if (watchMatch) {
      videoId = watchMatch[1];
    }

    const shortMatch = trimmedUrl.match(/youtu\.be\/([^?&]+)/);
    if (shortMatch) {
      videoId = shortMatch[1];
    }

    const embedMatch = trimmedUrl.match(/youtube\.com\/embed\/([^?&]+)/);
    if (embedMatch) {
      videoId = embedMatch[1];
    }

    if (videoId) {
      return {
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        type: 'youtube',
      };
    }
  }

  if (trimmedUrl.includes('vimeo.com')) {
    const vimeoMatch = trimmedUrl.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return {
        embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
        type: 'vimeo',
      };
    }
  }

  const videoExtensions = /\.(mp4|webm|ogg|mov)(\?|$)/i;
  if (videoExtensions.test(trimmedUrl)) {
    return { embedUrl: trimmedUrl, type: 'direct' };
  }

  return { embedUrl: trimmedUrl, type: 'unknown' };
};
