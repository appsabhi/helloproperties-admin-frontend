import React, { useState } from 'react';

export default function MediaThumbnail({ 
  imageUrl, 
  videoUrl, 
  video, 
  video_url, 
  title, 
  className = "w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out",
  fallbackSrc = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80",
  playButtonSize = "large" // 'large' or 'small'
}) {
  const [generatedPoster, setGeneratedPoster] = useState(null);
  
  const actualVideoUrl = videoUrl || video || video_url;
  const isFallbackOrInvalid = !imageUrl || 
                              imageUrl === 'null' || 
                              imageUrl === 'undefined' || 
                              String(imageUrl).trim() === '' || 
                              (typeof imageUrl === 'string' && imageUrl.includes('images.unsplash.com'));

  React.useEffect(() => {
    const isYoutube = actualVideoUrl && actualVideoUrl.includes('youtu');
    const isEmbed = actualVideoUrl && (actualVideoUrl.includes('instagram.com') || actualVideoUrl.includes('embed'));
    
    if (!actualVideoUrl || !isFallbackOrInvalid || isYoutube || isEmbed) return;

    let isMounted = true;
    const videoElement = document.createElement('video');
    videoElement.crossOrigin = 'anonymous';
    videoElement.muted = true;
    videoElement.playsInline = true;
    videoElement.preload = 'metadata';
    videoElement.src = actualVideoUrl;

    videoElement.onloadeddata = () => {
      if (!isMounted) return;
      videoElement.currentTime = 0.1;
    };

    videoElement.onseeked = () => {
      if (!isMounted) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth || 640;
        canvas.height = videoElement.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setGeneratedPoster(dataUrl);
      } catch (e) {
        console.warn('Could not generate thumbnail', e);
      }
    };

    return () => {
      isMounted = false;
      videoElement.src = '';
    };
  }, [actualVideoUrl, isFallbackOrInvalid]);

  // We no longer return early if there's a valid imageUrl, 
  // because if there's ALSO a video, we want to show the video play button over the imageUrl (which acts as the poster).
  if (!actualVideoUrl) {
    return (
      <img 
        src={!isFallbackOrInvalid ? imageUrl : fallbackSrc} 
        alt={title || "Property"} 
        className={className}
        loading="lazy"
        onError={(e) => {
          e.target.src = fallbackSrc;
        }}
      />
    );
  }

  if (actualVideoUrl) {
    const isYoutube = actualVideoUrl.includes('youtu');
    let ytVideoId = '';
    
    if (isYoutube) {
      try {
        if (actualVideoUrl.includes('watch?v=')) {
          ytVideoId = actualVideoUrl.split('watch?v=')[1].split('&')[0];
        } else if (actualVideoUrl.includes('youtu.be/')) {
          ytVideoId = actualVideoUrl.split('youtu.be/')[1].split('?')[0];
        }
      } catch (e) {
        console.warn('Error parsing youtube url', e);
      }
    }

    const btnClasses = playButtonSize === 'large' 
      ? "w-12 h-12 border-t-8 border-l-[14px] border-b-8 ml-1"
      : "w-8 h-8 border-t-[5px] border-l-[8px] border-b-[5px] ml-0.5";

    const outerClasses = playButtonSize === 'large'
      ? "w-12 h-12"
      : "w-8 h-8";

    return (
      <>
        {isYoutube && ytVideoId ? (
          <img 
            src={`https://img.youtube.com/vi/${ytVideoId}/hqdefault.jpg`} 
            alt={title || "Property Video"} 
            className={className}
            loading="lazy"
            onError={(e) => {
              e.target.src = fallbackSrc;
            }}
          />
        ) : (actualVideoUrl.includes('instagram.com') || actualVideoUrl.includes('embed')) ? (
          <img 
            src={fallbackSrc}
            alt={title || "Property Video"} 
            className={className}
            loading="lazy"
          />
        ) : (
          <video 
            src={actualVideoUrl}
            preload="none"
            poster={!isFallbackOrInvalid ? imageUrl : (generatedPoster || fallbackSrc)}
            className={className}
            muted
            loop
            playsInline
            onMouseEnter={(e) => {
              const target = e.target;
              target.play().catch(()=>{});
            }}
            onMouseLeave={(e) => { 
              e.target.pause(); 
              e.target.currentTime = !isFallbackOrInvalid ? 0 : 0.1; 
            }}
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-transparent transition-colors pointer-events-none">
          <div className={`${outerClasses} bg-white/90 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110`}>
            <div className={`w-0 h-0 border-t-transparent border-l-[#B0004F] border-b-transparent ${
              playButtonSize === 'large' ? 'border-t-8 border-l-[14px] border-b-8 ml-1' : 'border-t-[5px] border-l-[8px] border-b-[5px] ml-0.5'
            }`} />
          </div>
        </div>
      </>
    );
  }

  // Fallback
  return (
    <img 
      src={fallbackSrc}
      alt={title || "Property"} 
      className={className}
      loading="lazy"
    />
  );
}
