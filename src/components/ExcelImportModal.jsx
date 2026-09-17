import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Trash2, 
  Layers, 
  HelpCircle,
  FileText,
  Building2,
  Users,
  Eye,
  Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { usePropertyContext } from '../context/PropertyContext';
import Modal from './Modal';

export default function ExcelImportModal({ isOpen, onClose, onImportComplete }) {
  const { bulkAddItems, importHistory, revertImportBatch } = usePropertyContext();

  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'history'
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedData, setParsedData] = useState(null); // { properties: [], requirements: [], rawRows: [] }
  const [parseError, setParseError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [revertConfirmBatchId, setRevertConfirmBatchId] = useState(null);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // ═══════════════════════════════════════════════════════════════════════════
  // SAMPLE TEMPLATE GENERATOR
  // ═══════════════════════════════════════════════════════════════════════════
  const downloadSampleTemplate = () => {
    const sampleRows = [
      {
        Category: 'Property',
        Type: 'Sale',
        PropertyType: 'Plot/Land',
        Title: '2 Acre Farmland near Main Road',
        District: 'Kozhikode',
        Location: 'Thondayad',
        Area: '2 Acres',
        Price_or_Budget: 4500000,
        MonthlyRent: '',
        ContactName: 'Ramesh Krishnan',
        PhoneNumber: '9876543210',
        Description: 'Clear title, road frontage with electricity connection'
      },
      {
        Category: 'Property',
        Type: 'Rent',
        PropertyType: 'House/Villa',
        Title: '3 BHK Furnished Villa for Rent',
        District: 'Ernakulam',
        Location: 'Kakkanad',
        Area: '2200 sq ft',
        Price_or_Budget: '',
        MonthlyRent: 35000,
        ContactName: 'Anil Kumar',
        PhoneNumber: '9847012345',
        Description: 'Gated community with 24/7 security & power backup'
      },
      {
        Category: 'Requirement',
        Type: 'Buy',
        PropertyType: 'Commercial Plot',
        Title: 'Warehouse / Showroom Plot Requirement',
        District: 'Thrissur',
        Location: 'Puzhakkal',
        Area: 'Min 5000 sq ft',
        Price_or_Budget: 12000000,
        MonthlyRent: '',
        ContactName: 'Suresh Nair',
        PhoneNumber: '9123456789',
        Description: 'Requires highway access for container trucks'
      },
      {
        Category: 'Requirement',
        Type: 'Rent',
        PropertyType: 'House/Villa',
        Title: 'Looking for 2-3 BHK Villa on Rent',
        District: 'Thiruvananthapuram',
        Location: 'Kazhakkoottam',
        Area: '1500 sq ft',
        Price_or_Budget: '',
        MonthlyRent: 25000,
        ContactName: 'Meera Menon',
        PhoneNumber: '9988776655',
        Description: 'Close to Technopark Campus'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);

    // Set column widths for readability
    worksheet['!cols'] = [
      { wch: 12 }, { wch: 8 }, { wch: 18 }, { wch: 35 }, { wch: 18 },
      { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 20 },
      { wch: 14 }, { wch: 45 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'HelloProperties_Data');
    XLSX.writeFile(workbook, 'HelloProperties_Import_Template.xlsx');
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // EXCEL PARSER ENGINE — Flexible Header Alias Mapping
  // ═══════════════════════════════════════════════════════════════════════════
  const normalizeKey = (k) => String(k || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const parseExcelFile = (file) => {
    setIsProcessing(true);
    setParseError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!jsonRows || jsonRows.length === 0) {
          setParseError('The uploaded Excel sheet contains no rows of data.');
          setIsProcessing(false);
          return;
        }

        const propertiesToImport = [];
        const requirementsToImport = [];

        jsonRows.forEach((row, idx) => {
          // Build normalized dictionary for flexible column matching
          const map = {};
          Object.keys(row).forEach(key => {
            map[normalizeKey(key)] = row[key];
          });

          const categoryVal = String(map['category'] || map['recordtype'] || map['type'] || '').toLowerCase();
          const listingTypeVal = String(map['listingtype'] || map['type'] || map['requirementtype'] || 'Sale').trim();
          const propertyTypeVal = String(map['propertytype'] || map['type'] || map['category'] || 'Plot/Land').trim();

          const isRequirement = 
            categoryVal.includes('require') || 
            categoryVal.includes('buy') || 
            categoryVal.includes('customer') ||
            listingTypeVal.toLowerCase() === 'buy' ||
            Boolean(map['buyername'] || map['buyerphone'] || map['requiredarea']);

          const isRent = listingTypeVal.toLowerCase().includes('rent');

          const title = String(map['title'] || map['propertytitle'] || map['requirementtitle'] || map['name'] || `Imported Item ${idx + 1}`).trim();
          const district = String(map['district'] || map['city'] || map['state'] || '').trim();
          const location = String(map['location'] || map['locality'] || map['preferredlocation'] || '').trim();
          const area = String(map['area'] || map['requiredarea'] || map['size'] || '').trim();
          const price = Number(map['priceorbudget'] || map['expectedprice'] || map['price'] || map['budget'] || map['maxrent'] || map['monthlyrent'] || 0);
          const contactName = String(map['contactname'] || map['ownername'] || map['buyername'] || map['name'] || '').trim();
          const phone = String(map['phonenumber'] || map['phone'] || map['mobile'] || map['contact'] || map['ownerphone'] || map['buyerphone'] || '').trim();
          const description = String(map['description'] || map['remarks'] || map['notes'] || '').trim();

          if (isRequirement) {
            requirementsToImport.push({
              requirementTitle: title,
              requirementType: isRent ? 'Rent' : 'Buy',
              propertyType: propertyTypeVal || 'Plot/Land',
              district,
              preferredLocation: location,
              requiredArea: area,
              budget: isRent ? 0 : price,
              maximumMonthlyRent: isRent ? price : 0,
              buyerName: contactName || 'Imported Buyer',
              phoneNumber: phone || '9999999999',
              description
            });
          } else {
            propertiesToImport.push({
              title,
              listingType: isRent ? 'Rent' : 'Sale',
              propertyType: propertyTypeVal || 'Plot/Land',
              district,
              location,
              area,
              expectedPrice: isRent ? 0 : price,
              monthlyRent: isRent ? price : 0,
              ownerName: contactName || 'Imported Owner',
              phoneNumber: phone || '9999999999',
              description
            });
          }
        });

        setParsedData({
          properties: propertiesToImport,
          requirements: requirementsToImport,
          totalRows: jsonRows.length
        });
      } catch (err) {
        console.error('Excel parse error:', err);
        setParseError('Failed to parse Excel file. Please ensure it is a valid .xlsx, .xls, or .csv file.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setSelectedFile(file);
      parseExcelFile(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      parseExcelFile(file);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIRM IMPORT BATCH
  // ═══════════════════════════════════════════════════════════════════════════
  const handleConfirmImport = () => {
    if (!parsedData) return;

    const fileName = selectedFile ? selectedFile.name : 'Imported_File.xlsx';
    const batchMeta = bulkAddItems(parsedData.properties, parsedData.requirements, fileName);

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setSelectedFile(null);
      setParsedData(null);
      if (onImportComplete) onImportComplete(batchMeta);
      onClose();
    }, 1800);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // REVERT IMPORT BATCH
  // ═══════════════════════════════════════════════════════════════════════════
  const handleConfirmRevert = (batchId) => {
    revertImportBatch(batchId);
    setRevertConfirmBatchId(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Excel / CSV Bulk Importer"
      subtitle="Import properties & buyer requirements with 1-click batch revert"
      icon={FileSpreadsheet}
      size="2xl"
      footer={
        activeTab === 'upload' && !isSuccess ? (
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <span className="text-xs text-slate-400">
              {parsedData ? `Ready to import ${parsedData.totalRows} records` : 'Upload an Excel or CSV file to continue'}
            </span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-all cursor-pointer"
              >
                Cancel
              </button>
              {parsedData && (
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#B0004F] text-white hover:bg-[#800039] shadow-md shadow-pink-900/10 transition-all cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Import All ({parsedData.totalRows})</span>
                </button>
              )}
            </div>
          </div>
        ) : null
      }
    >
      {/* Modal Navigation Tabs */}
        <div className="px-6 border-b border-slate-100 flex items-center gap-4 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`py-3.5 px-2 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'upload'
                ? 'border-[#B0004F] text-[#B0004F]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload & Import</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-3.5 px-2 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'border-[#B0004F] text-[#B0004F]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Import History & Revert</span>
            {importHistory.length > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700">
                {importHistory.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* SUCCESS OVERLAY */}
          {isSuccess ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Batch Import Successful!</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                All parsed properties and buyer requirements have been added to your dataset. You can revert this import anytime under the "Import History" tab.
              </p>
            </div>
          ) : activeTab === 'upload' ? (
            <>
              {/* UPLOAD & PARSE TAB */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gradient-to-r from-slate-50 to-emerald-50/30 rounded-2xl border border-slate-200/80">
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Need the correct Excel format?</h4>
                    <p className="text-[11px] text-slate-500">Download our sample template with pre-filled Sale, Rent & Requirement columns.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={downloadSampleTemplate}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 transition-all cursor-pointer shrink-0 shadow-sm flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Excel Template</span>
                </button>
              </div>

              {/* DRAG & DROP AREA */}
              {!parsedData && (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className={`p-10 border-2 border-dashed rounded-2xl text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-3 ${
                    dragActive 
                      ? 'border-[#B0004F] bg-pink-50/30' 
                      : 'border-slate-200 hover:border-slate-400 bg-slate-50/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="p-4 rounded-2xl bg-white shadow-md text-[#B0004F] border border-slate-100">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Click to upload or drag & drop your Excel file</p>
                    <p className="text-xs text-slate-400 mt-1">Supports .xlsx, .xls, or .csv files up to 20MB</p>
                  </div>
                </div>
              )}

              {/* ERROR MESSAGE */}
              {parseError && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* PARSED DATA PREVIEW & SUMMARY */}
              {parsedData && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-800">{selectedFile ? selectedFile.name : 'Parsed File'}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                        {parsedData.totalRows} Total Rows
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setParsedData(null); setSelectedFile(null); }}
                      className="text-xs font-semibold text-[#B0004F] hover:underline cursor-pointer"
                    >
                      Choose Different File
                    </button>
                  </div>

                  {/* Category Breakdown Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Sale Properties</span>
                      <span className="text-xl font-black text-emerald-900 mt-1 block">
                        {parsedData.properties.filter(p => p.listingType === 'Sale').length}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-violet-50/60 border border-violet-100">
                      <span className="text-[10px] font-extrabold text-violet-700 uppercase tracking-wider block">Rent Properties</span>
                      <span className="text-xl font-black text-violet-900 mt-1 block">
                        {parsedData.properties.filter(p => p.listingType === 'Rent').length}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100">
                      <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider block">Buy Requirements</span>
                      <span className="text-xl font-black text-blue-900 mt-1 block">
                        {parsedData.requirements.filter(r => r.requirementType === 'Buy').length}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100">
                      <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider block">Rent Requirements</span>
                      <span className="text-xl font-black text-amber-900 mt-1 block">
                        {parsedData.requirements.filter(r => r.requirementType === 'Rent').length}
                      </span>
                    </div>
                  </div>

                  {/* Data Preview Table */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Preview Parsed Items (First 5 Rows)</span>
                      <span className="text-[10px] text-slate-400">All data verified for District, Locality & Pricing</span>
                    </div>
                    <div className="overflow-x-auto max-h-56">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0">
                          <tr>
                            <th className="px-3 py-2">Category</th>
                            <th className="px-3 py-2">Title</th>
                            <th className="px-3 py-2">Type</th>
                            <th className="px-3 py-2">District / Locality</th>
                            <th className="px-3 py-2">Area</th>
                            <th className="px-3 py-2">Price / Budget</th>
                            <th className="px-3 py-2">Contact</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {parsedData.properties.slice(0, 3).map((p, idx) => (
                            <tr key={`prop-${idx}`} className="hover:bg-slate-50/80">
                              <td className="px-3 py-2.5 font-bold text-emerald-700">Property ({p.listingType})</td>
                              <td className="px-3 py-2.5 font-semibold text-slate-900 max-w-[160px] truncate">{p.title}</td>
                              <td className="px-3 py-2.5">{p.propertyType}</td>
                              <td className="px-3 py-2.5">{p.location ? `${p.location}, ${p.district}` : p.district}</td>
                              <td className="px-3 py-2.5">{p.area || '—'}</td>
                              <td className="px-3 py-2.5 font-bold">{p.listingType === 'Rent' ? `₹${p.monthlyRent}/mo` : `₹${p.expectedPrice}`}</td>
                              <td className="px-3 py-2.5">{p.ownerName} ({p.phoneNumber})</td>
                            </tr>
                          ))}
                          {parsedData.requirements.slice(0, 2).map((r, idx) => (
                            <tr key={`req-${idx}`} className="hover:bg-slate-50/80">
                              <td className="px-3 py-2.5 font-bold text-blue-700">Requirement ({r.requirementType})</td>
                              <td className="px-3 py-2.5 font-semibold text-slate-900 max-w-[160px] truncate">{r.requirementTitle}</td>
                              <td className="px-3 py-2.5">{r.propertyType}</td>
                              <td className="px-3 py-2.5">{r.preferredLocation ? `${r.preferredLocation}, ${r.district}` : r.district}</td>
                              <td className="px-3 py-2.5">{r.requiredArea || '—'}</td>
                              <td className="px-3 py-2.5 font-bold">{r.requirementType === 'Rent' ? `₹${r.maximumMonthlyRent}/mo` : `₹${r.budget}`}</td>
                              <td className="px-3 py-2.5">{r.buyerName} ({r.phoneNumber})</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* IMPORT HISTORY & REVERT TAB */
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Batch Revert & Undo Engine</h4>
                  <p className="text-[11px] text-slate-500">Every bulk import is logged. Click "Revert Import" to remove all entries created in that batch.</p>
                </div>
                <RotateCcw className="w-5 h-5 text-slate-400 shrink-0" />
              </div>

              {importHistory.length === 0 ? (
                <div className="py-12 text-center border border-slate-200 border-dashed rounded-2xl bg-slate-50/50 space-y-2">
                  <p className="text-sm font-semibold text-slate-700">No import history available yet.</p>
                  <p className="text-xs text-slate-500">When you import Excel files, your batches will appear here for 1-click reverting.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {importHistory.map((batch) => (
                    <div key={batch.batchId} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:border-slate-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm font-bold text-slate-900">{batch.fileName}</span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {batch.totalItems} Items
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>Imported on: {new Date(batch.importedAt).toLocaleString()}</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-medium">{batch.salePropsCount} Sale Props</span>
                          <span>•</span>
                          <span className="text-violet-700 font-medium">{batch.rentPropsCount} Rent Props</span>
                          <span>•</span>
                          <span className="text-blue-700 font-medium">{batch.buyReqsCount} Buy Reqs</span>
                          <span>•</span>
                          <span className="text-amber-700 font-medium">{batch.rentReqsCount} Rent Reqs</span>
                        </div>
                      </div>

                      {/* Revert Trigger Button */}
                      {revertConfirmBatchId === batch.batchId ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleConfirmRevert(batch.batchId)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-all cursor-pointer shadow-sm"
                          >
                            Confirm Revert
                          </button>
                          <button
                            type="button"
                            onClick={() => setRevertConfirmBatchId(null)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setRevertConfirmBatchId(batch.batchId)}
                          className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-rose-200 text-rose-700 hover:bg-rose-50 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Revert Batch</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
    </Modal>
  );
}
