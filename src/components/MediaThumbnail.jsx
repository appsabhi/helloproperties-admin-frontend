import React from 'react';

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
  const actualVideoUrl = videoUrl || video || video_url;

  if (imageUrl) {
    return (
      <img 
        src={imageUrl} 
        alt={title || "Property"} 
        className={className}
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
            onError={(e) => {
              e.target.src = fallbackSrc;
            }}
          />
        ) : (
          <video 
            src={actualVideoUrl}
            className={className}
            muted
            loop
            playsInline
            onMouseEnter={(e) => e.target.play().catch(()=>{})}
            onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
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
    />
  );
}
