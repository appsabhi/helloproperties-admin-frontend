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
  const [isInteracted, setIsInteracted] = useState(false);
  
  const rawVideoUrl = videoUrl || video || video_url;
  const actualVideoUrl = typeof rawVideoUrl === 'string' ? rawVideoUrl.split(',')[0] : rawVideoUrl;
  const isFallbackOrInvalid = !imageUrl || 
                              imageUrl === 'null' || 
                              imageUrl === 'undefined' || 
                              String(imageUrl).trim() === '' || 
                              (typeof imageUrl === 'string' && imageUrl.includes('images.unsplash.com'));

  if (!actualVideoUrl) {
    return (
      <img 
        src={!isFallbackOrInvalid ? imageUrl : fallbackSrc} 
        alt={title || "Property"} 
        className={className}
        loading="lazy"
        decoding="async"
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
            decoding="async"
            onError={(e) => {
              if (e.target.src.includes('hqdefault.jpg')) {
                e.target.src = `https://img.youtube.com/vi/${ytVideoId}/mqdefault.jpg`;
              } else if (e.target.src.includes('mqdefault.jpg')) {
                e.target.src = `https://img.youtube.com/vi/${ytVideoId}/default.jpg`;
              } else {
                e.target.style.display = 'none';
              }
            }}
          />
        ) : (actualVideoUrl.includes('instagram.com') || actualVideoUrl.includes('embed')) ? (
          <iframe 
            src={actualVideoUrl.includes('instagram.com') ? (actualVideoUrl.split('?')[0].endsWith('/') ? actualVideoUrl.split('?')[0] + 'embed/' : actualVideoUrl.split('?')[0] + '/embed/') : actualVideoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
            title="Property Video" 
            className={`${className} pointer-events-none border-0`}
            allowFullScreen
          />
        ) : (
          <div 
            className="w-full h-full relative"
            onMouseEnter={() => setIsInteracted(true)}
            onTouchStart={() => setIsInteracted(true)}
          >
            {isInteracted ? (
              <video 
                src={actualVideoUrl}
                preload="none"
                poster={!isFallbackOrInvalid ? imageUrl : fallbackSrc}
                className={className}
                muted
                loop
                playsInline
                autoPlay
                onMouseLeave={(e) => { 
                  e.target.pause(); 
                  e.target.currentTime = 0; 
                }}
              />
            ) : !isFallbackOrInvalid ? (
              <img 
                src={imageUrl}
                alt={title || "Video Placeholder"}
                className={className}
                loading="lazy"
                decoding="async"
                onError={(e) => { e.target.src = fallbackSrc; }}
              />
            ) : (
              <video 
                src={`${actualVideoUrl}#t=0.1`}
                className={className}
                preload="metadata"
                muted
                playsInline
              />
            )}
          </div>
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
      decoding="async"
    />
  );
}
