const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'pages', 'Properties.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. List View (Detail View) Lines 1664-1725
const listDetailRegex = /const vUrl = item\.videoUrl \|\| item\.video \|\| item\.video_url;[\s\S]*?\{\/\* Title & Financials \*\//m;

const newListDetail = `const vUrlStr = item.videoUrl || item.video || item.video_url;
                const vUrls = typeof vUrlStr === 'string' ? vUrlStr.split(',').filter(Boolean) : [];
                
                const isFallbackOrInvalid = !item.imageUrl || 
                                            item.imageUrl === 'null' || 
                                            item.imageUrl === 'undefined' || 
                                            String(item.imageUrl).trim() === '' || 
                                            (typeof item.imageUrl === 'string' && item.imageUrl.includes('images.unsplash.com'));
                
                const hasImage = !isFallbackOrInvalid;
                const hasVideo = vUrls.length > 0;

                return (
                  <>
                    {(hasImage || (!hasImage && !hasVideo)) && (
                      <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 w-full mx-auto" style={{ scrollbarWidth: 'thin' }}>
                        {(() => {
                          let imageUrls = [];
                          if (item.imageUrl && typeof item.imageUrl === 'string') {
                            imageUrls = item.imageUrl.split(',').map(u => u.trim()).filter(u => u);
                          } else if (item.imageUrl) {
                            imageUrls = [item.imageUrl];
                          }
                          if (imageUrls.length === 0) {
                            imageUrls = ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80'];
                          }
                          return imageUrls.map((url, idx) => (
                            <div key={'img-'+idx} className="h-64 w-64 sm:h-80 sm:w-80 shrink-0 snap-center rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md flex items-center justify-center">
                              <img 
                                src={url} 
                                alt={item.title || "Property"}
                                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                onError={(e) => {
                                  e.target.src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80';
                                }}
                              />
                            </div>
                          ));
                        })()}
                        {vUrls.map((vUrl, idx) => (
                          <div key={'vid-'+idx} className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md h-64 w-64 sm:h-80 sm:w-80 shrink-0 flex items-center justify-center">
                            {vUrl.includes('youtu') || vUrl.includes('embed') || vUrl.includes('instagram.com') ? (
                              <iframe
                                src={vUrl.includes('instagram.com') ? (vUrl.split('?')[0].endsWith('/') ? vUrl.split('?')[0] + 'embed/' : vUrl.split('?')[0] + '/embed/') : vUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                                title="Property Video"
                                className="w-full h-full border-0"
                                allowFullScreen
                              />
                            ) : (
                              <video
                                src={vUrl}
                                preload="none"
                                controls
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* Title & Financials */`;

content = content.replace(listDetailRegex, newListDetail);

// 2. Edit Property Form - Video URL input section
// Since changing it completely requires rewriting handleVideoFileChange in Properties.jsx
// let's update handleVideoFileChange to support multiple videos first.
const handleVideoFileChangeRegex = /const handleVideoFileChange = \(e\) => \{[\s\S]*?\}\;\s*\};/m;
const newHandleVideoFileChange = `const handleVideoFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const previewUrls = files.map(file => URL.createObjectURL(file));
      setEditPropForm(prev => {
        const existingStr = prev.videoUrl || prev.video || '';
        const existingUrls = existingStr ? existingStr.split(',').filter(Boolean) : [];
        const newUrlStr = [...existingUrls, ...previewUrls].join(',');
        return { 
          ...prev, 
          videoUrl: newUrlStr, 
          video: newUrlStr, 
          videoFiles: [...(prev.videoFiles || []), ...files] 
        };
      });
    }
  };`;
content = content.replace(handleVideoFileChangeRegex, newHandleVideoFileChange);

// Update Edit Form UI for videos
const editFormVideoRegex = /\{\/\* Video URL \/ Upload Video \*\/\}[\s\S]*?\/\* End of Video URL \/ Upload Video \*\//m;
// Let's use a simpler regex
const editFormVideoStart = `{/* Video URL / Upload Video */}`;
const editFormVideoEnd = `onChange={handleVideoFileChange}\n                            className="hidden"\n                          />\n                        </label>\n                      </div>\n                    </div>\n                  </div>\n                ) : (\n                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">\n                    <input\n                      type="text"\n                      value={editPropForm.videoUrl || editPropForm.video || ''}\n                      onChange={(e) => {\n                        setVideoLoadError(false);\n                        setEditPropForm({ ...editPropForm, videoUrl: e.target.value, video: e.target.value });\n                      }}\n                      placeholder="YouTube link or Video URL (https://...)"\n                      className="flex-1 px-4 h-[52px] border border-slate-200 rounded-[10px] text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F]"\n                    />\n                    <label className="h-[52px] px-4 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-[10px] text-xs font-semibold text-slate-700 flex items-center justify-center space-x-2 cursor-pointer transition-colors whitespace-nowrap shrink-0">\n                      <Upload className="w-4 h-4 text-slate-600" />\n                      <span>Upload Video</span>\n                      <input\n                        type="file"\n                        accept="video/*"\n                        onChange={handleVideoFileChange}\n                        className="hidden"\n                      />\n                    </label>\n                  </div>\n                )}\n              </div>`;

