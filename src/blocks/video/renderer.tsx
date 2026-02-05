'use client';

import type { BlockRendererProps } from '@/core/blocks/types';
import type { VideoProps } from './index';
import { cn } from '@/lib/cn';

const aspectRatioClasses = {
  '16:9': 'aspect-video',
  '4:3': 'aspect-[4/3]',
  '1:1': 'aspect-square',
  '9:16': 'aspect-[9/16]',
};

function getEmbedUrl(src: string): string | null {
  // YouTube
  const youtubeMatch = src.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/
  );
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }

  // Vimeo
  const vimeoMatch = src.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  // Already an embed URL or iframe src
  if (src.includes('youtube.com/embed') || src.includes('player.vimeo.com')) {
    return src;
  }

  return null;
}

export function VideoRenderer({ props, editMode }: BlockRendererProps<VideoProps>) {
  const { src, type, poster, title, autoplay, loop, muted, controls, aspectRatio } = props;

  if (!src) {
    return (
      <div className="flex items-center justify-center bg-gray-100 text-gray-400 p-8 rounded-lg">
        <p>No video source provided</p>
      </div>
    );
  }

  // Render embedded video (YouTube, Vimeo)
  if (type === 'embed') {
    const embedUrl = getEmbedUrl(src);

    if (!embedUrl) {
      return (
        <div className="flex items-center justify-center bg-gray-100 text-gray-400 p-8 rounded-lg">
          <p>Invalid embed URL</p>
        </div>
      );
    }

    const embedParams = new URLSearchParams();
    if (autoplay) embedParams.set('autoplay', '1');
    if (loop) embedParams.set('loop', '1');
    if (muted) embedParams.set('mute', '1');

    const fullEmbedUrl = `${embedUrl}${embedParams.toString() ? `?${embedParams.toString()}` : ''}`;

    return (
      <div className={cn('relative w-full overflow-hidden rounded-lg', aspectRatioClasses[aspectRatio])}>
        <iframe
          src={fullEmbedUrl}
          title={title || 'Embedded video'}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // Render hosted video
  return (
    <div className={cn('relative w-full overflow-hidden rounded-lg', aspectRatioClasses[aspectRatio])}>
      <video
        src={src}
        poster={poster}
        autoPlay={autoplay}
        loop={loop}
        muted={muted}
        controls={controls}
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        title={title}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
