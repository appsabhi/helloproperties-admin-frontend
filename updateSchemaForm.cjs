const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src');

// Update SchemaForm.jsx
const schemaFormPath = path.join(baseDir, 'components', 'SchemaForm.jsx');
let schemaForm = fs.readFileSync(schemaFormPath, 'utf8');

// 1. Init Logic
schemaForm = schemaForm.replace(
  /if \(initVideo && typeof initVideo === 'string'\) \{\s*defaultData\.videoUrl = initVideo;\s*defaultData\.video = initVideo;\s*const extractedName = initVideo\.split\('\/'\)\.pop\(\)\.split\('\?'\)\[0\];\s*setVideoFileName\(\{ video: extractedName \}\);\s*setVideoPreviews\(\{ video: initVideo \}\);\s*\}/,
  `if (initVideo && typeof initVideo === 'string') {
      defaultData.videoUrl = initVideo;
      defaultData.video = initVideo;
      const vUrls = initVideo.split(',').filter(Boolean);
      const extractedName = vUrls.map(u => u.split('/').pop().split('?')[0]).join(', ');
      setVideoFileName({ video: extractedName });
      setVideoPreviews({ video: vUrls });
    }`
);

// 2. handleVideoSelect
const handleVideoSelectRegex = /const handleVideoSelect = async \(e, fieldId\) => \{[\s\S]*?const handleRemoveVideo =/m;
const newHandleVideoSelect = `const handleVideoSelect = async (e, fieldId) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    e.target.value = '';

    const allowedExtensions = ['mp4', 'webm', 'mov'];
    const MAX_50MB = 50 * 1024 * 1024;
    const validFiles = [];

    for (const file of files) {
      const fileName = file.name || '';
      const ext = fileName.split('.').pop().toLowerCase();
      const mimeType = file.type || '';
      const isAllowedFormat = allowedExtensions.includes(ext) ||
        mimeType === 'video/mp4' || mimeType === 'video/webm' ||
        mimeType === 'video/quicktime' || mimeType.includes('mov');
      
      if (!isAllowedFormat) {
        setVideoErrors(prev => ({ ...prev, [fieldId]: 'Unsupported video format. Please upload MP4, WebM, or MOV.' }));
        return;
      }
      if (file.size > MAX_50MB) {
        setVideoErrors(prev => ({ ...prev, [fieldId]: \`Video size exceeds the maximum allowed 50 MB limit.\` }));
        return;
      }
      validFiles.push(file);
    }

    setVideoErrors(prev => ({ ...prev, [fieldId]: null }));
    setVideoUploading(prev => ({ ...prev, [fieldId]: true }));
    setVideoFileName(prev => ({ 
      ...prev, 
      [fieldId]: prev[fieldId] ? prev[fieldId] + ', ' + validFiles.map(f => f.name).join(', ') : validFiles.map(f => f.name).join(', ') 
    }));

    const localPreviewUrls = validFiles.map(f => URL.createObjectURL(f));
    setVideoPreviews(prev => {
      const existing = prev[fieldId] ? (Array.isArray(prev[fieldId]) ? prev[fieldId] : [prev[fieldId]]) : [];
      return { ...prev, [fieldId]: [...existing, ...localPreviewUrls] };
    });

    try {
      const uploadFn = uploadVideoFile || (async () => ({ success: false, error: 'Upload service unavailable' }));
      const uploadedUrls = [];
      for (const file of validFiles) {
        const res = await uploadFn(file);
        if (res && res.success && res.videoUrl) {
          uploadedUrls.push(typeof res.videoUrl === 'string' ? res.videoUrl : '');
        } else {
          throw new Error((res && res.error) ? res.error : 'Video upload failed.');
        }
      }

      setVideoUploading(prev => ({ ...prev, [fieldId]: false }));

      setFormData(prev => {
        const existingStr = prev[fieldId] || prev.videoUrl || '';
        const existingUrls = typeof existingStr === 'string' ? existingStr.split(',').filter(Boolean) : [];
        const newUrlStr = [...existingUrls, ...uploadedUrls].join(',');
        
        setVideoPreviews(p => ({ ...p, [fieldId]: [...existingUrls, ...uploadedUrls] }));
        
        return {
          ...prev,
          [fieldId]: newUrlStr,
          videoUrl: newUrlStr,
          video: newUrlStr,
          videoFile: null
        };
      });
      if (errors[fieldId]) setErrors(prev => ({ ...prev, [fieldId]: null }));

    } catch (err) {
      setVideoUploading(prev => ({ ...prev, [fieldId]: false }));
      setVideoErrors(prev => ({ ...prev, [fieldId]: err.message || 'Network error during upload.' }));
    }
  };

  const handleRemoveVideo =`;
schemaForm = schemaForm.replace(handleVideoSelectRegex, newHandleVideoSelect);

// 3. handleRemoveVideo
const handleRemoveVideoRegex = /const handleRemoveVideo = \(fieldId\) => \{\s*setVideoPreviews[\s\S]*?\}\)\;\s*\};/m;
const newHandleRemoveVideo = `const handleRemoveVideo = (fieldId, indexToRemove = null) => {
    if (indexToRemove === null) {
      setVideoPreviews(prev => ({ ...prev, [fieldId]: null }));
      setVideoFileName(prev => ({ ...prev, [fieldId]: null }));
      setVideoErrors(prev => ({ ...prev, [fieldId]: null }));
      setVideoUploading(prev => ({ ...prev, [fieldId]: false }));
      setFormData(prev => ({
        ...prev,
        [fieldId]: null,
        videoUrl: null,
        video: null,
        videoFile: null
      }));
      return;
    }

    setVideoPreviews(prev => {
      const existing = prev[fieldId] ? (Array.isArray(prev[fieldId]) ? prev[fieldId] : [prev[fieldId]]) : [];
      const newPreviews = existing.filter((_, idx) => idx !== indexToRemove);
      return { ...prev, [fieldId]: newPreviews.length > 0 ? newPreviews : null };
    });
    
    setFormData(prev => {
      const existingStr = prev[fieldId] || prev.videoUrl || '';
      const existingUrls = typeof existingStr === 'string' ? existingStr.split(',').filter(Boolean) : [];
      const newUrls = existingUrls.filter((_, idx) => idx !== indexToRemove);
      const newUrlStr = newUrls.join(',');
      
      return {
        ...prev,
        [fieldId]: newUrlStr,
        videoUrl: newUrlStr,
        video: newUrlStr
      };
    });
  };`;