// Wait, let's just replace the whole div starting with `{/* Video URL / Upload Video */}` up to `</div>` before `{/* Location & Maps */}`
const editFormVideoSection = /\{\/\* Video URL \/ Upload Video \*\/\}[\s\S]*?(?=\{\/\* Location & Maps \*\/)/m;

const newEditFormVideoSection = `{/* Video URL / Upload Video */}
              <div className="flex flex-col space-y-2 mb-6">
                <div className="flex items-center justify-between">
                  <label className="text-[13.5px] font-semibold text-slate-800 flex items-center">
                    Video URLs (comma separated) / Upload Videos
                  </label>
                  {(editPropForm.videoUrl || editPropForm.video) && (
                    <button
                      type="button"
                      onClick={() => setEditPropForm(prev => ({ ...prev, videoUrl: '', video: '', videoFiles: [] }))}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove All Videos</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  {(() => {
                    const vUrlStr = editPropForm.videoUrl || editPropForm.video || '';
                    const vUrls = typeof vUrlStr === 'string' ? vUrlStr.split(',').filter(Boolean) : [];
                    return vUrls.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {vUrls.map((vUrl, idx) => (
                          <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex flex-col p-2">
                            <div className="relative w-full h-40 shrink-0 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shadow-xs flex items-center justify-center">
                              {vUrl.includes('youtu') || vUrl.includes('embed') || vUrl.includes('instagram.com') ? (
                                <iframe
                                  src={vUrl.includes('instagram.com') ? (vUrl.split('?')[0].endsWith('/') ? vUrl.split('?')[0] + 'embed/' : vUrl.split('?')[0] + '/embed/') : vUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                                  title="Video Preview"
                                  className="w-full h-full rounded-lg border-0"
                                  allowFullScreen
                                />
                              ) : (
                                <video
                                  src={vUrl}
                                  preload="none"
                                  controls
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditPropForm(prev => {
                                    const str = prev.videoUrl || prev.video || '';
                                    const urls = str.split(',').filter(Boolean);
                                    const newUrls = urls.filter((_, i) => i !== idx);
                                    return { ...prev, videoUrl: newUrls.join(','), video: newUrls.join(',') };
                                  });
                                }}
                                className="absolute top-2 right-2 bg-black/80 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors cursor-pointer z-20"
                                title="Remove Video"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input
                      type="text"
                      value={editPropForm.videoUrl || editPropForm.video || ''}
                      onChange={(e) => {
                        setEditPropForm({ ...editPropForm, videoUrl: e.target.value, video: e.target.value });
                      }}
                      placeholder="Multiple YouTube links or Video URLs separated by commas..."
                      className="flex-1 px-4 h-[52px] border border-slate-200 rounded-[10px] text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F]"
                    />
                    <label className="h-[52px] px-4 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-[10px] text-xs font-semibold text-slate-700 flex items-center justify-center space-x-2 cursor-pointer transition-colors whitespace-nowrap shrink-0">
                      <Upload className="w-4 h-4 text-slate-600" />
                      <span>Upload Videos</span>
                      <input
                        type="file"
                        accept="video/*"
                        multiple
                        onChange={handleVideoFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
              
              `;
content = content.replace(editFormVideoSection, newEditFormVideoSection);

// Update handleSaveEditProperty to upload videoFiles instead of single videoFile
const handleSaveEditPropertyVideoUploadRegex = /const videoFileObj = editPropForm\.videoFile;[\s\S]*?finalVideoUrl = editPropForm\.videoUrl \|\| '';\n\s*\}/m;
const newHandleSaveEditPropertyVideoUpload = `let finalVideoUrl = editPropForm.videoUrl || '';
      if (editPropForm.videoFiles && editPropForm.videoFiles.length > 0) {
        const uploadPromises = editPropForm.videoFiles.map(file => uploadVideoFile(file));
        const uploadedVideos = await Promise.all(uploadPromises);
        const validVideoUrls = uploadedVideos.filter(v => v).map(v => typeof v === 'string' ? v : v.videoUrl).filter(Boolean);
        
        let existingUrls = typeof finalVideoUrl === 'string' ? finalVideoUrl.split(',').filter(Boolean) : [];
        // Filter out blob urls
        existingUrls = existingUrls.filter(u => !u.startsWith('blob:'));
        finalVideoUrl = [...existingUrls, ...validVideoUrls].join(',');
      }`;
content = content.replace(handleSaveEditPropertyVideoUploadRegex, newHandleSaveEditPropertyVideoUpload);


fs.writeFileSync(file, content);
console.log('Properties.jsx updated.');
