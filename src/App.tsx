/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { CertificateData, TREES_LIST, INITIAL_DATA, SWEEP_SLOGANS, BLOCKS_LIST, NATURE_QUOTES } from "./types";
import { ControlPanel } from "./components/ControlPanel";
import { CertificatePreview } from "./components/CertificatePreview";
import { AdminPanel } from "./components/AdminPanel";
import { TreeOfDemocracyLogo, ECILogo } from "./components/Icons";
import { 
  dbAddCertificateLog, 
  dbIncrementGlobalCounter, 
  listenCertificateLogs, 
  listenGlobalCounter,
  testConnection
} from "./lib/db";
import { 
  TreePine, 
  MapPin, 
  Vote, 
  Users, 
  Award, 
  Leaf, 
  Sparkles, 
  ExternalLink, 
  HelpCircle, 
  HeartHandshake, 
  AlertCircle, 
  Info,
  Smartphone,
  Check,
  Volume2,
  VolumeX,
  X,
  Flame
} from "lucide-react";

export default function App() {
  const [data, setData] = useState<CertificateData>(() => {
    const storedCustom = localStorage.getItem("sveep_custom_config");
    if (storedCustom) {
      try {
        const parsed = JSON.parse(storedCustom);
        // Automatic upgrade to Shri Mohan Singh and his signature
        if (parsed.eroName === "श्री अमित कुमार शर्मा" || !parsed.eroName || parsed.eroName.includes("अमित")) {
          parsed.eroName = "श्री मोहन सिंह";
        }
        if (parsed.customSignatureText === "A. K. Sharma" || !parsed.customSignatureText || parsed.customSignatureText.includes("Sharma")) {
          parsed.customSignatureText = "Mohan Singh";
        }
        if (parsed.assemblyConstituency === "डीग-कुम्हेर (73)") {
          parsed.assemblyConstituency = "डीग-कुम्हेर (72)";
        } else if (parsed.assemblyConstituency === "नगर (74)") {
          parsed.assemblyConstituency = "नगर (71)";
        } else if (parsed.assemblyConstituency === "कामां (75)") {
          parsed.assemblyConstituency = "कामां (70)";
        }
        const configFields = {
          eroName: parsed.eroName,
          eroDesignation: parsed.eroDesignation,
          customSignatureText: parsed.customSignatureText,
          sealColor: parsed.sealColor,
          borderStyle: parsed.borderStyle,
          stampTextHindi: parsed.stampTextHindi,
          stampTextEnglish: parsed.stampTextEnglish,
          assemblyConstituency: parsed.assemblyConstituency
        };
        // Remove undefined fields
        Object.keys(configFields).forEach(key => {
          if ((configFields as any)[key] === undefined) {
            delete (configFields as any)[key];
          }
        });
        
        // Save the migrated config back to localStorage
        const updatedConfig = { ...parsed, ...configFields };
        localStorage.setItem("sveep_custom_config", JSON.stringify(updatedConfig));

        return { ...INITIAL_DATA, ...configFields };
      } catch (e) {
        return INITIAL_DATA;
      }
    }
    return INITIAL_DATA;
  });
  const [isAdminActive, setIsAdminActive] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [activeSloganIndex, setActiveSloganIndex] = useState(0);
  const [pageCounter, setPageCounter] = useState(0);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [currentQuote, setCurrentQuote] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [liveTime, setLiveTime] = useState<string>("");

  // Live Date and Time Tick
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      };
      setLiveTime(now.toLocaleString("hi-IN", options));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Select a random nature quote on mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * NATURE_QUOTES.length);
    setCurrentQuote(NATURE_QUOTES[randomIndex]);
  }, []);

  // Text-To-Speech (Talkback Assistance) handler
  const speakText = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      alert("क्षमा करें, आपके ब्राउज़र में ऑडियो टॉकबैक सहायता विकल्प उपलब्ध नहीं है।");
      return;
    }
    
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";
    utterance.rate = 1.0;

    // Use a localized Hindi voice if available
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(v => v.lang.includes("hi") || v.name.toLowerCase().includes("hindi") || v.lang.includes("IN"));
    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };
  
  useEffect(() => {
    // Test the database connection on start
    testConnection();

    // 1. Retrieve & increment for page load/open
    const stored = localStorage.getItem("sveep_page_counter");
    let countVal = 3482; // Hand-picked beautiful initial baseline
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed)) {
        countVal = parsed;
      }
    }
    const updatedCount = countVal + 1;
    localStorage.setItem("sveep_page_counter", updatedCount.toString());
    setPageCounter(updatedCount);

    // Log the page view event in the database
    dbIncrementGlobalCounter();

    // 2. Clear values on first render to fulfill the "har baar ye option blank ho" requirement
    setData(prev => ({
      ...prev,
      recipientName: "",
      guardianName: "",
      mobileNumber: ""
    }));

    // 3. Global click listener to increment counter on every single click
    const handleGlobalClick = () => {
      setPageCounter((prev) => {
        const nextVal = prev + 1;
        localStorage.setItem("sveep_page_counter", nextVal.toString());
        return nextVal;
      });
      dbIncrementGlobalCounter();
    };

    window.addEventListener("click", handleGlobalClick);
    return () => {
      window.removeEventListener("click", handleGlobalClick);
    };
  }, []);
  
  // Real-time synchronization of downloads logs directly from active Firestore + local fallback
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const handleUpdate = () => {
      const stored = localStorage.getItem("sveep_download_logs");
      let currentLogs = [];
      if (stored) {
        try {
          currentLogs = JSON.parse(stored);
          // Auto migration / wipe old pre-cached mock logs to show clean 0 count initial state
          if (currentLogs.some((log: any) => log.id === "log-1" || log.id === "log-2" || log.id === "log-3")) {
            currentLogs = [];
            localStorage.setItem("sveep_download_logs", JSON.stringify([]));
          }
        } catch (e) {
          currentLogs = [];
        }
      }
      setLogs((prev) => {
        // Let Firestore logs take precedence
        return prev.length > currentLogs.length ? prev : currentLogs;
      });
    };

    handleUpdate();
    window.addEventListener("sveep_logs_updated", handleUpdate);

    // Active real-time Firestore listener for live certificate stream
    const unsubscribeLogs = listenCertificateLogs((dbLogs) => {
      if (dbLogs && dbLogs.length >= 0) {
        setLogs(dbLogs);
        localStorage.setItem("sveep_download_logs", JSON.stringify(dbLogs));
      }
    });

    // Active real-time Firestore listener for global clicks stream
    const unsubscribeCounter = listenGlobalCounter((liveCount) => {
      if (liveCount > 0) {
        setPageCounter(liveCount);
        localStorage.setItem("sveep_page_counter", liveCount.toString());
      }
    });

    return () => {
      window.removeEventListener("sveep_logs_updated", handleUpdate);
      if (typeof unsubscribeLogs === "function") unsubscribeLogs();
      if (typeof unsubscribeCounter === "function") unsubscribeCounter();
    };
  }, []);

  // Real-time Auto-Save of customized ERO configs & Stamps
  useEffect(() => {
    const configToSave = {
      eroName: data.eroName,
      eroDesignation: data.eroDesignation,
      customSignatureText: data.customSignatureText,
      sealColor: data.sealColor,
      borderStyle: data.borderStyle,
      stampTextHindi: data.stampTextHindi,
      stampTextEnglish: data.stampTextEnglish
    };
    localStorage.setItem("sveep_custom_config", JSON.stringify(configToSave));
    window.dispatchEvent(new Event("sveep_config_updated"));
  }, [
    data.eroName,
    data.eroDesignation,
    data.customSignatureText,
    data.sealColor,
    data.borderStyle,
    data.stampTextHindi,
    data.stampTextEnglish
  ]);

  // Handle live updates from other open windows/tabs
  useEffect(() => {
    const reloadCustomConfig = () => {
      const storedCustom = localStorage.getItem("sveep_custom_config");
      if (storedCustom) {
        try {
          const parsed = JSON.parse(storedCustom);
          setData(prev => {
            let hasChanged = false;
            const updated = { ...prev };
            const configKeys: (keyof CertificateData)[] = [
              "eroName", "eroDesignation", "customSignatureText", "sealColor", "borderStyle", "stampTextHindi", "stampTextEnglish"
            ];
            for (const key of configKeys) {
              if (parsed[key] !== undefined && parsed[key] !== prev[key]) {
                (updated as any)[key] = parsed[key];
                hasChanged = true;
              }
            }
            return hasChanged ? updated : prev;
          });
        } catch (e) {
          // ignore
        }
      }
    };

    window.addEventListener("sveep_config_updated", reloadCustomConfig);
    window.addEventListener("storage", reloadCustomConfig);
    return () => {
      window.removeEventListener("sveep_config_updated", reloadCustomConfig);
      window.removeEventListener("storage", reloadCustomConfig);
    };
  }, []);

  // Slogan Carousel Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSloganIndex((prevIndex) => (prevIndex + 1) % SWEEP_SLOGANS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Dynamically format certificateId sequentially based on log count, starting with "00001"
  useEffect(() => {
    const nextSerialNum = logs.length + 1;
    const formattedId = String(nextSerialNum).padStart(5, "0");
    setData(prev => {
      if (prev.certificateId !== formattedId) {
        return {
          ...prev,
          certificateId: formattedId
        };
      }
      return prev;
    });
  }, [logs.length]);

  // Reset generation state if crucial details change, so they have to click generate again
  useEffect(() => {
    setIsGenerated(false);
  }, [
    data.recipientName,
    data.guardianName,
    data.mobileNumber,
    data.block,
    data.assemblyConstituency,
    data.treeId,
    data.district,
    data.plantationDate,
    data.borderStyle,
    data.sealColor,
    data.isE_Signed,
    data.pledgeAccepted
  ]);

  useEffect(() => {
    const handleForceShow = () => {
      setTimeout(() => {
        setIsGenerated(true);
      }, 50);
    };
    window.addEventListener("sveep_force_show_preview", handleForceShow);
    return () => window.removeEventListener("sveep_force_show_preview", handleForceShow);
  }, []);

  const handleGenerateAndDownload = (format: "pdf" | "png" | "print" | "share" = "pdf") => {
    if (!data.recipientName.trim()) {
      alert("सुरक्षा त्रुटि: सर्टिफिकेट तैयार करने के लिए कृपया पहले मतदाता/नागरिक का नाम दर्ज करें!");
      const el = document.getElementById("recipient_name_field");
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    
    // Set isGenerated to true
    setIsGenerated(true);
    
    // Dispatch download action in the next tick to ensure the DOM is mounted and rendered!
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("sveep_action_download", { detail: { format } }));
    }, 200);
  };

  // Find info for selected tree
  const selectedTree = TREES_LIST.find((t) => t.id === data.treeId) || TREES_LIST[0];

  const handleDownloadProcessed = (format: "pdf" | "png" | "print") => {
    const rawDate = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestampStr = `${rawDate.getFullYear()}-${pad(rawDate.getMonth() + 1)}-${pad(rawDate.getDate())} ${pad(rawDate.getHours())}:${pad(rawDate.getMinutes())}:${pad(rawDate.getSeconds())}`;

    // Create a new download entry
    const newEntry = {
      id: `log-${Date.now()}`,
      recipientName: data.recipientName || "अनाम नागरिक",
      guardianName: data.guardianName || "श्री प्रकाश चंद्र",
      mobileNumber: data.mobileNumber || "N/A",
      assemblyConstituency: data.assemblyConstituency,
      block: data.block || "पहाड़ी",
      district: data.district,
      certificateId: data.certificateId,
      timestamp: timestampStr,
      format: format
    };

    // Push the log to the Firestore Database
    dbAddCertificateLog(newEntry);

    // Retrieve stored logs or default mock logs
    const stored = localStorage.getItem("sveep_download_logs");
    let currentLogs = [];
    if (stored) {
      try {
        currentLogs = JSON.parse(stored);
      } catch (e) {
        currentLogs = [];
      }
    }
    
    // Prepend the new log entry
    const updated = [newEntry, ...currentLogs];
    localStorage.setItem("sveep_download_logs", JSON.stringify(updated));

    // Disperse a custom event so AdminPanel (if mounted) updates its state live!
    window.dispatchEvent(new Event("sveep_logs_updated"));
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans antialiased text-stone-800 flex flex-col justify-between">
      
      {/* 1. TOP STATS BAR / ALERT BOX */}
      <div className="bg-[#047857] text-white py-2 px-4 no-print border-b border-emerald-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 text-xs">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span className="bg-amber-500 text-[#047857] px-2 py-0.5 rounded-full font-black text-[10px] tracking-wide uppercase">
              विशेष अभियान (Special Drive)
            </span>
            <span className="font-semibold text-[11px]">
              कार्यालय जिला निर्वाचन अधिकारी, डीग द्वारा आयोजित - 'एक पेड़ लोकतंत्र के नाम' स्वीप (SVEEP) मुहिम 2026
            </span>
          </div>
          <div className="flex items-center gap-4 text-emerald-100">
            {liveTime && (
              <span className="font-mono bg-emerald-900/40 px-2.5 py-0.5 rounded border border-emerald-700/50 text-[10.5px] whitespace-nowrap">
                🕒 {liveTime}
              </span>
            )}
            <a 
              href="https://ecisveep.nic.in" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-white flex items-center gap-1 font-bold underline text-[11px]"
            >
              ECI SVEEP वेबसाइट <ExternalLink className="w-3 h-3" />
            </a>

            {/* Top-Right Admin Lock Tab */}
            <button
              onClick={() => {
                if (isAdminActive) {
                  setIsAdminActive(false);
                } else {
                  window.dispatchEvent(new Event("sveep_open_admin_login"));
                }
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10.5px] font-black uppercase transition-all cursor-pointer ${
                isAdminActive
                  ? "bg-emerald-500 text-white border border-emerald-400"
                  : "bg-amber-500 hover:bg-amber-600 text-white border border-amber-400 shadow-sm shadow-amber-500/20"
              }`}
              id="top_admin_sec_lock_tab"
            >
              <span>{isAdminActive ? "🔓 एडमिन मोड" : "🔒 एडमिन"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAJESTIC LOGO & ECO-HERO HERO SECTION */}
      <header className="bg-white border-b border-emerald-100 pt-6 pb-6 text-stone-900 no-print shadow-xs">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            
            {/* Title / Emblem group */}
            <div className="flex items-center gap-4 text-center lg:text-left flex-col sm:flex-row">
              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 shadow-sm animate-leaf">
                <TreeOfDemocracyLogo className="w-16 h-16 sm:w-20 sm:h-20" />
              </div>
              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                  <span className="bg-[#1e3a8a]/10 text-[#1e3a8a] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider font-sans">
                    भारत निर्वाचन आयोग (ECI)
                  </span>
                  <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider font-sans">
                    विश्व पर्यावरण दिवस 2026
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3.5xl font-extrabold font-serif tracking-tight text-emerald-950">
                  एक पेड़ लोकतंत्र के नाम
                </h1>
                <p className="text-xs sm:text-sm text-stone-550 font-medium font-serif mt-0.5 leading-relaxed">
                  Systematic Voters' Education and Electoral Participation (SVEEP) Programme, District Deeg (Rajasthan)
                </p>
              </div>
            </div>

            {/* Campaign Slogan Board */}
            <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-4 max-w-md w-full relative overflow-hidden shadow-xs">
              <div className="absolute top-0 left-0 bg-amber-500 text-white text-[9.5px] font-black px-2.5 py-0.5 rounded-br-xl uppercase tracking-wider">
                स्वीप संदेश
              </div>
              <div className="mt-2.5 text-stone-800 font-serif italic text-xs leading-relaxed font-semibold transition-all duration-500">
                " {SWEEP_SLOGANS[activeSloganIndex]} "
              </div>
              <div className="flex justify-end gap-1 mt-2">
                {SWEEP_SLOGANS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSloganIndex(idx)}
                    className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                      activeSloganIndex === idx ? "bg-amber-600 w-3" : "bg-amber-300"
                    }`}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* 4. MAIN INTERACTIVE CONTENT GRID */}
      <main className="max-w-7xl w-full mx-auto px-2 sm:px-4 md:px-8 py-8 flex-grow">
        
        {/* Dynamic environmental nature quote banner */}
        {currentQuote && (
          <div className="mb-6 bg-gradient-to-r from-emerald-50 via-green-50/45 to-amber-50/60 border border-emerald-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm no-print">
            <div className="flex items-center gap-3 text-center sm:text-left flex-col sm:flex-row">
              <div className="bg-emerald-100 text-emerald-800 p-2.5 rounded-xl">
                <Leaf className="w-5 h-5 animate-pulse text-emerald-700" />
              </div>
              <div>
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-0.5">🌱 आज का पर्यावरण सुविचार (Nature's Green Quote)</span>
                <p className="text-xs sm:text-sm text-emerald-950 font-serif italic font-extrabold">"{currentQuote}"</p>
              </div>
            </div>
            
            <button 
              onClick={() => {
                const randomIndex = Math.floor(Math.random() * NATURE_QUOTES.length);
                setCurrentQuote(NATURE_QUOTES[randomIndex]);
              }}
              className="text-[10px] font-black uppercase text-emerald-800 hover:text-emerald-950 bg-white hover:bg-emerald-50 border border-emerald-250 px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap active:scale-95 shadow-xs"
            >
              🔄 नया पर्यावरण सुविचार बदलें
            </button>
          </div>
        )}

        {/* Full-width Admin Panel Dash/Config Area */}
        <div className="mb-8 no-print animate-fade-in" id="admin_panel_section">
          <AdminPanel 
            data={data} 
            onChange={setData} 
            isAdminActive={isAdminActive} 
            setIsAdminActive={setIsAdminActive} 
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* LEFT PANEL: Control Inputs & Options (5 cols) */}
          <div className="xl:col-span-5 space-y-6 no-print">
            <ControlPanel 
              data={data} 
              onChange={setData} 
              isAdminMode={isAdminActive} 
            />
          </div>

          {/* RIGHT PANEL: Real-time Live Certificate Canvas View (7 cols) */}
          <div className="xl:col-span-7 flex flex-col items-center">
            
            {/* Live Certificate Preview label */}
            <div className="w-full flex justify-between items-center mb-3 px-1 no-print">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                {isGenerated ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    <span>सर्टिफिकेट लाइव प्रिव्यू (Active Live Certificate Preview)</span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse inline-block" />
                    <span>सर्टिफिकेट जनरेशन डेस्क (Ready to Generate)</span>
                  </>
                )}
              </span>
              <span className="text-[10.5px] font-sans font-semibold text-emerald-800">
                A4 Landscape Size Printable Matrix
              </span>
            </div>

            {/* Render Placeholder or Real Certificate */}
            {!isGenerated ? (
              <div className="w-full bg-[#FCFBF7] border-2 border-dashed border-emerald-200 rounded-3xl p-6 sm:p-10 flex flex-col items-center text-center shadow-lg relative overflow-hidden transition-all duration-300 min-h-[520px] justify-center text-stone-850">
                {/* Visual leaf flourishes */}
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-emerald-50 rounded-full opacity-40 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-amber-50 rounded-full opacity-40 blur-2xl pointer-events-none" />
                
                {/* Icon Circle */}
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full border border-emerald-100 flex items-center justify-center animate-bounce shadow-sm">
                    <TreeOfDemocracyLogo className="w-12 h-12" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-1.5 shadow-sm">
                    <Vote className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="font-serif text-xl sm:text-2xl font-black text-emerald-950 tracking-tight leading-snug">
                  आपका डिजिटल प्रमाणपत्र यहाँ तैयार होगा!
                </h3>
                <h4 className="text-stone-500 text-[10.5px] font-semibold uppercase tracking-wider font-sans mt-1">
                  Digital SVEEP Certificate Generator Station
                </h4>

                <div className="max-w-md mx-auto my-5 space-y-4">
                  <p className="text-xs sm:text-sm text-stone-605 leading-relaxed font-serif font-semibold">
                    बिहार व राजस्थान के पावन लोकतंत्र और पर्यावरण चेतना को समर्पित "एक पेड़ लोकतंत्र के नाम" डिजिटल अभियान में आपका स्वागत है।
                  </p>
                  
                  {/* Dynamic checklist */}
                  <div className="bg-stone-50/85 rounded-2xl p-4 border border-stone-200 text-left space-y-2.5 text-xs">
                    <span className="font-black text-stone-700 uppercase tracking-wider block text-[10px] mb-1">
                      📋 जनरेशन चेकलिस्ट (Input Status Tracker)
                    </span>
                    
                    {/* Step 1: name */}
                    <div className="flex items-center gap-2.5">
                      {data.recipientName.trim() ? (
                        <div className="bg-emerald-100 text-emerald-800 rounded-full p-0.5">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      ) : (
                        <div className="w-4.5 h-4.5 rounded-full border-2 border-stone-300 bg-white" />
                      )}
                      <span className={`font-semibold ${data.recipientName.trim() ? "text-emerald-800 font-bold" : "text-stone-500"}`}>
                        मतदाता / नागरिक का नाम दर्ज करें {data.recipientName.trim() ? `(${data.recipientName.trim()})` : ""}
                      </span>
                    </div>

                    {/* Step 2: Oath */}
                    <div className="flex items-center gap-2.5">
                      {data.pledgeAccepted ? (
                        <div className="bg-emerald-100 text-emerald-800 rounded-full p-0.5">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      ) : (
                        <div className="w-4.5 h-4.5 rounded-full border-2 border-stone-300 bg-white" />
                      )}
                      <span className={`font-semibold ${data.pledgeAccepted ? "text-emerald-850 font-bold" : "text-stone-500"}`}>
                        मतदाता ई-शपथ स्वीकार करें {data.pledgeAccepted ? "(स्वीकृत ✅)" : "(वैकल्पिक)"}
                      </span>
                    </div>

                    {/* Step 3: Action */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-4.5 h-4.5 rounded-full border-2 border-dashed border-amber-500 animate-pulse" />
                      <span className="text-stone-550 font-semibold animate-pulse">
                        "सर्टिफिकेट जनरेट व डाउनलोड करें" बटन पर क्लिक करें
                      </span>
                    </div>
                  </div>
                </div>

                {/* Call to action button */}
                <button
                  onClick={() => handleGenerateAndDownload("pdf")}
                  className={`px-6 py-4 rounded-xl text-xs sm:text-sm font-black tracking-wide transition-all shadow-md flex items-center gap-2.5 cursor-pointer active:scale-98 ${
                    data.recipientName.trim()
                      ? "bg-[#047857] hover:bg-emerald-800 text-white shadow-emerald-700/20 hover:shadow-lg"
                      : "bg-stone-200 text-stone-400 cursor-not-allowed shadow-none"
                  }`}
                >
                  <Sparkles className="w-4.5 h-4.5 text-amber-300 animate-bounce" />
                  <span>प्रमाणपत्र जनरेट व डाउनलोड करें (PDF)</span>
                </button>
                
                <p className="text-[10px] text-stone-400 mt-3.5 font-medium leading-normal max-w-xs">
                  * आपके बटन दबाते ही अधिकारिक स्टांप, डिजिटल हस्ताक्षर व सीरियल नंबर के साथ पूरा प्रमाण पत्र संकलित होकर डाउनलोड हो जायेगा।
                </p>
              </div>
            ) : (
              <CertificatePreview data={data} onDownloadProcessed={handleDownloadProcessed} />
            )}
          </div>

        </div>
      </main>

      {/* 5. FOOTER */}
      <footer className="bg-[#1a3a2a] text-stone-200 py-8 px-4 border-t-4 border-[#D97706]/40 no-print">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs">
          
          <div className="flex items-center gap-3.5 flex-col sm:flex-row text-center sm:text-left">
            <div className="bg-white p-1.5 rounded-lg w-10 h-10 flex items-center justify-center">
              <ECILogo className="w-8 h-8" />
            </div>
            <div>
              <p className="font-bold text-stone-105 font-serif">कार्यालय जिला निर्वाचन अधिकारी (जिला कलेक्टर), डीग, राजस्थान</p>
              <p className="text-stone-400 mt-0.5">व्यवस्थापक: व्यवस्थित मतदाता शिक्षा और चुनावी भागीदारी कार्यक्रम (SVEEP)</p>
              <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-[10px] text-stone-450">
                <p className="font-mono">© 2026 ECI-SVEEP. Campaign for World Environment Day 2026. All rights-reserved.</p>
                <span className="hidden sm:inline text-stone-600">|</span>
                <p className="font-sans font-medium text-amber-500/90">
                  Developed by: <span className="font-bold text-amber-500">Chandra Shekhar Gautam</span> (Special Teacher, CBEO Office, Pahadi) & <span className="font-bold text-amber-500">Kushagra Gaur</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 text-stone-400 font-medium">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a href="https://voters.eci.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-all underline">
                मतदाता सेवा पोर्टल
              </a>
              <span>•</span>
              <a href="https://ceorajasthan.nic.in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-all underline">
                CEO राजस्थान वेबसाइट
              </a>
              <span>•</span>
              <span className="text-[10px] font-mono text-emerald-400 block sm:inline bg-emerald-950 px-2 py-0.5 rounded-md">
                Secure E-Verification Node Live
              </span>
            </div>

            {/* Lifetime Page hit & click tracker */}
            <div className="flex flex-col items-center sm:items-end gap-1.5 border-t sm:border-t-0 sm:border-l border-emerald-800/40 pt-3 sm:pt-0 sm:pl-4.5">
              <span className="text-[9.5px] uppercase font-black text-amber-505 tracking-wider text-emerald-400 block">
                🔴 कुल विज़िटर व क्लिक्स (Interactions)
              </span>
              <div className="bg-emerald-950 border border-emerald-800/70 rounded-xl px-3 py-1 flex items-center gap-2 font-mono text-emerald-400 font-bold shadow-inner">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs sm:text-sm tracking-widest">{pageCounter.toLocaleString()}</span>
              </div>
            </div>
          </div>

        </div>
      </footer>

      {/* Welcome Onboarding Modal */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl border border-emerald-100 max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-fade-in text-center">
            {/* Saffron / White / Green Top Decorative Strip */}
            <div className="absolute top-0 inset-x-0 h-2 flex">
              <div className="flex-1 bg-[#FF671F]" />
              <div className="flex-1 bg-white" />
              <div className="flex-1 bg-[#128807]" />
            </div>
            
            <div className="flex justify-center mb-4 mt-2">
              <div className="bg-emerald-50 p-4 rounded-full border border-emerald-100 shadow-sm animate-bounce">
                <TreeOfDemocracyLogo className="w-14 h-14" />
              </div>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-emerald-950 font-serif leading-tight">
              आपका हार्दिक स्वागत है! 😊
            </h3>
            
            <div className="my-5 bg-emerald-50/70 border border-emerald-100 p-5 rounded-2xl text-left space-y-3.5">
              <p className="text-stone-800 text-sm leading-relaxed font-serif text-center font-extrabold text-[13.5px]">
                आप <span className="text-[#047857] font-black">"एक पेड़ लोकतंत्र"</span> दिनांक <span className="text-amber-600 font-extrabold">05/06/2026</span> के नाम का हिस्सा बनने जा रहे हो | 😊
              </p>
              
              {currentQuote && (
                <div className="border-t border-emerald-250 pt-3 mt-2 text-center">
                  <span className="text-[9px] font-black text-amber-600 block uppercase tracking-widest mb-1">🌿 प्रकृति संदेश (Environment Message) 🌿</span>
                  <p className="text-slate-800 italic font-serif text-xs font-black leading-relaxed">
                    "{currentQuote}"
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 justify-center mt-6">
              <button
                onClick={() => {
                  speakText(`आपका स्वागत है। आप एक पेड़ लोकतंत्र दिनांक 05 जून 2026 के नाम का हिस्सा बनने जा रहे हो। प्रकृति का सुविचार है - ${currentQuote}`);
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all select-none cursor-pointer border ${
                  isSpeaking 
                    ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse" 
                    : "bg-amber-55 text-amber-850 border-amber-200 hover:bg-amber-100"
                }`}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4 text-rose-600 animate-spin" /> : <Volume2 className="w-4 h-4 text-amber-700" />}
                <span>{isSpeaking ? "आवाज बंद करें (Stop)" : "🗣 ऑडियो स्वागत संदेश सुनें"}</span>
              </button>

              <button
                onClick={() => {
                  if (typeof window !== "undefined" && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                  }
                  setIsSpeaking(false);
                  setShowWelcomeModal(false);
                }}
                className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-700 hover:bg-emerald-800 hover:shadow-lg transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1"
              >
                <span>आगे बढ़ें (Enter Campaign) 🌳</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Accessibility Talkback Assistance Button */}
      <div className="fixed bottom-6 left-6 z-40 no-print transition-all">
        <button
          onClick={() => {
            let message = "";
            if (!data.recipientName.trim()) {
              message = `नमस्ते! "एक पेड़ लोकतंत्र" अभियान में आपका स्वागत है। विश्व पर्यावरण दिवस, पांच जून दो हज़ार छब्बीस के इस पावन उपलक्ष्य में, कृपया अपना प्रमाणपत्र तैयार करने के लिए बाईं ओर दिए गए इनपुट बॉक्स में अपना नाम, पिता या पति का नाम, और मोबाइल नंबर दर्ज करें। आपके द्वारा दर्ज किए गए विवरणों को पूरी तरह से सुरक्षित कर स्टांप के साथ आपका ए-फोर आकार का प्रमाणपत्र लाइव डाउनलोड के लिए तैयार कर दिया जाएगा। धन्यवाद!`;
            } else {
              message = `बधाई हो, ${data.recipientName}! आपका "एक पेड़ लोकतंत्र" प्रमाणपत्र संख्या ${data.certificateId} सफलतापूर्वक लाइव संकलित कर तैयार किया जा चुका है। आपने इस पावन उपलक्ष्य में पेड़ लगाने और मतदान करने की शपथ ली है। आप इस प्रमाणपत्र को नीचे दी गई बटन की सहायता से पीडीएफ या इमेज रूप में डाउनलोड कर सकते हैं। पर्यावरण और लोकतंत्र की सुदृढ़ता में योगदान के लिए आपका आभार!`;
            }
            speakText(message);
          }}
          title="टॉकबैक ऑडियो सहायक (Toggle Talkback Voice Assistance)"
          className={`px-4 py-3 rounded-full flex items-center gap-2 shadow-xl border cursor-pointer active:scale-95 transition-all select-none text-xs font-black hover:shadow-2xl ${
            isSpeaking
              ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-500 animate-pulse"
              : "bg-emerald-750 hover:bg-emerald-800 text-white border-emerald-600"
          }`}
        >
          {isSpeaking ? (
            <>
              <VolumeX className="w-4.5 h-4.5 text-white" />
              <span>ऑडियो बंद करें (Talkback X)</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4.5 h-4.5 text-amber-300 animate-bounce" />
              <span>🗣 टॉकबैक सहायक (Talkback Live)</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}