schemaForm = schemaForm.replace(handleRemoveVideoRegex, newHandleRemoveVideo);

// 4. Case B Rendering
const caseBRegex = /\/\* Case B: Video Preview \(Uploaded or Loaded from Edit\) \*\/[\s\S]*?\/\* Case C: File Selector Dropzone \+ Video Link Input \*\//m;
const newCaseB = `/* Case B: Video Preview (Uploaded or Loaded from Edit) */
                    ) : (videoPreviews[field.id] && Array.isArray(videoPreviews[field.id]) && videoPreviews[field.id].length > 0) || (typeof formData.videoUrl === 'string' && formData.videoUrl) || (typeof formData[field.id] === 'string' && formData[field.id]) ? (
                      <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(() => {
                          const currentVideoSrcStr = (videoPreviews[field.id] && Array.isArray(videoPreviews[field.id]) ? videoPreviews[field.id].join(',') : videoPreviews[field.id]) || formData.videoUrl || formData[field.id] || '';
                          const videoUrls = typeof currentVideoSrcStr === 'string' ? currentVideoSrcStr.split(',').filter(Boolean) : [];
                          
                          return videoUrls.map((currentVideoSrc, idx) => (
                            <div key={idx} className="flex flex-col gap-2">
                              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md">
                                {currentVideoSrc && (currentVideoSrc.includes('youtu') || currentVideoSrc.includes('embed') || currentVideoSrc.includes('instagram.com')) ? (
                                  <iframe
                                    src={currentVideoSrc.includes('instagram.com') ? (currentVideoSrc.split('?')[0].endsWith('/') ? currentVideoSrc.split('?')[0] + 'embed/' : currentVideoSrc.split('?')[0] + '/embed/') : currentVideoSrc.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                                    title={\`Video Preview \${idx+1}\`}
                                    className="w-full h-40 sm:h-48 rounded-2xl border-0"
                                    allowFullScreen
                                  />
                                ) : (
                                  <video
                                    src={currentVideoSrc}
                                    preload="none"
                                    controls
                                    className="w-full max-h-48 object-cover rounded-2xl"
                                  />
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVideo(field.id, idx)}
                                  className="absolute top-2 right-2 bg-black/80 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors cursor-pointer z-20"
                                  title="Remove Video"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ));
                        })()}
                        </div>
                        <label className="relative flex items-center gap-3 bg-[#F4F4F6] hover:bg-white border-2 border-dashed border-slate-200 hover:border-[#B0004F]/40 rounded-2xl px-4 py-3 transition-all cursor-pointer group mt-2">
                          <input
                            type="file"
                            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                            multiple
                            onChange={(e) => handleVideoSelect(e, field.id)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className="w-8 h-8 rounded-xl bg-[#B0004F]/10 group-hover:bg-[#B0004F] text-[#B0004F] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                            <Plus className="w-4 h-4" />
                          </div>
                          <span className="text-[13px] font-semibold text-slate-700 group-hover:text-[#B0004F] transition-colors">
                            Add Another Video
                          </span>
                        </label>
                      </div>
                    /* Case C: File Selector Dropzone + Video Link Input */`;
schemaForm = schemaForm.replace(caseBRegex, newCaseB);

// 5. Case C multiple
schemaForm = schemaForm.replace(/<input\s+type="file"\s+accept="video\/mp4,video\/webm,video\/quicktime,\.mp4,\.webm,\.mov"\s+onChange/g, '<input type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" multiple onChange');

fs.writeFileSync(schemaFormPath, schemaForm);
console.log('SchemaForm.jsx updated.');
