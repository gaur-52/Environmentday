/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { CertificateData, BLOCKS_LIST, ASSEMBLY_SEATS, TREES_LIST } from "../types";
import { 
  dbAddCertificateLog,
  dbDeleteCertificateLog
} from "../lib/db";
import { 
  Users, 
  Settings, 
  FileSpreadsheet, 
  Download, 
  Trash2, 
  Check, 
  Plus, 
  Layers, 
  ShieldAlert, 
  Search,
  Lock,
  Unlock,
  ToggleLeft,
  ToggleRight,
  TreePine,
  Vote,
  Award,
  Leaf,
  Info,
  AlertCircle,
  HeartHandshake,
  HelpCircle
} from "lucide-react";

interface DownloadLogEntry {
  id: string;
  recipientName: string;
  guardianName: string;
  mobileNumber?: string;
  assemblyConstituency: string;
  block: string;
  district: string;
  certificateId: string;
  timestamp: string;
  format: "pdf" | "png" | "print";
}

interface AdminPanelProps {
  data: CertificateData;
  onChange: (newData: CertificateData) => void;
  isAdminActive: boolean;
  setIsAdminActive: (active: boolean) => void;
}

// Initial empty logs list for real-time voter entries
const MOCK_LOGS: DownloadLogEntry[] = [];

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  data, 
  onChange, 
  isAdminActive, 
  setIsAdminActive 
}) => {
  const [activeTab, setActiveTab] = useState<"stats" | "config" | "logs" | "reference" | "multi-entry">("stats");
  const [logs, setLogs] = useState<DownloadLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passError, setPassError] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);
  const [visualType, setVisualType] = useState<"bar" | "radial">("bar");

  // States for Multi-Entry Feature
  const [pasteInput, setPasteInput] = useState("");
  const [bulkRows, setBulkRows] = useState<Array<{
    id: string;
    recipientName: string;
    guardianName: string;
    block: string;
    assemblyConstituency: string;
    treeId: string;
  }>>([]);
  const [bulkImportSuccessMessage, setBulkImportSuccessMessage] = useState<string | null>(null);

  // Default values for bulk input helpers
  const [bulkDefaultBlock, setBulkDefaultBlock] = useState("पहाड़ी");
  const [bulkDefaultAssembly, setBulkDefaultAssembly] = useState("डीग-कुम्हेर (72)");
  const [bulkDefaultTree, setBulkDefaultTree] = useState("khejri");

  // Load and sync logs from localStorage
  useEffect(() => {
    const storedLogs = localStorage.getItem("sveep_download_logs");
    let initialLogs: DownloadLogEntry[] = [];
    if (storedLogs) {
      try {
        initialLogs = JSON.parse(storedLogs);
        // Robust check: reset old mock records so new users start at exactly 0
        if (initialLogs.some(log => log.id === "log-1" || log.id === "log-2" || log.id === "log-3")) {
          initialLogs = [];
          localStorage.setItem("sveep_download_logs", JSON.stringify([]));
        }
      } catch (e) {
        initialLogs = [];
        localStorage.setItem("sveep_download_logs", JSON.stringify([]));
      }
    } else {
      localStorage.setItem("sveep_download_logs", JSON.stringify([]));
    }
    setLogs(initialLogs);
  }, []);

  // Listen to custom event when a download occurs
  useEffect(() => {
    const handleLogUpdate = () => {
      const stored = localStorage.getItem("sveep_download_logs");
      if (stored) {
        setLogs(JSON.parse(stored));
      }
    };
    window.addEventListener("sveep_logs_updated", handleLogUpdate);
    return () => window.removeEventListener("sveep_logs_updated", handleLogUpdate);
  }, []);

  // Expand login modal via event listener
  useEffect(() => {
    const handleOpenLogin = () => {
      setShowPassModal(true);
      setPasscodeInput("");
      setPassError(false);
    };
    window.addEventListener("sveep_open_admin_login", handleOpenLogin);
    return () => window.removeEventListener("sveep_open_admin_login", handleOpenLogin);
  }, []);

  // Handle Passcode verification (simple demo passcode: 2026 or 1234)
  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeInput === "2026" || passcodeInput === "1234" || passcodeInput === "admin") {
      setIsAdminActive(true);
      setShowPassModal(false);
      setPasscodeError(false);
    } else {
      setPasscodeError(true);
    }
  };

  const setPasscodeError = (val: boolean) => {
    setPassError(val);
  };

  // Toggle Admin Mode
  const handleToggleAdmin = () => {
    if (isAdminActive) {
      setIsAdminActive(false);
    } else {
      setShowPassModal(true);
      setPasscodeInput("");
      setPasscodeError(false);
    }
  };

  // Update specific fields in parent state
  const updateField = (key: keyof CertificateData, value: any) => {
    onChange({ ...data, [key]: value });
  };

  // Export logs to Excel-compatible CSV Sheet
  const handleExportCSV = () => {
    if (logs.length === 0) return;
    
    // Add UTF-8 BOM so Excel opens Hindi characters correctly
    let csvContent = "\uFEFF";
    csvContent += "क्रमांक (Sr No),डाउनलोड तिथि व समय (Date Time),प्रमाणपत्र आईडी (Certificate ID),मतदाता का नाम (Citizen Name),पिता/पति का नाम (Guardian Name),मोबाइल नंबर (Mobile Number),विधानसभा क्षेत्र (Assembly Constituency),ब्लॉक (Block),जिला (District),प्रारूप (Format)\n";
    
    logs.forEach((log, index) => {
      const row = [
        index + 1,
        `"${log.timestamp}"`,
        `"${log.certificateId}"`,
        `"${log.recipientName}"`,
        `"${log.guardianName}"`,
        `"${log.mobileNumber || "N/A"}"`,
        `"${log.assemblyConstituency}"`,
        `"${log.block}"`,
        `"${log.district}"`,
        `"${log.format.toUpperCase()}"`
      ].join(",");
      csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Sveep_Deeg_Certificate_Logs_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  // Clear all logs with secure authorization code verification
  const handleClearLogs = () => {
    const inputPasscode = window.prompt("सुरक्षा सत्यापन: डेटाबेस रीसेट करने के लिए अधिकृत पासकोड दर्ज करें (Enter authorization passcode to reset database):");
    if (inputPasscode === null) return; // Exit if cancelled
    
    if (inputPasscode !== "2025") {
      alert("क्रिटिकल सुरक्षा एरर: गलत अधिकृत पासकोड! डेटा रीसेट निरस्त।");
      return;
    }

    if (window.confirm("क्या आप वाकई सभी डाउनलोड इतिहास को हटाना चाहते हैं? यह प्रक्रिया अपरिवर्तनीय है।")) {
      // Synced deletion of all documents in the Firestore database
      logs.forEach((log: any) => {
        dbDeleteCertificateLog(log.id);
      });
      localStorage.setItem("sveep_download_logs", JSON.stringify([]));
      setLogs([]);
      window.dispatchEvent(new Event("sveep_logs_updated"));
      alert("सफलता: सम्पूर्ण डाउनलोड इतिहास व सांख्यिकी डेटा सफलतापूर्वक रीसेट कर दिया गया है!");
    }
  };

  // Delete a single log row
  const handleDeleteSingleLog = (id: string) => {
    if (window.confirm("क्या आप वाकई इस रिकॉर्ड को डाउनलोड इतिहास से हटाना चाहते हैं?")) {
      // Synced deletion of the active document in Firestore
      dbDeleteCertificateLog(id);
      
      const stored = localStorage.getItem("sveep_download_logs");
      if (stored) {
        try {
          const currentLogs = JSON.parse(stored);
          const filtered = currentLogs.filter((log: any) => log.id !== id);
          localStorage.setItem("sveep_download_logs", JSON.stringify(filtered));
          setLogs(filtered);
          window.dispatchEvent(new Event("sveep_logs_updated"));
        } catch (e) {
          // ignore
        }
      }
    }
  };

  // Load selected log into live preview kustomizer
  const handleLoadInPreview = (log: DownloadLogEntry) => {
    onChange({
      ...data,
      recipientName: log.recipientName,
      guardianName: log.guardianName,
      mobileNumber: log.mobileNumber || "",
      assemblyConstituency: log.assemblyConstituency,
      block: log.block,
      district: log.district,
      certificateId: log.certificateId
    });
    window.dispatchEvent(new Event("sveep_force_show_preview"));
    const element = document.getElementById("recipient_name_field");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Bulk Multi-Entry: Parse pasted list of names
  const handleParsePaste = () => {
    if (!pasteInput.trim()) return;
    const lines = pasteInput.split("\n");
    const parsedEntries = lines
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line, idx) => {
        let recipientName = "";
        let guardianName = "";
        if (line.includes(",")) {
          const parts = line.split(",");
          recipientName = parts[0].trim();
          guardianName = parts[1].trim();
        } else if (line.includes("\t")) {
          const parts = line.split("\t");
          recipientName = parts[0].trim();
          guardianName = parts[1].trim();
        } else {
          recipientName = line;
          guardianName = "";
        }
        return {
          id: `bulk-${Date.now()}-${idx}-${Math.random()}`,
          recipientName,
          guardianName,
          block: bulkDefaultBlock,
          assemblyConstituency: bulkDefaultAssembly,
          treeId: bulkDefaultTree
        };
      });
    
    setBulkRows((prev) => [...prev, ...parsedEntries]);
    setPasteInput("");
  };

  // Bulk Multi-Entry: Add clean blank manual row 
  const addBulkRow = () => {
    setBulkRows((prev) => [
      ...prev,
      {
        id: `bulk-row-${Date.now()}-${Math.random()}`,
        recipientName: "",
        guardianName: "",
        block: bulkDefaultBlock,
        assemblyConstituency: bulkDefaultAssembly,
        treeId: bulkDefaultTree
      }
    ]);
  };

  // Bulk Multi-Entry: Remove row from builder
  const removeBulkRow = (id: string) => {
    setBulkRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Bulk Multi-Entry: Update a field inside the builder list
  const updateBulkRowField = (id: string, field: string, value: string) => {
    setBulkRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  // Bulk Multi-Entry: Commit all compiled rows to database
  const handleCommitBulkRows = () => {
    const validRows = bulkRows.filter((r) => r.recipientName.trim().length > 0);
    if (validRows.length === 0) {
      alert("सुरक्षा त्रुटि: सहेजने के लिए कृपया कम से कम एक मतदाता का वैध नाम दर्ज करें!");
      return;
    }

    const storedLogs = localStorage.getItem("sveep_download_logs");
    let currentLogs: DownloadLogEntry[] = [];
    if (storedLogs) {
      try {
        currentLogs = JSON.parse(storedLogs);
      } catch (e) {
        currentLogs = [];
      }
    }

    const rawDate = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestampStr = `${rawDate.getFullYear()}-${pad(rawDate.getMonth() + 1)}-${pad(rawDate.getDate())} ${pad(rawDate.getHours())}:${pad(rawDate.getMinutes())}:${pad(rawDate.getSeconds())}`;

    const newLogEntries: DownloadLogEntry[] = validRows.map((row, idx) => {
      const serialNum = currentLogs.length + idx + 1;
      const formattedId = String(serialNum).padStart(5, "0");

      return {
        id: `log-${Date.now()}-${idx}-${Math.random()}`,
        recipientName: row.recipientName.trim(),
        guardianName: row.guardianName.trim() || "श्रीमान्",
        mobileNumber: "N/A",
        assemblyConstituency: row.assemblyConstituency,
        block: row.block,
        district: data.district || "डीग (राजस्थान)",
        certificateId: formattedId,
        timestamp: timestampStr,
        format: "pdf"
      };
    });

    // Save all entries to Firestore
    newLogEntries.forEach((log) => {
      dbAddCertificateLog(log);
    });

    const mergedLogs = [...newLogEntries, ...currentLogs];
    localStorage.setItem("sveep_download_logs", JSON.stringify(mergedLogs));
    setLogs(mergedLogs);

    window.dispatchEvent(new Event("sveep_logs_updated"));

    setBulkImportSuccessMessage(`सफलता: कुल ${newLogEntries.length} मतदाताओं का रिकॉर्ड 'एक पेड़ लोकतंत्र के नाम' डेटाबेस में सुरक्षित सहेज दिया गया है!`);
    setBulkRows([]);
    
    setTimeout(() => {
      setBulkImportSuccessMessage(null);
    }, 6000);
  };

  // Pre-calculate block-wise statistics
  const getBlockCount = (blockHindiName: string) => {
    return logs.filter(log => log.block === blockHindiName).length;
  };

  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    return (
      log.recipientName.toLowerCase().includes(term) ||
      log.guardianName.toLowerCase().includes(term) ||
      log.block.toLowerCase().includes(term) ||
      log.assemblyConstituency.toLowerCase().includes(term) ||
      log.certificateId.toLowerCase().includes(term)
    );
  });

  if (!isAdminActive) {
    return (
      <>
        {showPassModal && (
          <div className="fixed inset-0 bg-stone-900/75 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] no-print">
            <div className="bg-white rounded-3xl border-2 border-amber-500 max-w-sm w-full shadow-2xl p-6 relative overflow-hidden animate-fade-in text-stone-800 font-sans">
              
              <button 
                onClick={() => setShowPassModal(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 font-bold font-mono text-lg cursor-pointer"
              >
                ✕
              </button>

              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900 font-serif">अधिकारी सुरक्षित लॉगिन (Admin)</h3>
                  <p className="text-[11px] text-stone-550 mt-1">
                    डैशबोर्ड रिपोर्ट, विकासक आँकड़े एवं विन्यास देखने के लिए कृपया सुरक्षा पासकोड दर्ज करें।
                  </p>
                </div>
                
                <form onSubmit={handleVerifyPasscode} className="space-y-3 pt-2">
                  <input
                    type="password"
                    placeholder="सुरक्षित एडमिन पासकोड दर्ज करें"
                    value={passcodeInput}
                    onChange={(e) => setPasscodeInput(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-center text-xs font-semibold tracking-wider focus:outline-none focus:border-amber-500 transition-all placeholder:tracking-normal placeholder:font-medium text-stone-900"
                    autoFocus
                  />
                  
                  {passError && (
                    <p className="text-[10px] text-rose-600 font-bold bg-rose-50 py-1 px-3 rounded-lg border border-rose-100 animate-pulse">
                      ⚠ त्रुटि: गलत पासकोड दर्ज किया गया है!
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-[#047857] hover:bg-emerald-700 text-white font-black py-2 rounded-xl text-xs transition-all shadow-md cursor-pointer"
                  >
                    लॉगिन सत्यापित करें (Unlock)
                  </button>
                </form>
                
                <p className="text-[10px] text-stone-400">
                  सुरक्षित विन्यास मॉड्यूल • जिला डीग (राज.)
                </p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="bg-white rounded-3xl border-2 border-amber-500/30 p-5 sm:p-6 w-full shadow-lg relative overflow-hidden transition-all duration-300">
      
      {/* Dynamic Ribbon indicator */}
      <div className="absolute top-0 right-0 bg-amber-500 text-white font-black text-[10px] sm:text-xs px-4 py-1 rounded-bl-2xl uppercase tracking-wider shadow-sm flex items-center gap-1">
        <span>अधिकारी नियंत्रण कक्ष</span>
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 mb-5 gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold font-serif text-amber-950 flex items-center gap-2">
            <span>⚙️ एडमिन पैनल एवं विकासक आँकड़े</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            यहाँ से प्रमाण पत्र डाउनलोड आँकड़े देखें, फाइल डाउनलोड करें तथा अधिकारी विवरण संशोधित करें।
          </p>
        </div>

        {/* Beautiful Toggle Switch for Admin Mode */}
        <button
          onClick={handleToggleAdmin}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            isAdminActive 
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" 
              : "bg-stone-100 hover:bg-stone-200 text-stone-700"
          }`}
        >
          {isAdminActive ? (
            <>
              <Unlock className="w-4 h-4 text-emerald-100" />
              <span>एडमिन सक्रिय (Active)</span>
              <ToggleRight className="w-6 h-6 text-emerald-100 flex-shrink-0" />
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 text-stone-500" />
              <span>एडमिन निष्क्रिय (Inactive)</span>
              <ToggleLeft className="w-6 h-6 text-stone-400 flex-shrink-0" />
            </>
          )}
        </button>
      </div>

      <div className="space-y-6">
          
          {/* TAB BAR */}
          <div className="flex border-b border-stone-200 gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab("stats")}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === "stats"
                  ? "bg-amber-500/10 border-b-2 border-amber-600 text-amber-950 font-extrabold"
                  : "text-stone-500 hover:text-stone-850"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>ब्लॉक डैशबोर्ड (Dashboard)</span>
            </button>
            <button
              onClick={() => setActiveTab("config")}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === "config"
                  ? "bg-amber-500/10 border-b-2 border-amber-600 text-amber-950 font-extrabold"
                  : "text-stone-500 hover:text-stone-850"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>अधिकारी एवं सील कॉन्फ़िगरेशन (Config)</span>
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === "logs"
                  ? "bg-amber-500/10 border-b-2 border-amber-600 text-amber-950 font-extrabold"
                  : "text-stone-500 hover:text-stone-850"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>लाइव डाउनलोड एक्सेल शीट (Logs Sheet)</span>
              <span className="bg-amber-500 text-white text-[9.5px] font-mono px-1.5 py-0.2 rounded-full">
                {logs.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("multi-entry")}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === "multi-entry"
                  ? "bg-[#047857]/15 border-b-2 border-[#047857] text-[#047857] font-extrabold"
                  : "text-stone-500 hover:text-stone-850"
              }`}
            >
              <Plus className="w-4 h-4 text-emerald-700" />
              <span>एक साथ मल्टीपल एंट्री (Bulk Entry)</span>
            </button>
            <button
              onClick={() => setActiveTab("reference")}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === "reference"
                  ? "bg-amber-500/10 border-b-2 border-amber-600 text-amber-950 font-extrabold"
                  : "text-stone-500 hover:text-stone-850"
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>कार्यक्रम निर्देश व दिशानिर्देश (Guidelines)</span>
            </button>
          </div>

          {/* TAB 1: DASHBOARD STATS */}
          {activeTab === "stats" && (
            <div className="space-y-4 animate-fade-in">
              
              {/* Majestic 4 high level widgets representing all campaign stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5 border-b pb-4 border-stone-200/50">
                
                <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100 flex items-center gap-3">
                  <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-700">
                    <TreePine className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-[9px] text-stone-500 font-extrabold block uppercase tracking-wider">कुल रोपित वृक्ष</span>
                    <span className="text-base font-mono font-extrabold text-[#047857] select-all">{logs.length.toLocaleString()}</span>
                    <span className="text-[9px] text-emerald-600 font-bold block">✓ डीग विधानसभा</span>
                  </div>
                </div>

                <div className="bg-amber-50/40 p-3.5 rounded-2xl border border-amber-100 flex items-center gap-3">
                  <div className="bg-amber-100 p-2.5 rounded-xl text-amber-700">
                    <Vote className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-[9px] text-stone-500 font-extrabold block uppercase tracking-wider">स्वीप मतदाता शपथ</span>
                    <span className="text-base font-mono font-extrabold text-stone-900 select-all">{logs.length.toLocaleString()}</span>
                    <span className="text-[9px] text-amber-600 font-bold block">★ शत-प्रतिशत संकल्प</span>
                  </div>
                </div>

                <div className="bg-[#1e3a8a]/5 p-3.5 rounded-2xl border border-[#1e3a8a]/10 flex items-center gap-3">
                  <div className="bg-[#1e3a8a]/10 p-2.5 rounded-xl text-[#1e3a8a]">
                    <Users className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-[9px] text-stone-500 font-extrabold block uppercase tracking-wider">सजातीय विधानसभाएँ</span>
                    <span className="text-xs font-extrabold text-stone-900 block font-serif">4 क्षेत्र (Deeg)</span>
                    <span className="text-[9px] text-stone-400 block">डीग-कुम्हेर, पहाड़ी आदि</span>
                  </div>
                </div>

                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 flex items-center gap-3">
                  <div className="bg-stone-100 p-2.5 rounded-xl text-amber-600">
                    <Award className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-[9px] text-stone-500 font-extrabold block uppercase tracking-wider">न्यूनतम पौधे लक्ष्य</span>
                    <span className="text-xs font-extrabold text-[#047857] block font-serif">1 पौधा प्रति वोटर</span>
                    <span className="text-[9px] text-emerald-700 font-bold block">हरेक मतदाता का अधिकार</span>
                  </div>
                </div>

              </div>
              
              {/* Prominent Excel/CSV Download Action Box */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 text-emerald-800 p-2.5 rounded-xl">
                    <FileSpreadsheet className="w-6 h-6 text-emerald-700" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
                      वोटर प्रमाणपत्र डाउनलोड रिपोर्ट (CSV Sheet Report)
                    </h4>
                    <p className="text-xs text-stone-605 mt-0.5">
                      सभी ब्लॉकों के रिकॉर्ड्स को एक ही क्लिक में Excel / CSV फॉर्मेट में डाउनलोड करें।
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={handleExportCSV}
                    disabled={logs.length === 0}
                    className={`font-black px-5 py-3 rounded-xl text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                      logs.length === 0
                        ? "bg-stone-100 text-stone-400 border border-stone-205 cursor-not-allowed shadow-none"
                        : "bg-[#047857] hover:bg-emerald-700 text-white shadow-emerald-500/20"
                    }`}
                  >
                    <Download className="w-4 h-4 animate-bounce" />
                    <span>Excel / CSV रिपोर्ट डाउनलोड करें ({logs.length} रिकॉर्ड)</span>
                  </button>
                  
                  <button
                    onClick={handleClearLogs}
                    className="border border-rose-200 bg-rose-50 hover:bg-rose-100/90 text-rose-700 font-black px-5 py-3 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all shadow-xs hover:shadow-md"
                    title="डेटा क्लिनअप स्टेशन"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>डेटा रिसेट करें</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
                {BLOCKS_LIST.map((block) => {
                  const count = getBlockCount(block.nameHindi);
                  return (
                    <div 
                      key={block.id} 
                      className="bg-stone-50 hover:bg-stone-100/50 border border-stone-200/70 p-3 rounded-2xl text-center shadow-xs transition-all flex flex-col justify-between"
                    >
                      <span className="text-[11px] font-bold text-stone-500 block">{block.nameHindi}</span>
                      <span className="text-2xl font-mono font-extrabold text-stone-900 block my-1">
                        {count}
                      </span>
                      <span className="text-[9.5px] font-bold py-0.5 rounded-md bg-stone-205 bg-stone-200 text-stone-700 block uppercase font-mono">
                        {block.nameEnglish}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Real-time Block-wise Statistical Graph & Live Visualizer */}
              <div className="bg-white border border-stone-200/70 rounded-3xl p-5 md:p-6 shadow-sm">
                
                {/* Visualizer Title Header & Interactive Options */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-stone-100 pb-4 mb-6">
                  <div>
                    <h3 className="text-sm font-black text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
                      📊 लाइव ब्लॉक-वार ग्राफ़िकल विज़ुअलाइज़र (Live Block-Wise Graph)
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">
                      डीग जिले के सभी ब्लॉकों की भागीदारी और संकल्प संख्या का सजीव ग्राफिकल प्रस्तुतीकरण
                    </p>
                  </div>
                  
                  {/* Selector Segmented Controls */}
                  <div className="bg-stone-100 p-1 rounded-xl flex items-center gap-1 self-start sm:self-center shadow-inner">
                    <button
                      onClick={() => setVisualType("bar")}
                      className={`px-3.5 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                        visualType === "bar" 
                          ? "bg-white text-emerald-805 text-emerald-800 shadow-sm" 
                          : "text-stone-500 hover:text-stone-900"
                      }`}
                    >
                      📈 स्तंभ ग्राफ (SVG Bar)
                    </button>
                    <button
                      onClick={() => setVisualType("radial")}
                      className={`px-3.5 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                        visualType === "radial" 
                          ? "bg-white text-emerald-805 text-emerald-800 shadow-sm" 
                          : "text-stone-500 hover:text-stone-900"
                      }`}
                    >
                      📋 प्रगति सूची (Progress List)
                    </button>
                  </div>
                </div>

                {/* Precomputations for Graph and Panel */}
                {(() => {
                  const blockStats = BLOCKS_LIST.map((block) => {
                    const count = logs.filter(log => log.block === block.nameHindi).length;
                    return {
                      id: block.id,
                      nameHindi: block.nameHindi,
                      nameEnglish: block.nameEnglish,
                      count
                    };
                  });
                  const statsMaxCount = Math.max(...blockStats.map(b => b.count), 5); // Fallback to 5 to avoid div zero
                  const statsTotalCount = logs.length || 0;
                  
                  // Sort to find rank/leaders
                  const sortedStats = [...blockStats].sort((a, b) => b.count - a.count);
                  const highestStatsBlock = sortedStats[0];
                  const lowestStatsBlock = sortedStats[sortedStats.length - 1];
                  const averageCount = Math.round(statsTotalCount / blockStats.length);

                  const currentlyHoveredData = blockStats.find(b => b.id === hoveredBlock);

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                      
                      {/* Left: The Graph Core (Scales automatically) */}
                      <div className="lg:col-span-2 bg-[#FAF9F5] border border-stone-200/50 p-4 rounded-2xl flex flex-col justify-between relative shadow-inner overflow-hidden min-h-[340px]">
                        
                        {/* Dynamic Background Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03]">
                          <Leaf className="w-64 h-64 text-emerald-900 animate-pulse" />
                        </div>

                        {visualType === "bar" ? (
                          <div className="w-full h-full flex flex-col justify-between relative z-10">
                            
                            {/* Graphic Chart Title & Indicators */}
                            <div className="flex justify-between items-center text-[10px] font-mono text-stone-400 border-b border-stone-200/30 pb-2 mb-2">
                              <span>सत्यापित प्रमाण पत्र (Y-Axis)</span>
                              <span className="text-emerald-700 font-bold">● उच्चतम ब्लॉक केसरिया रंग में</span>
                            </div>

                            {/* Responsive SVG Chart View Box */}
                            <svg 
                              viewBox="0 0 640 280" 
                              className="w-full h-auto overflow-visible select-none"
                              style={{ maxHeight: "240px" }}
                            >
                              <defs>
                                {/* Emerald Green to Mint gradient for other blocks */}
                                <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#128807" />
                                  <stop offset="100%" stopColor="#4ade80" />
                                </linearGradient>
                                {/* Saffron Orange to Amber gradient for the leader block */}
                                <linearGradient id="saffronGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#FF671F" />
                                  <stop offset="100%" stopColor="#fca5a5" />
                                </linearGradient>
                                {/* Subtle shadow for bars */}
                                <filter id="barShadow" x="-10%" y="-10%" width="120%" height="120%">
                                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.08" />
                                </filter>
                              </defs>

                              {/* Target background grids (0%, 25%, 50%, 75%, 100%) */}
                              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                                const y = 220 - ratio * 180; // Grid heights mapped between y=40 to y=220
                                const gridValue = Math.round(ratio * statsMaxCount);
                                return (
                                  <g key={index} className="opacity-90">
                                    <line 
                                      x1="55" 
                                      y1={y} 
                                      x2="620" 
                                      y2={y} 
                                      stroke="#E5E4DE" 
                                      strokeWidth="0.8"
                                      strokeDasharray="4 4" 
                                    />
                                    <text 
                                      x="45" 
                                      y={y + 3} 
                                      textAnchor="end" 
                                      className="text-[9px] font-mono font-bold text-stone-500 fill-current"
                                    >
                                      {gridValue}
                                    </text>
                                  </g>
                                );
                              })}

                              {/* Draw SVG Columns for each individual Block */}
                              {blockStats.map((b, idx) => {
                                const colWidth = 560 / blockStats.length;
                                const gap = 20;
                                const barWidth = colWidth - gap;
                                const x = 55 + idx * colWidth + gap / 2;
                                
                                const barHeight = statsTotalCount > 0 ? (b.count / statsMaxCount) * 180 : 2; // minimum visual stub height of 2px
                                const y = 220 - barHeight;

                                // Determine color: Saffron if first rank (leader with entries > 0), green otherwise
                                const isLeader = highestStatsBlock && highestStatsBlock.count > 0 && b.id === highestStatsBlock.id;
                                const isHovered = hoveredBlock === b.id;

                                return (
                                  <g 
                                    key={b.id}
                                    className="cursor-pointer transition-all duration-150 outline-none"
                                    onMouseEnter={() => setHoveredBlock(b.id)}
                                  >
                                    {/* Transparent fat hover target line beneath for better touch accessibility */}
                                    <rect 
                                      x={x - 4} 
                                      y="30" 
                                      width={barWidth + 8} 
                                      height="200" 
                                      fill="transparent"
                                      className="cursor-pointer"
                                    />

                                    {/* The visual colored bar */}
                                    <rect
                                      x={x}
                                      y={y}
                                      width={barWidth}
                                      height={barHeight}
                                      rx="6"
                                      ry="6"
                                      fill={isLeader ? "url(#saffronGradient)" : "url(#emeraldGradient)"}
                                      filter="url(#barShadow)"
                                      stroke={isHovered ? "#000" : (isLeader ? "#FF671F" : "#128807")}
                                      strokeWidth={isHovered ? 2.5 : 0}
                                      opacity={hoveredBlock === null ? 1 : (isHovered ? 1 : 0.45)}
                                      className="transition-all duration-150"
                                    />

                                    {/* Live exact count floating atop the column */}
                                    {b.count > 0 && (
                                      <text
                                        x={x + barWidth / 2}
                                        y={y - 6}
                                        textAnchor="middle"
                                        className={`text-[10px] font-mono font-black fill-current ${
                                          isLeader ? "text-orange-600" : "text-emerald-800"
                                        }`}
                                      >
                                        {b.count}
                                      </text>
                                    )}

                                    {/* Horizontal Block Title label under the column */}
                                    <text
                                      x={x + barWidth / 2}
                                      y="242"
                                      textAnchor="middle"
                                      className={`text-[10px] font-black font-serif fill-current transition-all duration-150 ${
                                        isHovered ? "text-emerald-900" : "text-stone-700"
                                      }`}
                                    >
                                      {b.nameHindi}
                                    </text>

                                    {/* English Sublabel under the column */}
                                    <text
                                      x={x + barWidth / 2}
                                      y="254"
                                      textAnchor="middle"
                                      className={`text-[8.5px] font-mono font-medium fill-current transition-all duration-150 ${
                                        isHovered ? "text-emerald-800" : "text-stone-400"
                                      }`}
                                    >
                                      {b.nameEnglish}
                                    </text>
                                  </g>
                                );
                              })}
                            </svg>
                          </div>
                        ) : (
                          // TAB variant 2: Clean Progress Meter Lists
                          <div className="w-full flex-grow flex flex-col justify-center space-y-3.5 relative z-10 py-1">
                            {blockStats.map((b) => {
                              const percent = statsTotalCount > 0 ? (b.count / statsTotalCount) * 100 : 0;
                              const isHighest = highestStatsBlock && highestStatsBlock.count > 0 && b.id === highestStatsBlock.id;
                              
                              return (
                                <div 
                                  key={b.id} 
                                  onMouseEnter={() => setHoveredBlock(b.id)}
                                  className="bg-white/80 p-3 rounded-xl border border-stone-200/50 flex flex-col justify-between space-y-1.5 shadow-xs transition-all hover:bg-stone-50"
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="font-black text-xs text-stone-850 font-serif flex items-center gap-1">
                                      {isHighest && <span className="text-amber-500">🏆</span>}
                                      {b.nameHindi} ({b.nameEnglish})
                                    </span>
                                    <span className="font-mono font-black text-emerald-800 text-xs">
                                      {b.count} एंट्रीज़ ({Math.round(percent)}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden flex">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        isHighest ? "bg-orange-500" : "bg-emerald-600"
                                      }`}
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* Dynamic Tooltip hint in graph footer */}
                        <div className="border-t border-stone-200/40 pt-2 text-[10px] text-stone-405 font-bold text-center mt-1 flex items-center justify-center gap-1.5 text-stone-500">
                          <Info className="w-3.5 h-3.5 text-emerald-700 inline" />
                          <span>विज़ुअलाइज़र में विवरण देखने के लिए किसी ब्लॉक स्तम्भ पर माउस (Hover) लाएं।</span>
                        </div>
                      </div>

                      {/* Right: Operational Insights Panel */}
                      <div className="bg-emerald-50/20 border border-emerald-100/50 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
                        <div>
                          <h4 className="text-[11px] font-black uppercase text-amber-80 * text-[#047857] tracking-wider mb-3.5 border-b border-emerald-100 pb-1.5">
                            👑 ब्लॉक लीडरबोर्ड व आँकड़े (Leadership Rankings)
                          </h4>

                          {/* Leader Block */}
                          <div className="bg-gradient-to-br from-amber-50 via-amber-20/20 to-orange-50/50 border border-amber-200/60 p-3 rounded-xl mb-3 shadow-xs">
                            <span className="text-[8.5px] font-black uppercase tracking-widest text-amber-850 block mb-1">
                              🏆 अग्रणी भागीदारी (Leader Block)
                            </span>
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-sm font-black text-stone-900 font-serif block">
                                  {highestStatsBlock && highestStatsBlock.count > 0 ? highestStatsBlock.nameHindi : "सभी बराबर"}
                                </span>
                                <span className="text-[9.5px] text-stone-400 font-mono">
                                  {highestStatsBlock && highestStatsBlock.count > 0 ? `${highestStatsBlock.nameEnglish.toUpperCase()} BLOCK` : "अभी मतदान शुरू सूची रिक्त"}
                                </span>
                              </div>
                              <div className="bg-amber-100 p-2 rounded-xl text-amber-700 font-mono font-black text-sm flex items-center gap-1">
                                👑 <span>{highestStatsBlock ? highestStatsBlock.count : 0}</span>
                              </div>
                            </div>
                          </div>

                          {/* Hover Details Card (Dynamic display) */}
                          <div className="bg-white border border-stone-200 p-3 rounded-xl min-h-[120px] flex flex-col justify-between shadow-xs transition-all duration-150">
                            {currentlyHoveredData ? (
                              <div className="space-y-2">
                                <span className="text-[8.5px] font-black uppercase text-emerald-800 tracking-wider block border-b border-stone-100 pb-1">
                                  ⚡ चयनित ब्लॉक विवरण (Hover Stats)
                                </span>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-black font-serif text-stone-905">{currentlyHoveredData.nameHindi}</span>
                                  <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md font-mono font-bold text-[10px]">
                                    रैंक: #{sortedStats.findIndex(s => s.id === currentlyHoveredData.id) + 1}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-center text-xs pt-1 border-t border-stone-50">
                                  <div className="bg-stone-50 p-1.5 rounded-lg border border-stone-100">
                                    <span className="text-[9.5px] text-stone-400 block font-medium">कुल एंट्रीज़</span>
                                    <strong className="text-stone-850 font-mono font-black text-sm">{currentlyHoveredData.count}</strong>
                                  </div>
                                  <div className="bg-emerald-50/50 p-1.5 rounded-lg border border-emerald-100/40">
                                    <span className="text-[9.5px] text-[#047857] block font-medium">हिस्सेदारी</span>
                                    <strong className="text-[#047857] font-mono font-black text-sm">
                                      {statsTotalCount > 0 ? Math.round((currentlyHoveredData.count / statsTotalCount) * 100) : 0}%
                                    </strong>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="h-full flex flex-col items-center justify-center text-center p-3 text-stone-400">
                                <Users className="w-8 h-8 text-stone-300 mb-1.5 animate-pulse" />
                                <span className="text-[10px] font-extrabold text-stone-450 leading-relaxed">
                                  ब्लॉक-वार आंकड़े और लाइव हिस्सेदारी प्रतिशत विश्लेषण देखने के लिए ग्राफ पर विज़िट करें।
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* General Quick Stats Panel bottom */}
                        <div className="grid grid-cols-2 gap-2 mt-3.5">
                          <div className="bg-stone-100/75 p-2 rounded-xl text-center border border-stone-200/30">
                            <span className="text-[8.5px] font-bold text-stone-550 block uppercase">औसत भागीदारी/ब्लॉक</span>
                            <span className="text-xs font-mono font-black text-stone-800">{averageCount}</span>
                          </div>
                          <div className="bg-stone-100/75 p-2 rounded-xl text-center border border-stone-200/30">
                            <span className="text-[8.5px] font-bold text-stone-550 block uppercase">भाग लेने वाले ब्लॉक</span>
                            <span className="text-xs font-mono font-black text-[#047857]">{blockStats.filter(c => c.count > 0).length} / {blockStats.length}</span>
                          </div>
                        </div>

                      </div>

                    </div>
                  );
                })()}

              </div>

              {/* STATS OVERVIEW */}
              <div className="bg-emerald-50/50 border border-emerald-100/70 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-600 text-white p-2.5 rounded-xl">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider">
                      कुल सकल डाउनलोड लॉग्स इतिहास
                    </h4>
                    <p className="text-[11px] text-[#047857] font-semibold mt-0.5">
                      सभी {BLOCKS_LIST.length} ब्लॉकों से कुल संचित प्रमाणपत्र डाउनलोड संख्या: <strong className="font-mono text-sm">{logs.length}</strong>
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Excel (CSV) डाउनलोड</span>
                  </button>
                  <button
                    onClick={handleClearLogs}
                    className="border border-stone-200 bg-white hover:bg-stone-50 text-rose-600 font-bold py-2 px-3 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>इतिहास साफ करें</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONFIGURATION */}
          {activeTab === "config" && (
            <div className="space-y-4">
              <div className="bg-emerald-50 text-[#047857] px-4 py-2 text-xs font-semibold rounded-2xl border border-emerald-100 flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                  <span>⚡ <strong>ऑटो सेव मोड सक्रिय (Auto-Save Active):</strong> जो भी बदलाव आप करेंगे वह ऑटोमैटिक सेव हो जाएगा और तुरंत लागू हो जाएगा।</span>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black tracking-wide px-2 py-0.5 rounded-md uppercase">
                  ACTIVE
                </span>
              </div>

              <span className="text-xs font-black text-amber-800 tracking-wider block uppercase border-b pb-1">
                ✍️ प्रमाणीकरण अधिकारी एवं स्टांप का विवरण प्रबंधित करें
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Officer Name */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    अधिकारी का नाम (Authorized Name)
                  </label>
                  <input
                    type="text"
                    value={data.eroName}
                    onChange={(e) => updateField("eroName", e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-bold"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    * प्रमाणपत्र के नीचे कोष्ठक में यह नाम मुद्रित होगा।
                  </p>
                </div>

                {/* Officer Designation */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    अधिकारी पदनाम (Official Designation)
                  </label>
                  <input
                    type="text"
                    value={data.eroDesignation}
                    onChange={(e) => updateField("eroDesignation", e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Stamp Text Hindi */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    स्टांप मोहर हिन्दी संदेश (Stamp Text Hindi) *
                  </label>
                  <input
                    type="text"
                    value={data.stampTextHindi}
                    onChange={(e) => updateField("stampTextHindi", e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-amber-505 focus:bg-white transition-all"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    * मोहर के ऊपरी वक्र हिस्से में मुद्रित होने वाला पाठ।
                  </p>
                </div>

                {/* Stamp Text English */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    स्टांप मोहर अंग्रेज़ी संदेश (Stamp Text English) *
                  </label>
                  <input
                    type="text"
                    value={data.stampTextEnglish}
                    onChange={(e) => updateField("stampTextEnglish", e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-amber-505 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* E-Signature Text */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    हस्ताक्षर संकेत (E-Sign Initials)
                  </label>
                  <input
                    type="text"
                    value={data.customSignatureText}
                    onChange={(e) => updateField("customSignatureText", e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-blue-805 text-blue-800 font-signature focus:outline-none focus:border-amber-505 focus:bg-white transition-all text-xl"
                  />
                </div>

                {/* Seal Stamp color */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    मोहर सील स्याही का रंग
                  </label>
                  <select
                    value={data.sealColor}
                    onChange={(e) => updateField("sealColor", e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-amber-505 focus:bg-white transition-all"
                  >
                    <option value="gold">स्वर्ण (Amber/Gold)</option>
                    <option value="green">मुहर हरी (Eco Green)</option>
                    <option value="blue">मैरून नीला (Office Blue)</option>
                    <option value="brown">पारंपरिक गिला भूरा (Traditional Brown)</option>
                  </select>
                </div>

                {/* Border Style */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    सर्टिफिकेट बॉर्डर फ्रेम
                  </label>
                  <select
                    value={data.borderStyle}
                    onChange={(e) => updateField("borderStyle", e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-amber-505 focus:bg-white transition-all"
                  >
                    <option value="classic">क्लासिक ग्रीन-गोल्ड</option>
                    <option value="eco-leaf">सघन प्राकृतिक ग्रीन</option>
                    <option value="royal-gold">शाही देवनागरी राज स्वर्ण</option>
                    <option value="traditional">पारम्परिक हस्तशिल्प लकड़ी</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DOWNLOAD LOGS TABLE */}
          {activeTab === "logs" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-stone-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="खोजें (नाम, ब्लॉक, सीट क्रमांक...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-505 focus:bg-white transition-all"
                  />
                </div>

                <button
                  onClick={handleExportCSV}
                  className="bg-[#047857] hover:bg-emerald-700 text-white font-extrabold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm whitespace-nowrap self-stretch sm:self-auto justify-center"
                >
                  <Download className="w-4 h-4" />
                  <span>Excel (CSV) शीट निर्यात करें</span>
                </button>
              </div>

              {/* TABLE AREA */}
              <div className="overflow-x-auto rounded-xl border border-stone-200">
                <table className="w-full text-left border-collapse text-[11px] sm:text-xs">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3">क्रमांक (No)</th>
                      <th className="py-2.5 px-3">मतदाता का नाम (Name)</th>
                      <th className="py-2.5 px-3">पिता/पति (Guardian)</th>
                      <th className="py-2.5 px-3">मोबाइल (Mobile)</th>
                      <th className="py-2.5 px-3">ब्लॉक (Block)</th>
                      <th className="py-2.5 px-3">विधानसभा (Constituency)</th>
                      <th className="py-2.5 px-3">आईडी क्रमांक (Serial ID)</th>
                      <th className="py-2.5 px-3">डाउनलोड समय</th>
                      <th className="py-2.5 px-3">प्रारूप</th>
                      <th className="py-2.5 px-3 text-center">कार्रवाई (Action)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-6 text-center text-stone-400 font-medium">
                          कोई रिकॉर्ड नहीं मिला। कृपया प्रमाण पत्र डाउनलोड करें।
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log, index) => (
                        <tr 
                          key={log.id} 
                          className="border-b border-stone-150 hover:bg-stone-50/50 transition-colors font-medium text-stone-800"
                        >
                          <td className="py-2 px-3 font-mono">{index + 1}</td>
                          <td className="py-2 px-3 font-bold">{log.recipientName}</td>
                          <td className="py-2 px-3 font-serif text-stone-600">{log.guardianName}</td>
                          <td className="py-2 px-3 font-mono text-stone-600 font-semibold">{log.mobileNumber || "N/A"}</td>
                          <td className="py-2 px-3 block-badge">
                            <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-md font-bold text-[10px]">
                              {log.block}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-stone-600">{log.assemblyConstituency}</td>
                          <td className="py-2 px-3 font-mono text-[10.5px] font-bold text-[#1e3a8a]">{log.certificateId}</td>
                          <td className="py-2 px-3 text-stone-500 font-mono text-[10px]">{log.timestamp}</td>
                          <td className="py-2 px-3 uppercase text-stone-500">
                            <span className={`px-1.5 py-0.5 rounded-sm font-black text-[9.5px] ${
                              log.format === "pdf" ? "bg-rose-50 text-rose-700 border border-rose-100" :
                              log.format === "png" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                              "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            }`}>
                              {log.format}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleLoadInPreview(log)}
                                title="सर्टिफिकेट प्रिव्यू में लोड करें"
                                className="bg-[#047857] text-white font-extrabold px-2 py-1 rounded text-[10px] hover:bg-emerald-700 transition-all cursor-pointer shadow-xs whitespace-nowrap"
                              >
                                प्रिव्यू लोड करें (Load)
                              </button>
                              <button
                                onClick={() => handleDeleteSingleLog(log.id)}
                                title="रिकॉर्ड हटाएं"
                                className="text-rose-600 hover:text-white border border-rose-200 hover:bg-rose-600 px-1.5 py-1 rounded transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: MULTI-ENTRY (एक साथ मल्टिपल एंट्री) */}
          {activeTab === "multi-entry" && (
            <div className="space-y-6 animate-fade-in text-stone-850">
              
              {/* Info banner */}
              <div className="bg-[#047857]/5 p-4 rounded-3xl border border-[#047857]/15 flex items-start gap-3">
                <Info className="w-5 h-5 text-[#047857] flex-shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <h4 className="font-bold text-[#047857] uppercase tracking-wider">थोक प्रविष्टि मॉड्यूल (Bulk Import Control Node)</h4>
                  <p className="text-stone-605 mt-1 font-medium font-serif leading-relaxed">
                    यहाँ से आप एक साथ अनेक मतदाताओं के रिकॉर्ड्स को सिस्टम में सीधे सुरक्षित सहेज सकते हैं। प्रविष्टि पूर्ण होने के बाद ये रिकॉर्ड्स आपके मुख्य डेटाबेस एवं ब्लॉक-वार प्रोग्रेस चार्ट में स्वतः ही क्रमबद्ध जुड़ जायेंगे, तथा एक साथ CSV फाइल में निर्यात किए जा सकेंगे।
                  </p>
                </div>
              </div>

              {bulkImportSuccessMessage && (
                <div className="bg-emerald-50 border-2 border-emerald-300 text-[#047857] px-4 py-3.5 rounded-2xl font-bold text-sm animate-fade-in flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 animate-bounce" />
                  <span>{bulkImportSuccessMessage}</span>
                </div>
              )}

              {/* TWO SECTIONS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Pasted Input Card (Col 5) */}
                <div className="lg:col-span-5 bg-stone-50 border border-stone-200 p-5 rounded-3xl space-y-4">
                  <div>
                    <h4 className="text-xs font-black text-stone-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      📌 थोक नाम प्रविष्टि (Bulk Paste Area)
                    </h4>
                    <p className="text-[10px] text-stone-500 mb-3 leading-relaxed">
                      एक लाइन में एक मतदाता का नाम दर्ज करें। विवरण अलग करने हेतु '<strong>नाम, पिता का नाम</strong>' लिखकर अल्प-विराम (comma) का उपयोग करें।
                    </p>
                    
                    <textarea
                      rows={6}
                      placeholder="उदा.&#10;महेश कुमार शर्मा, श्री केदार प्रसाद&#10;सविता चौधरी, श्री राजपाल चौधरी&#10;कपिल देव सैनी"
                      value={pasteInput}
                      onChange={(e) => setPasteInput(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-600 font-mono transition-all leading-normal"
                    />
                  </div>

                  {/* Bulk defaults helpers */}
                  <div className="space-y-3 pt-3 border-t border-stone-200">
                    <span className="text-[10px] font-black uppercase text-stone-500 block tracking-wider">
                      ⚙️ पेस्ट की गई सूची हेतु डिफ़ॉल्ट प्रविष्टि मान (Defaults Setup)
                    </span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      <div>
                        <label className="block text-[9.5px] font-bold text-stone-605 mb-0.5">ब्लॉक क्षेत्र</label>
                        <select
                          value={bulkDefaultBlock}
                          onChange={(e) => setBulkDefaultBlock(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-lg p-1.5 text-[11px] focus:outline-none"
                        >
                          {BLOCKS_LIST.map(b => (
                            <option key={b.id} value={b.nameHindi}>{b.nameHindi}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9.5px] font-bold text-stone-605 mb-0.5">विधानसभा</label>
                        <select
                          value={bulkDefaultAssembly}
                          onChange={(e) => setBulkDefaultAssembly(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-lg p-1.5 text-[11px] focus:outline-none font-serif"
                        >
                          {ASSEMBLY_SEATS.map(s => (
                            <option key={s.id} value={s.nameHindi}>{s.nameHindi}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9.5px] font-bold text-stone-605 mb-0.5">रोपित वृक्ष</label>
                        <select
                          value={bulkDefaultTree}
                          onChange={(e) => setBulkDefaultTree(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-lg p-1.5 text-[11px] focus:outline-none"
                        >
                          {TREES_LIST.map(t => (
                            <option key={t.id} value={t.id}>{t.nameHindi}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleParsePaste}
                      disabled={!pasteInput.trim()}
                      className={`w-full font-black py-2.5 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${
                        pasteInput.trim()
                          ? "bg-[#047857] hover:bg-emerald-700 text-white"
                          : "bg-stone-200 text-stone-400 cursor-not-allowed shadow-none"
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>ग्रिड में प्रविष्ट करें (Parse & Load List)</span>
                    </button>
                  </div>

                </div>

                {/* Compiler Interactive Grid (Col 7) */}
                <div className="lg:col-span-7 bg-white border border-stone-200 p-5 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="text-xs font-black text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                      📊 कम्पाइलर ड्राफ्ट ग्रिड (Draft Database)
                      <span className="bg-emerald-100 text-[#047857] px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold">
                        {bulkRows.length} ड्राफ्ट्स
                      </span>
                    </h4>
                    
                    <button
                      type="button"
                      onClick={addBulkRow}
                      className="bg-[#047857]/10 hover:bg-[#047857]/20 text-[#047857] font-black py-1 px-3 rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 animate-pulse" />
                      <span>मैन्युअल प्रविष्टि जोड़ें</span>
                    </button>
                  </div>

                  {bulkRows.length === 0 ? (
                    <div className="py-12 text-center border-2 border-dashed border-stone-150 rounded-2xl flex flex-col items-center justify-center space-y-2">
                      <Users className="w-8 h-8 text-stone-300" strokeWidth={1.5} />
                      <p className="text-xs text-stone-450 font-medium font-serif">कोई स्थानीय ड्राफ्ट रिकॉर्ड उपलब्ध नहीं है।</p>
                      <p className="text-[10px] text-stone-400 max-w-xs leading-normal">
                        ऊपर दिए गए "थोक नाम प्रविष्टि" विकल्प में नामों की सूची पेस्ट करें अथवा "मैन्युअल प्रविष्टि जोड़ें" बटन दबाकर प्रविष्टि शुरू करें।
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3.5 max-h-[340px] overflow-y-auto pr-1">
                      {bulkRows.map((row, index) => (
                        <div 
                          key={row.id} 
                          className="bg-stone-50/50 p-3.5 rounded-2xl border border-stone-250 border-stone-200/80 relative space-y-2 text-xs"
                        >
                          <span className="absolute top-2.5 right-10 bg-stone-200 text-stone-600 font-mono text-[9px] px-1.5 py-0.2 rounded-md font-bold">
                            रो # {index + 1}
                          </span>
                          
                          <button
                            type="button"
                            onClick={() => removeBulkRow(row.id)}
                            className="absolute top-2 right-2 text-stone-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-all cursor-pointer"
                            title="रो हटाएं"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                              <label className="block text-[9.5px] font-bold text-stone-500 mb-0.5">नागरिक का नाम *</label>
                              <input
                                type="text"
                                value={row.recipientName}
                                onChange={(e) => updateBulkRowField(row.id, "recipientName", e.target.value)}
                                placeholder="जैसे: अमित कुमार"
                                className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-600 font-bold text-stone-800"
                              />
                            </div>
                            <div>
                              <label className="block text-[9.5px] font-bold text-stone-500 mb-0.5">पिता/पति का नाम</label>
                              <input
                                type="text"
                                value={row.guardianName}
                                onChange={(e) => updateBulkRowField(row.id, "guardianName", e.target.value)}
                                placeholder="जैसे: श्री रामनाथ"
                                className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-600 font-bold text-stone-700"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                            <div>
                              <label className="block text-[9.5px] font-bold text-stone-400 mb-0.5">ब्लॉक</label>
                              <select
                                value={row.block}
                                onChange={(e) => updateBulkRowField(row.id, "block", e.target.value)}
                                className="w-full bg-white border border-stone-200 rounded-lg p-1 text-[11px] focus:outline-none"
                              >
                                {BLOCKS_LIST.map(b => (
                                  <option key={b.id} value={b.nameHindi}>{b.nameHindi}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[9.5px] font-bold text-stone-400 mb-0.5">विधानसभा</label>
                              <select
                                value={row.assemblyConstituency}
                                onChange={(e) => updateBulkRowField(row.id, "assemblyConstituency", e.target.value)}
                                className="w-full bg-white border border-stone-200 rounded-lg p-1 text-[11px] focus:outline-none font-serif"
                              >
                                {ASSEMBLY_SEATS.map(s => (
                                  <option key={s.id} value={s.nameHindi}>{s.nameHindi}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[9.5px] font-bold text-stone-400 mb-0.5">रोपित वृक्ष</label>
                              <select
                                value={row.treeId}
                                onChange={(e) => updateBulkRowField(row.id, "treeId", e.target.value)}
                                className="w-full bg-white border border-stone-200 rounded-lg p-1 text-[11px] focus:outline-none"
                              >
                                {TREES_LIST.map(t => (
                                  <option key={t.id} value={t.id}>{t.nameHindi}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {bulkRows.length > 0 && (
                    <div className="pt-3.5 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("क्या आप वाकई सभी ड्राफ्ट प्रविष्टियों को खाली करना चाहते हैं?")) {
                            setBulkRows([]);
                          }
                        }}
                        className="text-rose-600 hover:bg-rose-50 border border-stone-200 bg-white hover:border-rose-150 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>ड्राफ्ट सूची खाली करें</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCommitBulkRows}
                        className="bg-[#047857] hover:bg-emerald-700 text-white font-black py-2.5 px-6 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-700/20 w-full sm:w-auto"
                      >
                        <Check className="w-4.5 h-4.5" />
                        <span>एक साथ {bulkRows.length} एंट्रीज़ सहेजें (Commit)</span>
                      </button>
                    </div>
                  )}

                </div>

              </div>

            </div>
          )}

          {/* TAB 4: CAMPAIGN INFORMATION & GUIDELINES (REMOVED FROM MAIN PAGE) */}
          {activeTab === "reference" && (
            <div className="space-y-6 animate-fade-in text-stone-850 font-sans">
              
              {/* Selected Tree Details */}
              {(() => {
                const selectedTree = TREES_LIST.find((t) => t.id === data.treeId) || TREES_LIST[0];
                return (
                  <div className="bg-[#FCFBF7] rounded-3xl border border-amber-200/60 p-5 shadow-xs relative overflow-hidden">
                    <div className="absolute top-[-20px] right-[-20px] text-amber-500/5 rotate-12">
                      <Leaf className="w-24 h-24" />
                    </div>

                    <div className="flex items-center gap-2 border-b border-stone-200 pb-2 mb-3.5">
                      <Leaf className="w-5 h-5 text-emerald-700" />
                      <h4 className="font-extrabold text-stone-900 text-sm font-serif">
                        चयनित कल्पवृक्ष का ऐतिहासिक महत्व: {selectedTree.nameHindi} ({selectedTree.nameEnglish})
                      </h4>
                    </div>

                    <p className="text-xs font-serif text-stone-750 leading-relaxed font-bold">
                      "{selectedTree.descriptionHindi}"
                    </p>
                    <p className="text-[11px] text-stone-500 leading-relaxed mt-1.5 italic">
                      Scientific Name: <span className="font-bold font-mono">{selectedTree.scientificName}</span> — {selectedTree.descriptionEnglish}
                    </p>
                    
                    <div className="mt-4 bg-white p-3 rounded-2xl border border-stone-150 flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-stone-600 leading-relaxed">
                        <strong>पर्यावरण सुरक्षा + लोकतंत्र सुरक्षा:</strong> राजस्थान के इस विशेष महोत्सव पर पेड़ लगाना एक पवित्र संकल्प है। रोपे गए पौधे को "लोकतंत्र का पेड़" के नाम से आपके निर्वाचक क्षेत्र के राजस्व रिकॉर्ड व नागरिक प्रमाणपत्र में स्थान दिया जाता है।
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Step-by-Step Campaign Guide */}
              <div className="bg-stone-50 border border-stone-200/80 rounded-3xl p-5 md:p-6 text-stone-850">
                <h4 className="font-extrabold text-[#047857] border-b border-stone-200 pb-2 mb-4 text-sm font-serif flex items-center gap-2">
                  <HeartHandshake className="w-5 h-5" />
                  'एक पेड़ लोकतंत्र के नाम' स्वीप कार्यक्रम में भाग कैसे लें? (Campaign Roadmap)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed">
                  <div className="space-y-1 bg-white p-3.5 rounded-2xl border border-stone-200/50">
                    <div className="w-6 h-6 rounded-full bg-[#047857] text-white flex items-center justify-center font-black mb-2 shadow-xs text-xs">
                      1
                    </div>
                    <h5 className="font-black text-stone-900">पौधा लगाएं (Plant Seedling)</h5>
                    <p className="text-stone-500">
                      अपने घर, खेत, या सार्वजनिक स्थल पर कोई छांवदार या फलदार स्थानीय पौधा (जैसे खेजड़ी, पीपल, नीम) लगाएं व फोटो लें।
                    </p>
                  </div>
                  <div className="space-y-1 bg-white p-3.5 rounded-2xl border border-stone-200/50">
                    <div className="w-6 h-6 rounded-full bg-[#047857] text-white flex items-center justify-center font-black mb-2 shadow-xs text-xs">
                      2
                    </div>
                    <h5 className="font-black text-stone-900">विवरण दर्ज करें (Enter Details)</h5>
                    <p className="text-stone-500">
                      इस कस्टमाइजर पर अपना नाम, पिता का नाम, विधानसभा निर्वाचन क्षेत्र, एवं रोपित वृक्ष का चयन करें व शपथ को टिक करें।
                    </p>
                  </div>
                  <div className="space-y-1 bg-white p-3.5 rounded-2xl border border-stone-200/50">
                    <div className="w-6 h-6 rounded-full bg-[#047857] text-white flex items-center justify-center font-black mb-2 shadow-xs text-xs">
                      3
                    </div>
                    <h5 className="font-black text-stone-900">प्रमाणपत्र साझा करें (Share & Post)</h5>
                    <p className="text-stone-500">
                      प्रमाणपत्र को पीडीएफ या इमेज (PNG) रूप में डाउनलोड करें, सोशल मीडिया पर राष्ट्रहित में पोस्ट कर लोगों को मतदान के लिए प्रेरित करें।
                    </p>
                  </div>
                </div>
              </div>

              {/* Integrity Declaration */}
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/50 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5 animate-bounce" />
                <div>
                  <h5 className="text-xs font-black uppercase text-amber-900 tracking-wider">सत्यनिष्ठा की पुष्टि (Integrity Declaration)</h5>
                  <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                    यह अभियान पूर्णतः जन-भागीदारी एवं नैतिक जिम्मेदारी पर आधारित है। कृपया सही नाम, तिथि एवं विधानसभा निर्वाचन क्षेत्र का चयन करें। निर्वाचन आयोग द्वारा डिजिटल प्रमाणपत्रों का सत्यापन सीरियल कोड तथा क्यूआर कोड के माध्यम से किसी भी समय किया जा सकता है।
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
  );
};
