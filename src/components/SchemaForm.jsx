import React, { useState, useEffect, useContext } from "react";
import { PropertyContext } from "../context/PropertyContext";
import { Loader2, ChevronDown, ImagePlus, X, Sparkles, Plus, Check, Video, Film, Link, AlertCircle } from "lucide-react";
import LocationSelector from "./LocationSelector";
import PropertyKeywordsSelector, { DESCRIPTION_KEYWORDS } from "./PropertyKeywordsSelector";

const DEFAULT_INITIAL_VALUES = {};

export default function SchemaForm({ schema, onSubmit, onCancel, submitLabel = "Submit", initialValues = DEFAULT_INITIAL_VALUES, onError }) {
  const { isApiLoading, uploadVideoFile } = useContext(PropertyContext) || {};
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [imagePreviews, setImagePreviews] = useState({});
  const [videoPreviews, setVideoPreviews] = useState({});
  const [videoUploading, setVideoUploading] = useState({});
  const [videoErrors, setVideoErrors] = useState({});
  const [videoFileName, setVideoFileName] = useState({});
  const [customKeywords, setCustomKeywords] = useState([]);
  const [newKeywordInput, setNewKeywordInput] = useState("");

  useEffect(() => {
    const defaultData = {};
    const initVideo = initialValues.videoUrl || initialValues.video || "";

    schema.forEach(field => {
      let val = initialValues[field.id] !== undefined
        ? initialValues[field.id]
        : (field.defaultValue !== undefined ? field.defaultValue : "");

      if (field.type === 'video') {
        val = initVideo || val;
      }
      defaultData[field.id] = val;

      if (field.hasUnit && field.unitId) {
        defaultData[field.unitId] = initialValues[field.unitId] !== undefined
          ? initialValues[field.unitId]
          : field.defaultUnit;
      }
    });
    if (initialValues.location) defaultData.location = initialValues.location;
    if (initialValues.preferredLocation) defaultData.preferredLocation = initialValues.preferredLocation;
    if (initialValues.district) defaultData.district = initialValues.district;
    if (initialValues.state) defaultData.state = initialValues.state;

    const initKeywords = Array.isArray(initialValues.keywords) ? initialValues.keywords : [];
    defaultData.keywords = initKeywords;

    if (initKeywords.length > 0 && (!defaultData.description || defaultData.description.trim() === '')) {
      defaultData.description = initKeywords.join(", ");
    }

    if (initVideo && typeof initVideo === 'string') {
      defaultData.videoUrl = initVideo;
      defaultData.video = initVideo;
      const extractedName = initVideo.split('/').pop().split('?')[0];
      setVideoFileName({ video: extractedName });
      setVideoPreviews({ video: initVideo });
    }

    setFormData(defaultData);
    setErrors({});
    if (initialValues.imageUrl) { setImagePreviews({ images: initialValues.imageUrl.split(',').filter(Boolean) }); } else { setImagePreviews({}); }
  }, [schema, initialValues]);

  const handleChange = (eOrFieldName, fieldIdOrValue) => {
    if (typeof eOrFieldName === "object" && eOrFieldName !== null && !eOrFieldName.target) {
      const batchObj = eOrFieldName;
      setFormData(prev => ({ ...prev, ...batchObj }));
      setErrors(prev => {
        const next = { ...prev };
        Object.keys(batchObj).forEach(k => { delete next[k]; });
        return next;
      });
      return;
    }
    if (typeof eOrFieldName === "string") {
      const key = eOrFieldName;
      const val = fieldIdOrValue;
      setFormData(prev => ({ ...prev, [key]: val }));
      if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
      return;
    }
    const { value } = eOrFieldName.target;
    const fieldId = fieldIdOrValue;
    setFormData(prev => {
      const next = { ...prev, [fieldId]: value };
      if (fieldId === "listingType") {
        if (value === "Sale") { next.monthlyRent = ""; next.securityDeposit = ""; }
        else if (value === "Rent") { next.expectedPrice = ""; }
      } else if (fieldId === "requirementType") {
        if (value === "Buy") { next.maximumMonthlyRent = ""; }
        else if (value === "Rent") { next.budget = ""; }
      } else if (fieldId === "areaUnit") {
        let cleanUnit = String(value).replace(/^\/\s*/, '').trim();
        next.expectedPriceUnit = `/ ${cleanUnit}`;
        next.monthlyRentUnit = `/ ${cleanUnit}`;
      } else if (fieldId === "requiredAreaUnit") {
        let cleanUnit = String(value).replace(/^\/\s*/, '').trim();
        next.budgetUnit = `/ ${cleanUnit}`;
        next.maximumMonthlyRentUnit = `/ ${cleanUnit}`;
      }
      return next;
    });
    if (errors[fieldId]) setErrors(prev => ({ ...prev, [fieldId]: null }));
  };

  const handleImageChange = (e, fieldId) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newPreviews = files.map(f => URL.createObjectURL(f));
      setImagePreviews(prev => {
        const existing = prev[fieldId] ? (Array.isArray(prev[fieldId]) ? prev[fieldId] : [prev[fieldId]]) : [];
        return { ...prev, [fieldId]: [...existing, ...newPreviews] };
      });
      setFormData(prev => {
        const existingFiles = prev.imageFiles || [];
        const existingUrlStr = prev.imageUrl || (prev[fieldId] && typeof prev[fieldId] === 'string' ? prev[fieldId] : '');
        const existingUrls = typeof existingUrlStr === 'string' ? existingUrlStr.split(',').filter(Boolean) : [];
        const newUrlStr = [...existingUrls, ...newPreviews].join(',');
        return { ...prev, [fieldId]: newUrlStr, imageFiles: [...existingFiles, ...files], imageUrl: newUrlStr };
      });
      if (errors[fieldId]) setErrors(prev => ({ ...prev, [fieldId]: null }));
    }
  };

  const handleRemoveImage = (fieldId, indexToRemove) => {
    setImagePreviews(prev => {
      const existing = prev[fieldId] ? (Array.isArray(prev[fieldId]) ? prev[fieldId] : [prev[fieldId]]) : [];
      const newPreviews = existing.filter((_, idx) => idx !== indexToRemove);
      return { ...prev, [fieldId]: newPreviews.length > 0 ? newPreviews : null };
    });
    setFormData(prev => {
      const existingFiles = prev.imageFiles || [];
      const existingUrlStr = prev.imageUrl || (prev[fieldId] && typeof prev[fieldId] === 'string' ? prev[fieldId] : '');
      const existingUrls = typeof existingUrlStr === 'string' ? existingUrlStr.split(',').filter(Boolean) : [];
      
      // We assume new files are appended at the end. We only keep files that are NOT being removed.
      // This is a simplified approach, but works for the current flow.
      const newUrls = existingUrls.filter((_, idx) => idx !== indexToRemove);
      const newUrlStr = newUrls.join(',');
      
      return { ...prev, [fieldId]: newUrlStr, imageUrl: newUrlStr };
    });
  };

  const handleVideoSelect = async (e, fieldId) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    e.target.value = '';

    const allowedExtensions = ['mp4', 'webm', 'mov'];
    const fileName = file.name || '';
    const ext = fileName.split('.').pop().toLowerCase();
    const mimeType = file.type || '';

    const isAllowedFormat = allowedExtensions.includes(ext) ||
      mimeType === 'video/mp4' ||
      mimeType === 'video/webm' ||
      mimeType === 'video/quicktime' ||
      mimeType.includes('mov');

    if (!isAllowedFormat) {
      setVideoErrors(prev => ({
        ...prev,
        [fieldId]: 'Unsupported video format. Please upload an MP4, WebM, or MOV video file.'
      }));
      return;
    }

    const MAX_50MB = 50 * 1024 * 1024;
    if (file.size > MAX_50MB) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setVideoErrors(prev => ({
        ...prev,
        [fieldId]: `Video size (${sizeMB} MB) exceeds the maximum allowed 50 MB limit.`
      }));
      return;
    }

    setVideoErrors(prev => ({ ...prev, [fieldId]: null }));
    setVideoUploading(prev => ({ ...prev, [fieldId]: true }));
    setVideoFileName(prev => ({ ...prev, [fieldId]: fileName }));

    const localPreviewUrl = URL.createObjectURL(file);
    setVideoPreviews(prev => ({ ...prev, [fieldId]: localPreviewUrl }));

    try {
      const uploadFn = uploadVideoFile || (async () => ({ success: false, error: 'Upload service unavailable' }));
      const res = await uploadFn(file);

      setVideoUploading(prev => ({ ...prev, [fieldId]: false }));

      if (res && res.success && res.videoUrl) {
        const returnedUrl = typeof res.videoUrl === 'string' ? res.videoUrl : '';
        setVideoPreviews(prev => ({ ...prev, [fieldId]: returnedUrl }));
        setFormData(prev => ({
          ...prev,
          [fieldId]: returnedUrl,
          videoUrl: returnedUrl,
          video: returnedUrl,
          videoFile: null
        }));
        if (errors[fieldId]) setErrors(prev => ({ ...prev, [fieldId]: null }));
      } else {
        const errorMsg = (res && res.error) ? res.error : 'Video upload failed. Please try again.';
        setVideoErrors(prev => ({ ...prev, [fieldId]: errorMsg }));
      }
    } catch (err) {
      setVideoUploading(prev => ({ ...prev, [fieldId]: false }));
      setVideoErrors(prev => ({ ...prev, [fieldId]: err.message || 'Network error during upload.' }));
    }
  };

  const handleRemoveVideo = (fieldId) => {
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
  };

  const toggleKeyword = (keyword) => {
    if (!keyword || typeof keyword !== 'string') return;
    const trimmed = keyword.trim();
    if (!trimmed) return;

    const currentKeywords = Array.isArray(formData.keywords) ? formData.keywords : [];
    const lowerTarget = trimmed.toLowerCase();

    const exists = currentKeywords.some(k => k.toLowerCase() === lowerTarget);
    let nextKeywords = [];

    if (exists) {
      nextKeywords = currentKeywords.filter(k => k.toLowerCase() !== lowerTarget);
    } else {
      nextKeywords = [...currentKeywords, trimmed];
    }

    const nextDescription = nextKeywords.join(", ");

    setFormData(prev => ({
      ...prev,
      keywords: nextKeywords,
      description: nextDescription
    }));

    if (errors.description) {
      setErrors(prev => ({ ...prev, description: null }));
    }
  };

  const handleAddCustomKeyword = () => {
    const trimmed = newKeywordInput.trim();
    if (!trimmed) return;

    if (!customKeywords.some(k => k.toLowerCase() === trimmed.toLowerCase())) {
      setCustomKeywords(prev => [...prev, trimmed]);
    }

    const currentKeywords = Array.isArray(formData.keywords) ? formData.keywords : [];
    if (!currentKeywords.some(k => k.toLowerCase() === trimmed.toLowerCase())) {
      toggleKeyword(trimmed);
    }

    setNewKeywordInput("");
  };

  const handleAutoGenerateDescription = (fieldId) => {
    const pType = formData.propertyType || "Property";
    const listingType = formData.listingType || (formData.requirementType ? (formData.requirementType === 'Buy' ? 'Purchase' : 'Rent') : 'Sale');
    const loc = formData.location || formData.preferredLocation || "";
    const dist = formData.district || "";
    const area = formData.area || formData.requiredArea || "";
    const areaUnit = formData.areaUnit || formData.requiredAreaUnit || "Cent";
    const price = formData.expectedPrice || formData.monthlyRent || formData.budget || formData.maximumMonthlyRent || "";
    const priceUnit = formData.expectedPriceUnit || formData.monthlyRentUnit || formData.budgetUnit || formData.maximumMonthlyRentUnit || "";
    const title = formData.title || formData.requirementTitle || "";

    let parts = [];
    if (title) {
      parts.push(`${title}.`);
    } else {
      parts.push(`${pType} available for ${listingType}.`);
    }

    if (loc || dist) {
      parts.push(`Located at ${[loc, dist].filter(Boolean).join(", ")}.`);
    }

    if (area) {
      parts.push(`Total Area: ${area} ${areaUnit}.`);
    }

    if (price) {
      parts.push(`Price / Budget: ₹${price} ${priceUnit}.`);
    }

    const currentVal = formData[fieldId] || "";
    const matchedKeywords = DESCRIPTION_KEYWORDS.filter(kw =>
      currentVal.toLowerCase().includes(kw.toLowerCase())
    );

    if (matchedKeywords.length > 0) {
      parts.push(`Key Features: ${matchedKeywords.join(", ")}.`);
    } else {
      parts.push("Features clear title deed, excellent frontage, and good connectivity.");
    }

    const generated = parts.join(" ");
    handleChange(fieldId, generated);
  };

  const validate = () => {
    const newErrors = {};
    schema.forEach(field => {
      if (field.showIf && !field.showIf(formData)) return;
      if (field.type === "location_selector") {
        const locName = field.locationFieldName || "location";
        const hasLocValue = formData[locName] && String(formData[locName]).trim().length > 0;
        
        if (!hasLocValue) newErrors[locName] = "Locality / Area is required.";
        
        if (!(field.allowMultiple && hasLocValue)) {
          if (!formData.district || !String(formData.district).trim()) newErrors.district = "District is required.";
          if (!formData.state || !String(formData.state).trim()) newErrors.state = "State / UT is required.";
        }
        return;
      }
      const val = formData[field.id];
      if (field.required && (val === undefined || val === null || val === "")) {
        newErrors[field.id] = `${field.label} is required.`;
      }
      if (field.type === "number" && val !== undefined && val !== null && val !== "") {
        const num = Number(val);
        if (isNaN(num) || num < 0) newErrors[field.id] = "Value must be a valid positive number.";
      }
      if (field.type === "tel" && val) {
        const phoneDigits = String(val).replace(/\D/g, "");
        if (phoneDigits.length < 10) newErrors[field.id] = "Enter a valid telephone number (min 10 digits).";
      }
    });
    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
    } else {
      if (onError) {
        onError("Please fill in all required fields correctly.");
      }
      const firstErrorKey = Object.keys(newErrors)[0];
      if (firstErrorKey) {
        const element = document.getElementById(`field-${firstErrorKey}`);
        if (element) element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const getSectionHeader = (fieldId) => {
    if (fieldId === "title" || fieldId === "listingType") return "Property Information";
    if (fieldId === "requirementType") return "Requirement Information";
    if (fieldId === "area") return "Specifications & Pricing";
    if (fieldId === "requiredArea") return "Specifications & Budget";
    if (fieldId === "ownerName") return "Owner & Contact";
    if (fieldId === "buyerName") return "Buyer & Contact";
    if (fieldId === "images" || fieldId === "video") return "Photos & Video";
    return null;
  };

  // Shared filled-input base — floating label style, minimal focus
  const inputBase = (hasError) =>
    `w-full px-4 pt-6 pb-2 rounded-xl text-[13.5px] text-slate-800 bg-[#F4F4F6] border-b focus:outline-none transition-colors duration-150 ${
      hasError ? 'border-red-400' : 'border-transparent focus:border-slate-300'
    }`;

  // Shared floating label classes (for text/textarea — uses peer)
  const floatLabel = `absolute left-4 top-4 text-[13px] text-slate-400 pointer-events-none transition-all duration-200
    peer-placeholder-shown:top-4 peer-placeholder-shown:text-[13px] peer-placeholder-shown:text-slate-400
    peer-focus:top-2 peer-focus:text-[10.5px] peer-focus:text-[#B0004F] peer-focus:font-semibold
    peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-[10.5px] peer-[:not(:placeholder-shown)]:text-slate-400 peer-[:not(:placeholder-shown)]:font-semibold`;

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
        {schema.map((field) => {
          if (field.showIf && !field.showIf(formData)) return null;

          const sectionHeader = getSectionHeader(field.id);
          const hasError = !!errors[field.id];

          if (field.type === "location_selector") {
            return (
              <React.Fragment key={field.id}>
                <LocationSelector
                  formData={formData}
                  onChange={handleChange}
                  errors={errors}
                  locationFieldName={field.locationFieldName || "location"}
                  allowMultiple={field.allowMultiple}
                />
              </React.Fragment>
            );
          }

          const isFullWidth =
            field.type === "textarea" ||
            field.type === "image" ||
            field.type === "video" ||
            field.id === "title" ||
            field.id === "requirementTitle" ||
            field.id === "description" ||
            field.id === "ownerAddress" ||
            field.id === "buyerAddress";

          return (
            <React.Fragment key={field.id}>
              {/* Section header */}
              {sectionHeader && (
                <div className="sm:col-span-2 flex items-center gap-3 mt-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#B0004F]/50 whitespace-nowrap">
                    {sectionHeader}
                  </span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>
              )}

              <div
                id={`field-${field.id}`}
                className={`flex flex-col gap-1 ${isFullWidth ? "sm:col-span-2" : ""}`}
              >
                {/* Textarea — with Auto Fill & Quick Keyword Chips */}
                {field.type === "textarea" ? (
                  <div className="flex flex-col gap-2">
                    <div className="relative">
                      <textarea
                        id={`input-${field.id}`}
                        value={formData[field.id] || ""}
                        onChange={(e) => handleChange(e, field.id)}
                        placeholder=" "
                        rows={4}
                        className={`${inputBase(hasError)} resize-none peer`}
                      />
                      <label htmlFor={`input-${field.id}`} className={floatLabel}>
                        {field.label}{field.required && <span className="text-[#B0004F] ml-0.5">*</span>}
                      </label>
                    </div>

                    {/* Quick Property Keywords */}
                    {field.id === "description" && (
                      <PropertyKeywordsSelector
                        keywords={formData.keywords}
                        description={formData.description}
                        onChange={({ keywords, description }) => {
                          setFormData(prev => ({
                            ...prev,
                            keywords,
                            description
                          }));
                          if (errors.description) {
                            setErrors(prev => ({ ...prev, description: null }));
                          }
                        }}
                      />
                    )}
                  </div>

                ) : field.type === "rating_bar" ? (
                  (() => {
                    const selectedOpt = formData[field.id] || "";
                    let fillWidth = "0%";
                    let fillColor = "bg-slate-200";
                    let currentLabel = "";
                    let labelColor = "text-slate-400";

                    // Map values to password-strength style: Mild (Weak/Red) -> Cold (Medium/Yellow) -> Hot (Strong/Green)
                    if (selectedOpt.toLowerCase().includes("mild")) {
                      fillWidth = "33.33%";
                      fillColor = "bg-red-500";
                      currentLabel = "mild";
                      labelColor = "text-red-500";
                    } else if (selectedOpt.toLowerCase().includes("cold")) {
                      fillWidth = "66.66%";
                      fillColor = "bg-amber-400";
                      currentLabel = "cold";
                      labelColor = "text-amber-500";
                    } else if (selectedOpt.toLowerCase().includes("hot")) {
                      fillWidth = "100%";
                      fillColor = "bg-green-500";
                      currentLabel = "hot";
                      labelColor = "text-green-500";
                    }

                    // Order: Mild -> Cold -> Hot for the click zones
                    const orderedOptions = [...field.options].sort((a, b) => {
                      const getVal = (s) => s.toLowerCase().includes('mild') ? 1 : s.toLowerCase().includes('cold') ? 2 : 3;
                      return getVal(a) - getVal(b);
                    });

                    let thumbBorder = "border-slate-300";
                    if (selectedOpt.toLowerCase().includes("mild")) thumbBorder = "border-red-500";
                    else if (selectedOpt.toLowerCase().includes("cold")) thumbBorder = "border-amber-400";
                    else if (selectedOpt.toLowerCase().includes("hot")) thumbBorder = "border-green-500";

                    return (
                      <div className={`relative ${inputBase(hasError)} flex flex-col justify-end overflow-visible pb-2 pt-6`}>
                        <label className="absolute left-4 top-2 text-[10.5px] text-slate-400 font-semibold pointer-events-none">
                          {field.label}{field.required && <span className="text-[#B0004F] ml-0.5">*</span>}
                        </label>

                        <div className="w-full flex items-center gap-4 mt-2 mb-1">
                          {/* The Editable Slider Bar */}
                          <div className="relative flex-1 h-[6px] bg-slate-200 rounded-full flex items-center group cursor-pointer">
                             {/* Fill layer */}
                             <div className={`absolute top-0 left-0 h-full transition-all duration-300 rounded-full ${fillColor}`} style={{ width: fillWidth }}></div>
                             
                             {/* Slider Thumb (makes it look editable) */}
                             {fillWidth !== "0%" && (
                               <div 
                                 className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.3)] border-2 transition-all duration-300 pointer-events-none group-hover:scale-125 ${thumbBorder}`} 
                                 style={{ left: `calc(${fillWidth} - ${fillWidth === '100%' ? '14px' : '7px'})` }}
                               ></div>
                             )}
                             
                             {/* Invisible Click Zones */}
                             <div className="absolute inset-0 flex w-full h-full rounded-full overflow-hidden">
                               {orderedOptions.map(opt => (
                                 <button 
                                   type="button"
                                   key={opt}
                                   className="flex-1 h-full z-10 focus:outline-none hover:bg-black/5 transition-colors cursor-pointer"
                                   onClick={() => handleChange(field.id, opt)}
                                   title={opt}
                                 ></button>
                               ))}
                             </div>
                          </div>
                          
                          {/* The Status Label */}
                          <div className={`w-10 text-right text-[12px] font-bold tracking-wide transition-colors duration-300 ${labelColor}`}>
                            {currentLabel}
                          </div>
                        </div>
                      </div>
                    );
                  })()

                ) : field.type === "select" ? (
                  /* Select — controlled label position */
                  <div className="relative">
                    <select
                      id={`input-${field.id}`}
                      value={formData[field.id] || ""}
                      onChange={(e) => handleChange(e, field.id)}
                      className={`${inputBase(hasError)} appearance-none pr-9 cursor-pointer`}
                    >
                      <option value=""></option>
                      {field.options && field.options.map(opt => (
                          <option key={typeof opt === 'object' ? opt.value : opt} value={typeof opt === 'object' ? opt.value : opt}>
                            {typeof opt === 'object' ? opt.label : opt}
                          </option>
                        ))}
                    </select>
                    <label
                      htmlFor={`input-${field.id}`}
                      className={`absolute left-4 pointer-events-none transition-all duration-200 ${
                        formData[field.id]
                          ? "top-2 text-[10.5px] text-slate-400 font-semibold"
                          : "top-4 text-[13px] text-slate-400"
                      }`}
                    >
                      {field.label}{field.required && <span className="text-[#B0004F] ml-0.5">*</span>}
                    </label>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                ) : field.type === "image" ? (
                  /* Image upload */
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-400 px-0.5">
                      {field.label}{field.required && <span className="text-[#B0004F] ml-0.5">*</span>}
                    </span>
                    <div className="flex items-center gap-3">
                      <label className="flex-1 relative flex items-center gap-3 bg-[#F4F4F6] hover:bg-white border-2 border-dashed border-slate-200 hover:border-[#B0004F]/30 rounded-xl px-4 py-3.5 transition-all cursor-pointer group">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleImageChange(e, field.id)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <ImagePlus className="w-4 h-4 text-slate-400 group-hover:text-[#B0004F] transition-colors flex-shrink-0" />
                        <div>
                          <span className="block text-[13px] font-medium text-slate-500 group-hover:text-slate-700">
                            Click to upload
                          </span>
                          <span className="text-[11px] text-slate-400">PNG, JPG or WEBP · Max 5 MB</span>
                        </div>
                      </label>
                      {imagePreviews[field.id] && Array.isArray(imagePreviews[field.id]) && imagePreviews[field.id].length > 0 && (
                        <div className="flex gap-2 flex-wrap max-w-full z-20">
                          {imagePreviews[field.id].map((previewUrl, idx) => (
                            <div key={idx} className="relative w-[54px] h-[54px] flex-shrink-0 rounded-xl overflow-hidden ring-1 ring-slate-200">
                              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); handleRemoveImage(field.id, idx); }}
                                className="absolute top-0.5 right-0.5 bg-white/90 hover:bg-red-500 hover:text-white text-slate-500 rounded-full p-0.5 shadow transition-colors cursor-pointer z-30"
                                title="Remove"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                ) : field.type === "video" ? (
                  /* Video upload & Link UI */
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-500 px-0.5">
                        {field.label}{field.required && <span className="text-[#B0004F] ml-0.5">*</span>}
                      </span>
                      <span className="text-[10.5px] text-slate-400">
                        MP4, WebM or MOV · Max 50 MB
                      </span>
                    </div>

                    {/* Case A: Uploading State */}
                    {videoUploading[field.id] ? (
                      <div className="flex flex-col items-center justify-center p-6 bg-[#F8F9FA] rounded-2xl border-2 border-dashed border-[#B0004F]/40 animate-pulse">
                        <Loader2 className="w-6 h-6 text-[#B0004F] animate-spin mb-2" />
                        <span className="text-xs font-semibold text-slate-700">Uploading Video to Server...</span>
                        {videoFileName[field.id] && (
                          <span className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">{videoFileName[field.id]}</span>
                        )}
                      </div>

                    /* Case B: Video Preview (Uploaded or Loaded from Edit) */
                    ) : (videoPreviews[field.id] || (formData.videoUrl && typeof formData.videoUrl === 'string') || (formData[field.id] && typeof formData[field.id] === 'string')) ? (
                      <div className="flex flex-col gap-2">
                        <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md">
                          {(() => {
                            const currentVideoSrc = videoPreviews[field.id] || formData.videoUrl || (typeof formData[field.id] === 'string' ? formData[field.id] : '');

                            if (currentVideoSrc && (currentVideoSrc.includes('youtu') || currentVideoSrc.includes('embed'))) {
                              return (
                                <iframe
                                  src={currentVideoSrc.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                                  title="Video Preview"
                                  className="w-full h-48 sm:h-56 rounded-2xl border-0"
                                  allowFullScreen
                                />
                              );
                            }

                            return (
                              <video
                                src={currentVideoSrc}
                                controls
                                className="w-full max-h-56 object-cover rounded-2xl"
                              />
                            );
                          })()}

                          <button
                            type="button"
                            onClick={() => handleRemoveVideo(field.id)}
                            className="absolute top-3 right-3 bg-black/80 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors cursor-pointer z-20"
                            title="Remove Video"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* File Details & Action Controls */}
                        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/70">
                          <div className="flex items-center gap-2 min-w-0">
                            <Film className="w-4 h-4 text-[#B0004F] shrink-0" />
                            <span className="text-xs font-medium text-slate-700 truncate">
                              {videoFileName[field.id] || (formData.videoUrl ? formData.videoUrl.split('/').pop().split('?')[0] : 'Uploaded Video')}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0 border border-emerald-200">
                              <Check className="w-3 h-3 text-emerald-600" />
                              Ready
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <label className="text-xs font-semibold text-[#B0004F] hover:text-[#88003d] hover:underline cursor-pointer">
                              Replace
                              <input
                                type="file"
                                accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                                onChange={(e) => handleVideoSelect(e, field.id)}
                                className="hidden"
                              />
                            </label>
                            <span className="text-slate-300">|</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveVideo(field.id)}
                              className="text-xs font-semibold text-red-500 hover:text-red-700 hover:underline cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>

                    /* Case C: File Selector Dropzone + Video Link Input */
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="relative flex items-center gap-3 bg-[#F4F4F6] hover:bg-white border-2 border-dashed border-slate-200 hover:border-[#B0004F]/40 rounded-2xl px-4 py-3.5 transition-all cursor-pointer group">
                          <input
                            type="file"
                            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                            onChange={(e) => handleVideoSelect(e, field.id)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className="w-9 h-9 rounded-xl bg-[#B0004F]/10 group-hover:bg-[#B0004F] text-[#B0004F] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                            <Video className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block text-[13px] font-semibold text-slate-700 group-hover:text-[#B0004F] transition-colors">
                              Click to select video
                            </span>
                            <span className="block text-[11px] text-slate-400">MP4, WebM or MOV · Max 50 MB</span>
                          </div>
                        </label>

                        <div className="relative flex items-center bg-[#F4F4F6] hover:bg-white rounded-2xl border border-slate-200/80 focus-within:border-[#B0004F] transition-colors px-3 py-3">
                          <Link className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                          <input
                            type="url"
                            placeholder="Or paste Video / YouTube URL..."
                            value={typeof formData[field.id] === 'string' ? formData[field.id] : (formData.videoUrl || '')}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData(prev => ({
                                ...prev,
                                [field.id]: val || null,
                                videoUrl: val || null,
                                video: val || null
                              }));
                              if (errors[field.id]) setErrors(prev => ({ ...prev, [field.id]: null }));
                              if (val) {
                                setVideoPreviews(prev => ({ ...prev, [field.id]: val }));
                              }
                            }}
                            className="w-full bg-transparent text-[12.5px] text-slate-800 placeholder-slate-400 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* Video Error Banner */}
                    {videoErrors[field.id] && (
                      <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                        <span className="flex-1">{videoErrors[field.id]}</span>
                      </div>
                    )}
                  </div>

                ) : field.hasUnit ? (
                  /* Input with integrated right-aligned unit selector */
                  (() => {
                    const rawAreaUnit = formData.areaUnit || formData.requiredAreaUnit || 'Cent';
                    let cleanAreaUnit = String(rawAreaUnit).replace(/^\/\s*/, '').trim();

                    let unitOptionsList = field.unitOptions || [];

                    if (field.isPricePerArea) {
                      const allAreaUnits = ['Cent', 'Sq. Ft.', 'Acre', 'Month', 'BHK', 'House', 'Sq. Meter', 'Sq. Yard'];
                      const perAreaOpts = allAreaUnits.map(u => `/ ${u}`);
                      let autoOpt = `/ ${cleanAreaUnit}`;
                      if (field.id === 'monthlyRent' || field.id === 'maximumMonthlyRent') {
                        autoOpt = '/ Month';
                      }

                      const uniqueOpts = new Set([autoOpt, ...perAreaOpts, 'All Properties']);
                      unitOptionsList = Array.from(uniqueOpts);
                    }

                    const defaultVal = field.isPricePerArea
                      ? (field.id.toLowerCase().includes('rent') ? '/ Month' : `/ ${cleanAreaUnit}`)
                      : field.defaultUnit;
                    const selectedValue = formData[field.unitId] || defaultVal;

                    return (
                      <div className="relative">
                        <div className={`relative flex items-center bg-[#F4F4F6] rounded-xl border-b transition-colors duration-150 ${
                          hasError ? 'border-red-400' : 'border-transparent focus-within:border-slate-300'
                        }`}>
                          <div className="relative flex-1 min-w-0">
                            <input
                              id={`input-${field.id}`}
                              type={field.type === "number" ? "number" : "text"}
                              step={field.type === "number" ? "any" : undefined}
                              value={formData[field.id] || ""}
                              onChange={(e) => handleChange(e, field.id)}
                              onWheel={(e) => field.type === "number" && e.target.blur()}
                              placeholder=" "
                              className="w-full px-4 pt-6 pb-2 rounded-l-xl text-[13.5px] text-slate-800 bg-transparent focus:outline-none peer pr-2"
                            />
                            <label htmlFor={`input-${field.id}`} className={floatLabel}>
                              {field.label}{field.required && <span className="text-[#B0004F] ml-0.5">*</span>}
                            </label>
                          </div>

                          {/* Subtle Vertical Divider */}
                          <div className="h-7 w-px bg-slate-200/80 shrink-0" />

                          {/* Unit Selector Dropdown */}
                          <div className="relative shrink-0 h-full flex items-center w-[115px] sm:w-[130px]">
                            <select
                              id={`input-${field.unitId}`}
                              value={selectedValue}
                              onChange={(e) => handleChange(e, field.unitId)}
                              className="w-full h-full pl-3 pr-7 py-3 text-[12.5px] font-medium text-slate-700 bg-transparent appearance-none focus:outline-none cursor-pointer truncate"
                            >
                              {unitOptionsList.map((unit) => (
                                <option key={unit} value={unit}>
                                  {unit}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    );
                  })()

                ) : (
                  /* Text / number / tel — floating label */
                  <div className="relative">
                    <input
                      id={`input-${field.id}`}
                      type={field.type}
                      value={formData[field.id] || ""}
                      onChange={(e) => handleChange(e, field.id)}
                      onWheel={(e) => field.type === "number" && e.target.blur()}
                      placeholder=" "
                      className={`${inputBase(hasError)} peer`}
                    />
                    <label htmlFor={`input-${field.id}`} className={floatLabel}>
                      {field.label}{field.required && <span className="text-[#B0004F] ml-0.5">*</span>}
                    </label>
                  </div>
                )}

                {hasError && (
                  <span className="text-[11px] text-red-500 px-1">{errors[field.id]}</span>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-7 mt-5 border-t border-slate-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="h-9 px-5 text-[12.5px] font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isApiLoading}
          className={`h-10 px-8 text-[13px] font-semibold text-white bg-[#B0004F] hover:bg-[#9A0044] rounded-full shadow-sm hover:shadow-md transition-all flex items-center gap-2 ${
            isApiLoading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          {isApiLoading && <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />}
          <span>{submitLabel}</span>
        </button>
      </div>
    </form>
  );
}
