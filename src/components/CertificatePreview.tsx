/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from "react";
import { CertificateData, TREES_LIST } from "../types";
import { ECILogo, AshokaEmblem, TreeOfDemocracyLogo, VerificationStamp } from "./Icons";
import { jsPDF } from "jspdf";
import { toPng } from "html-to-image";
import { 
  Check, 
  Download, 
  Image as ImageIcon, 
  Sparkles, 
  Loader2, 
  Share2, 
  Clipboard, 
  Printer,
  Cloud,
  ExternalLink,
  Trash2,
  LogOut,
  FolderOpen
} from "lucide-react";
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  getOrCreateFolder, 
  uploadCertificate, 
  listCertificates, 
  DriveFile 
} from "../lib/driveAuth";
import { User } from "firebase/auth";

interface CertificatePreviewProps {
  data: CertificateData;
  onDownloadProcessed?: (format: "pdf" | "png" | "print") => void;
}

export const CertificatePreview: React.FC<CertificatePreviewProps> = ({ data, onDownloadProcessed }) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState<"idle" | "pdf" | "png" | "share">("idle");
  const [copySuccess, setCopySuccess] = useState(false);
  const [scale, setScale] = useState(1);

  // Google Drive Integration States
  const [driveUser, setDriveUser] = useState<User | null>(null);
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveFolderId, setDriveFolderId] = useState<string | null>(null);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [gdriveStatusMessage, setGdriveStatusMessage] = useState<string | null>(null);

  // Auto-authenticate and check Drive folder content on mount
  React.useEffect(() => {
    const unsubscribe = initAuth(
      async (firebaseUser, token) => {
        setDriveUser(firebaseUser);
        setDriveToken(token);
        setApiLoading(true);
        try {
          const fid = await getOrCreateFolder(token);
          setDriveFolderId(fid);
          const files = await listCertificates(token, fid);
          setDriveFiles(files);
        } catch (error) {
          console.error("Auto load drive folder failed:", error);
        } finally {
          setApiLoading(false);
        }
      },
      () => {
        setDriveUser(null);
        setDriveToken(null);
        setDriveFolderId(null);
        setDriveFiles([]);
      }
    );
    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  const handleGoogleSignIn = async () => {
    setApiLoading(true);
    setGdriveStatusMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setDriveUser(result.user);
        setDriveToken(result.accessToken);
        const fid = await getOrCreateFolder(result.accessToken);
        setDriveFolderId(fid);
        const files = await listCertificates(result.accessToken, fid);
        setDriveFiles(files);
        setGdriveStatusMessage("गूगल ड्राइव सफलतापूर्वक लिंक हो गया है! 😊");
      }
    } catch (err: any) {
      console.error("Drive link error:", err);
      setGdriveStatusMessage(`लिंकिंग विफल: ${err.message || err}`);
    } finally {
      setApiLoading(false);
    }
  };

  const handleGoogleSignOut = async () => {
    const confirmLogout = window.confirm("क्या आप गूगल ड्राइव सत्र को समाप्त करना चाहते हैं?");
    if (!confirmLogout) return;
    setApiLoading(true);
    try {
      await logout();
      setDriveUser(null);
      setDriveToken(null);
      setDriveFolderId(null);
      setDriveFiles([]);
      setGdriveStatusMessage("गूगल ड्राइव लिंक सफलतापूर्वक हटा दिया गया।");
    } catch (err: any) {
      console.error("Sign out error:", err);
    } finally {
      setApiLoading(false);
    }
  };

  const handleSaveToDrive = async (format: "pdf" | "png") => {
    if (!driveToken || !driveFolderId || !certificateRef.current) {
      alert("कृपया पहले गूगल ड्राइव लिंक करें।");
      return;
    }
    
    setIsSyncingDrive(true);
    setGdriveStatusMessage(`${format.toUpperCase()} तैयार किया जा रहा है और गूगल ड्राइव पर अपलोड हो रहा है...`);

    try {
      const element = certificateRef.current;
      
      // Get the image data URI
      const imgData = await toPng(element, {
        pixelRatio: 2.2,
        backgroundColor: "#FCFBF7",
        width: 1050,
        height: 742,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
        }
      });

      let fileBlob: Blob;
      let extension = "";
      let mimeType = "";

      if (format === "pdf") {
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: "a4",
        });
        pdf.addImage(imgData, "PNG", 0, 0, 297, 210, undefined, "FAST");
        fileBlob = pdf.output("blob");
        extension = "pdf";
        mimeType = "application/pdf";
      } else {
        const res = await fetch(imgData);
        fileBlob = await res.blob();
        extension = "png";
        mimeType = "image/png";
      }

      const cleanName = data.recipientName.replace(/\s+/g, "_");
      const fileName = `Ek_Ped_Loktantra_${cleanName}_${data.certificateId}.${extension}`;

      await uploadCertificate(driveToken, driveFolderId, fileName, mimeType, fileBlob);
      
      // Refresh list
      const files = await listCertificates(driveToken, driveFolderId);
      setDriveFiles(files);
      setGdriveStatusMessage(`बधाई हो! प्रमाणपत्र (${format.toUpperCase()}) सफलतापूर्वक आपके 'One Tree Democracy' गूगल ड्राइव फ़ोल्डर में सहेज लिया गया है। 🎉`);
    } catch (err: any) {
      console.error("Save to drive error:", err);
      setGdriveStatusMessage(`अपलोड विफल: ${err.message || err}`);
    } finally {
      setIsSyncingDrive(false);
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    const confirmed = window.confirm(`क्या आप गूगल ड्राइव से "${fileName}" प्रमाणपत्र बैकअप को हटाना चाहते हैं?`);
    if (!confirmed) return;

    if (!driveToken) return;
    setApiLoading(true);
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${driveToken}` }
      });
      if (!res.ok) {
        throw new Error("Unable to delete file from Google Drive");
      }
      setGdriveStatusMessage("फ़ाइल सफलतापूर्वक गूगल ड्राइव से हटा दी गई है।");
      if (driveFolderId) {
        const files = await listCertificates(driveToken, driveFolderId);
        setDriveFiles(files);
      }
    } catch (err: any) {
      console.error("Delete failed:", err);
      setGdriveStatusMessage(`फ़ाइल हटाने में विफलता: ${err.message || err}`);
    } finally {
      setApiLoading(false);
    }
  };

  React.useEffect(() => {
    if (!containerRef.current) return;
    const updateScale = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const padding = window.innerWidth < 640 ? 8 : 24; 
        const availableWidth = rect.width - padding;
        const computedScale = Math.min(1, availableWidth / 1050);
        setScale(computedScale);
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    
    const observer = new ResizeObserver(() => updateScale());
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateScale);
      observer.disconnect();
    };
  }, []);

  // Sync isGenerating changes globally for other components to display loading states in real-time
  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent("sveep_gen_status_changed", { detail: { status: isGenerating } }));
  }, [isGenerating]);

  // Find selected tree details
  const selectedTree = TREES_LIST.find((t) => t.id === data.treeId) || TREES_LIST[0];

  // Random-looking but deterministic QR code representation for official digital validation feel
  const qrCodeSvg = (
    <svg viewBox="0 0 100 100" className="w-16 h-16 opacity-75 sm:opacity-90 grayscale hover:grayscale-0 transition-all">
      <rect width="100" height="100" fill="transparent" />
      {/* Eye Top-Left */}
      <rect x="0" y="0" width="30" height="30" fill="#1e293b" />
      <rect x="5" y="5" width="20" height="20" fill="white" />
      <rect x="10" y="10" width="10" height="10" fill="#047857" />
      {/* Eye Top-Right */}
      <rect x="70" y="0" width="30" height="30" fill="#1e293b" />
      <rect x="75" y="5" width="20" height="20" fill="white" />
      <rect x="80" y="10" width="10" height="10" fill="#047857" />
      {/* Eye Bottom-Left */}
      <rect x="0" y="70" width="30" height="30" fill="#1e293b" />
      <rect x="5" y="75" width="20" height="20" fill="white" />
      <rect x="10" y="80" width="10" height="10" fill="#047857" />
      {/* Decorative random-looking bits */}
      <rect x="40" y="10" width="10" height="10" fill="#1e293b" />
      <rect x="50" y="20" width="20" height="10" fill="#047857" />
      <rect x="45" y="40" width="15" height="15" fill="#d97706" />
      <rect x="75" y="45" width="10" height="20" fill="#1e293b" />
      <rect x="40" y="70" width="20" height="10" fill="#128807" />
      <rect x="80" y="80" width="15" height="15" fill="#1e293b" />
      <rect x="50" y="80" width="10" height="10" fill="#d97706" />
    </svg>
  );

  const getBorderClasses = () => {
    switch (data.borderStyle) {
      case "classic":
        return "border-[16px] border-[#047857] outline-6 outline-[#D97706] outline-offset-[-12px]";
      case "eco-leaf":
        return "border-[12px] border-emerald-800 outline-8 outline-emerald-100 outline-offset-[-10px]";
      case "royal-gold":
        return "border-[16px] border-[#B8860B] outline-6 outline-yellow-600 outline-offset-[-12px]";
      case "traditional":
        return "border-[14px] border-[#78350F] outline-6 outline-[#D97706] outline-offset-[-11px]";
      default:
        return "border-[16px] border-[#047857] outline-6 outline-[#D97706] outline-offset-[-12px]";
    }
  };

  const formattedDate = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const handleDownloadPDF = async () => {
    if (!certificateRef.current) return;
    setIsGenerating("pdf");
    try {
      const element = certificateRef.current;
      
      const imgData = await toPng(element, {
        pixelRatio: 2.2,
        backgroundColor: "#FCFBF7",
        width: 1050,
        height: 742,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
        }
      });

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // A4 landscape dimensions: 297mm x 210mm
      pdf.addImage(imgData, "PNG", 0, 0, 297, 210, undefined, "FAST");
      pdf.save(`Ek_Ped_Loktantra_Ke_Naam_${data.recipientName.replace(/\s+/g, "_")}.pdf`);
      
      // Trigger log
      onDownloadProcessed?.("pdf");
    } catch (err) {
      console.error("PDF download error:", err);
    } finally {
      setIsGenerating("idle");
    }
  };

  const handleDownloadPNG = async () => {
    if (!certificateRef.current) return;
    setIsGenerating("png");
    try {
      const element = certificateRef.current;
      
      const image = await toPng(element, {
        pixelRatio: 2.2,
        backgroundColor: "#FCFBF7",
        width: 1050,
        height: 742,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
        }
      });

      const link = document.createElement("a");
      link.href = image;
      link.download = `Ek_Ped_Loktantra_Ke_Naam_${data.recipientName.replace(/\s+/g, "_")}.png`;
      link.click();

      // Trigger log
      onDownloadProcessed?.("png");
    } catch (err) {
      console.error("PNG download error:", err);
    } finally {
      setIsGenerating("idle");
    }
  };

  const handleCopyValidationLink = async () => {
    setIsGenerating("share");
    try {
      const link = `${window.location.origin}/verify?id=${data.certificateId}`;
      await navigator.clipboard.writeText(link);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (err) {
      console.error("Copy link error:", err);
    } finally {
      setIsGenerating("idle");
    }
  };

  const handlePrint = () => {
    window.print();
    onDownloadProcessed?.("print");
  };

  // Listen for download triggers dispatched from other controls (e.g., Left Panel Export Desk)
  React.useEffect(() => {
    const handleAction = (e: Event) => {
      const customEvent = e as CustomEvent;
      const format = customEvent.detail?.format;
      if (format === "pdf") {
        handleDownloadPDF();
      } else if (format === "png") {
        handleDownloadPNG();
      } else if (format === "print") {
        handlePrint();
      } else if (format === "share") {
        handleCopyValidationLink();
      }
    };
    window.addEventListener("sveep_action_download", handleAction);
    return () => window.removeEventListener("sveep_action_download", handleAction);
  }, [data, handleDownloadPDF, handleDownloadPNG, handleCopyValidationLink, handlePrint]);

  return (
    <div className="flex flex-col items-center w-full shadow-xs">
      {/* Certificate Viewer Wrapper - Responsive Auto Scale container */}
      <div 
        ref={containerRef}
        className="w-full flex justify-center bg-stone-100 p-2 sm:p-4 rounded-3xl border border-stone-200/60 shadow-inner overflow-hidden select-none"
      >
        <div 
          className="transition-all duration-75 flex justify-center items-start" 
          style={{ 
            width: "1050px", 
            height: `${742 * scale}px`,
            transform: `scale(${scale})`,
            transformOrigin: "top center"
          }}
        >
          {/* Real Certificate Content Container formatted to A4 Landscape Ratio (1.414 / 1) */}
          <div
            id="certificate-print-node"
            ref={certificateRef}
            className={`relative w-[1050px] h-[742px] min-w-[1050px] bg-[#FCFBF7] font-serif p-14 flex flex-col justify-between shadow-2xl overflow-hidden ${
              data.borderStyle === "classic" ? "" : getBorderClasses()
            }`}
          >
          {/* TIRANGA BORDER OVERLAYS (Saffron - White - Green) for Classic/Default style */}
          {data.borderStyle === "classic" && (
            <>
              {/* Saffron / Orange (Outer border) */}
              <div className="absolute inset-0 border-[16px] border-[#FF671F] pointer-events-none z-30" />
              {/* White Divider */}
              <div className="absolute inset-[16px] border-[4px] border-white pointer-events-none z-30" />
              {/* India Green (Inner border) */}
              <div className="absolute inset-[20px] border-[12px] border-[#128807] pointer-events-none z-30" />
              {/* Golden Inner Frame Line */}
              <div className="absolute inset-[32px] border border-amber-600/25 pointer-events-none z-30" />
            </>
          )}

          {/* Subtle Eco Tree Watermark in Background - Semi-transparent and high-resolution */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 opacity-[0.24]">
            <TreeOfDemocracyLogo className="w-[330px] h-[330px]" watermark={true} />
          </div>

          {/* Golden Seal Texture/Flourishes in Corners */}
          <div className="absolute top-8 left-8 pointer-events-none select-none text-2xl font-sans z-20" style={{ color: "rgba(217, 119, 6, 0.15)" }}>🌸</div>
          <div className="absolute top-8 right-8 pointer-events-none select-none text-2xl font-sans z-20" style={{ color: "rgba(217, 119, 6, 0.15)" }}>🌸</div>
          <div className="absolute bottom-8 left-8 pointer-events-none select-none text-2xl font-sans z-20" style={{ color: "rgba(217, 119, 6, 0.15)" }}>🌸</div>
          <div className="absolute bottom-8 right-8 pointer-events-none select-none text-2xl font-sans z-20" style={{ color: "rgba(217, 119, 6, 0.15)" }}>🌸</div>

          {/* TOP BANNER: Official Branding & Logos */}
          <div className="relative z-10 flex items-center justify-between border-b-2 pb-4" style={{ borderBottomColor: "rgba(6, 95, 70, 0.15)" }}>
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] tracking-wide font-sans text-stone-500 font-bold text-left">SYSTEMATIC VOTERS' EDUCATION</span>
                <span className="text-[10px] tracking-wide font-sans text-stone-500 font-bold text-left">AND ELECTORAL PARTICIPATION</span>
                <span className="text-emerald-800 text-sm font-bold font-sans text-left">E.C.I. - SVEEP 2026</span>
              </div>
            </div>

            <div className="flex flex-col items-center text-center px-4 max-w-[480px] -mt-1 justify-center">
              <h1 className="text-stone-850 text-xl font-bold tracking-tight font-serif uppercase">
                कार्यालय जिला निर्वाचन अधिकारी एवं जिला कलेक्टर, डीग
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex flex-col text-right">
                <span className="text-[11px] font-sans text-emerald-800 font-black tracking-wider">विश्व पर्यावरण दिवस</span>
                <span className="text-[10px] font-sans text-amber-600 font-bold">05 जून, 2026</span>
                <span className="text-[10px] font-mono text-stone-500 font-bold">Reg No: {data.certificateId}</span>
              </div>
            </div>
          </div>

          {/* MAIN HEADER OF THE CERTIFICATE */}
          <div className="relative z-10 text-center my-1">
            <span className="text-amber-600 font-sans font-extrabold tracking-widest text-[11px] uppercase block mb-1">
              - सहभागिता प्रमाण पत्र / CERTIFICATE OF SVEEP PARTICIPATION -
            </span>
            <h2 className="text-[#047857] text-3xl font-extrabold font-serif tracking-normal drop-shadow-xs mb-1">
              एक पेड़ लोकतंत्र के नाम
            </h2>
            <div className="flex items-center justify-center gap-2">
              <div className="h-[1px] w-20 bg-amber-500"></div>
              <span className="text-stone-600 font-sans text-xs italic tracking-wider font-semibold">Tree of Democracy - 2026</span>
              <div className="h-[1px] w-20 bg-amber-500"></div>
            </div>
          </div>

          {/* CERTIFICATE TEXT BODY */}
          <div className="relative z-10 text-center px-12 leading-relaxed text-stone-800">
            <p className="text-sm font-sans italic text-stone-500 mb-2">
              यह गर्व और कृतज्ञता के साथ प्रमाणित किया जाता है कि
            </p>

            {/* Recipient's Name Box */}
            <div className="mb-3">
              <span className="font-yatra text-3xl text-emerald-950 px-8 py-1 border-b-4 border-double border-amber-600 inline-block drop-shadow-xs tracking-wide">
                {data.recipientName}
              </span>
            </div>

            {/* Guardian & Location Details */}
            <div className="text-sm font-serif space-y-1 text-stone-800 font-medium">
              <p className="text-stone-600 font-sans text-xs">
                सुपुत्र/सुपुत्री/पत्नी:{" "}
                <span className="text-stone-900 font-bold font-serif text-sm px-1 select-all">
                  {data.guardianName || "——————————"}
                </span>
              </p>
              <p className="text-[13px]">
                विधानसभा निर्वाचन क्षेत्र:{" "}
                <span className="font-bold text-stone-950">{data.assemblyConstituency}</span> &nbsp;|&nbsp; ब्लॉक:{" "}
                <span className="font-bold text-stone-950">{data.block}</span> &nbsp;|&nbsp; जिला:{" "}
                <span className="font-bold text-stone-950">{data.district}</span>
              </p>
            </div>

            {/* Achievement text with beautifully highlighted plant name */}
            <div className="mt-4 max-w-[840px] mx-auto text-[14.5px] text-stone-800 font-serif leading-relaxed">
              <span>इन्होंने विश्व पर्यावरण दिवस पर पर्यावरण संरक्षण एवं लोकतांत्रिक मूल्यों की सुदृढ़ता के पावन संकल्प के साथ अपने स्वर्णिम मताधिकार की जागृति हेतु अपने क्षेत्र में </span>
              <span className="px-2.5 py-1 rounded-lg border border-emerald-300 font-bold text-emerald-900 text-sm whitespace-nowrap inline-flex items-center gap-1" style={{ backgroundColor: "rgba(209, 250, 229, 0.85)" }}>
                🌱 वृक्षारोपण
              </span>
              <span> का यशस्वी संपादन कर देश के प्रति अपने नागरिक कर्त्तव्यों का प्रशंसनीय निर्वहन किया है। इस पर्यावरण संकल्प को आपके सम्मान में </span>
              <span className="text-[#D97706] font-bold">"लोकतंत्र का रक्षक वृक्ष / Tree of Democracy"</span>
              <span> का आधिकारिक स्थान प्रदान किया गया है।</span>
            </div>
          </div>

          {/* BOTTOM ROW: Voter Pledge, Stamp, & Signature */}
          <div className="relative z-10 grid grid-cols-12 gap-4 items-end mt-2 pt-2 border-t border-stone-200">
            {/* Left: Voter Pledge Box */}
            <div className="col-span-5 flex flex-col justify-between self-stretch border border-emerald-100 rounded-xl p-3 text-left" style={{ backgroundColor: "rgba(236, 253, 245, 0.50)" }}>
              <div>
                <span className="text-[10px] font-black text-emerald-800 font-sans block mb-1 tracking-wider uppercase">
                  ✓ स्वीप मतदाता महा-शपथ (Voter Oath)
                </span>
                <p className="text-[10.5px] leading-relaxed text-emerald-950 font-serif font-medium">
                  “मैं निष्ठापूर्वक प्रतिज्ञा करता/करती हूँ कि मैं रोपित वृक्ष की सदैव देखभाल करूँगा/करूँगी तथा आने वाले चुनावों में स्वयं एवं परिवारजनों का शत-प्रतिशत मतदान सुनिश्चित कर, भारतीय लोकतंत्र को सशक्त बनाने में अपना योगदान दूँगा/दूँगी।”
                </p>
              </div>

              {data.pledgeAccepted && (
                <div className="flex items-center gap-2 mt-2 pt-1 border-t" style={{ borderColor: "rgba(167, 243, 208, 0.50)" }}>
                  <div className="bg-emerald-600 text-white rounded-full p-0.5">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-700 font-sans tracking-wide">
                    संकल्पित वोटर (Eco-Pledge Verified: {formattedDate(data.plantationDate)})
                  </span>
                </div>
              )}
            </div>

            {/* Middle: Date of Issue only (QR Code removed) */}
            <div className="col-span-3 flex flex-col items-center justify-center text-center self-stretch py-2">
              <span className="text-[10px] font-sans font-black text-stone-500 uppercase tracking-widest leading-none mb-1 shadow-xs">
                प्रमाणपत्र तिथि (Date)
              </span>
              <span className="text-sm font-mono font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-150 inline-block">
                {formattedDate(data.plantationDate)}
              </span>
            </div>

            {/* Right: Signature & Stamp */}
            <div className="col-span-4 flex items-end justify-between text-right relative">
              {/* Seal Stamp placed perfectly overlaps ERO info slightly */}
              <div className="absolute left-[-20px] bottom-[-2px] z-10 pointer-events-none scale-[0.85] origin-bottom-left">
                <VerificationStamp 
                  sealColor={data.sealColor} 
                  textHindi={data.stampTextHindi} 
                  textEnglish={data.stampTextEnglish} 
                />
              </div>

              {/* Signature block */}
              <div className="flex flex-col items-end w-full pl-16 z-20">
                {data.isE_Signed ? (
                  <div className="h-10 flex items-center justify-end px-3">
                    <span className="font-signature text-2.5xl text-blue-800 font-bold select-none tracking-wide pr-4">
                      {data.customSignatureText}
                    </span>
                  </div>
                ) : (
                  <div className="h-10"></div>
                )}
                <div className="w-44 h-[1.5px] bg-stone-400"></div>
                <div className="text-right mt-1.5">
                  <p className="text-xs font-bold text-stone-900 leading-tight">({data.eroName})</p>
                  <p className="text-[9.5px] font-semibold text-[#047857] leading-tight font-sans tracking-tight">
                    {data.eroDesignation}
                  </p>
                  <p className="text-[8.5px] font-bold text-stone-400 font-sans tracking-wider leading-none">
                    Electoral Registration Officer
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Side Developer Credit & Online Generation disclaimer */}
          <div className="absolute bottom-[28px] left-1/2 -translate-x-1/2 text-[9px] font-sans text-stone-500 pointer-events-none tracking-wider select-none z-30 text-center w-full">
            <div>✔ यह प्रमाण पत्र पूर्णतः ऑनलाइन जनरेट किया गया है। (This is a fully online generated certificate)</div>
            <div className="text-[8px] font-extrabold text-stone-400 mt-0.5 uppercase tracking-widest">Developed by Chandr Shekhar Gautam and Kushagra Gaaur</div>
          </div>
        </div>
      </div>
    </div>

      {/* ACTION CONTROLS PANEL */}
      <div className="w-full mt-6 bg-white p-4 rounded-2xl border border-stone-200 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 no-print">
        <div className="flex flex-col">
          <h4 className="text-stone-800 font-bold inline-flex items-center gap-1.5 text-sm sm:text-base">
            <Sparkles className="w-4 h-4 text-emerald-600 animate-leaf" />
            प्रमाणपत्र तैयार है | Download Your Eco-Vote Certificate
          </h4>
          <p className="text-xs text-stone-500 mt-0.5 sm:block hidden">
            यह प्रमाण पत्र शत-प्रतिशत आधिकारिक प्रारूप में उच्च गुणवत्ता वाली संवहनीय पीडीएफ (A4 आकार) में डाउनलोड होगा।
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 w-full md:w-auto justify-end">
          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 border border-stone-300 hover:bg-stone-200 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4 text-stone-700" />
            प्रिंट करें
          </button>

          {/* Copy Verification link */}
          <button
            onClick={handleCopyValidationLink}
            disabled={isGenerating !== "idle"}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
              copySuccess
                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                : "bg-amber-50 text-amber-850 border-amber-300 hover:bg-amber-100"
            }`}
          >
            {copySuccess ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {copySuccess ? "लिंक कॉपी हो गया!" : "शेयर / कॉपी लिंक"}
          </button>

          {/* PNG Download */}
          <button
            onClick={handleDownloadPNG}
            disabled={isGenerating !== "idle"}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-850 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            {isGenerating === "png" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ImageIcon className="w-4 h-4 text-emerald-700" />
            )}
            इमेज (PNG) डाउनलोड
          </button>

          {/* Standard PDF Download */}
          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating !== "idle"}
            className="px-4.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 transition-all shadow-md hover:shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            {isGenerating === "pdf" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4 text-white" />
            )}
            {isGenerating === "pdf" ? "पीडीएफ बन रहा है..." : "पीडीएफ (PDF) डाउनलोड"}
          </button>
        </div>
      </div>

      {/* GOOGLE DRIVE SYNC & BACKUP WORKSPACE */}
      <div className="w-full mt-6 bg-white p-5 md:p-6 rounded-[24px] border border-stone-200 shadow-lg flex flex-col gap-6 no-print">
        
        {/* Banner Title */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div className="flex items-start gap-3">
            <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-2xl border border-emerald-100 shadow-xs">
              <Cloud className="w-6 h-6 text-emerald-700 animate-pulse" />
            </div>
            <div>
              <h4 className="text-stone-900 font-black text-sm sm:text-base leading-tight flex items-center gap-1.5 font-serif">
                ☁️ गूगल ड्राइव क्लाउड बैकअप (Secure Google Drive Storage)
              </h4>
              <p className="text-xs text-stone-500 mt-1">
                प्रमाणपत्र को सीधे अपने निजी गूगल ड्राइव के सुरक्षित फ़ोल्डर में सहेजें तथा प्रबंधन करें।
              </p>
            </div>
          </div>

          {/* If logged in, show user info & logout */}
          {driveUser && (
            <div className="flex items-center gap-3 bg-stone-50 border border-stone-200/60 p-2 rounded-xl self-start sm:self-center">
              {driveUser.photoURL ? (
                <img src={driveUser.photoURL} alt={driveUser.displayName || "User"} referrerPolicy="no-referrer" className="w-7 h-7 rounded-full shadow-inner" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs font-serif">
                  {driveUser.displayName?.charAt(0) || "U"}
                </div>
              )}
              <div className="text-left">
                <span className="text-[11px] font-black text-stone-800 block leading-tight">{driveUser.displayName}</span>
                <span className="text-[9.5px] text-stone-450 font-mono block leading-none">{driveUser.email}</span>
              </div>
              <button
                onClick={handleGoogleSignOut}
                title="साइन आउट करें"
                className="p-1 px-2 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-all text-xs flex items-center gap-0.5 font-bold cursor-pointer animate-fade-in"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>लॉगआउट</span>
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Warning / Status Messages */}
        {gdriveStatusMessage && (
          <div className="bg-amber-50/70 border border-amber-105 p-3.5 rounded-xl text-xs font-serif font-extrabold text-stone-800 flex items-center gap-2">
            <span className="text-amber-600 font-extrabold">📌 संदेश:</span>
            <span>{gdriveStatusMessage}</span>
          </div>
        )}

        {/* Core Actions */}
        {!driveUser ? (
          <div className="flex flex-col items-center justify-center py-6 text-center max-w-md mx-auto space-y-4">
            <div className="bg-amber-50 p-4 rounded-full border border-amber-100">
              <FolderOpen className="w-8 h-8 text-amber-600 animate-bounce" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium font-serif leading-relaxed text-stone-700">
                अपने प्रमाणपत्र को ड्राइव में सहेजने के लिए कृपया गूगल क्रेडेंशियल्स के साथ सुरक्षित रूप से प्रमाणीकरण (Authentication) पूरा करें।
              </p>
            </div>
            
            {/* Standard compliant Google button layout */}
            <button 
              onClick={handleGoogleSignIn}
              disabled={apiLoading}
              className="gsi-material-button w-full sm:w-auto h-11 shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center justify-center cursor-pointer border border-stone-200 rounded-xl bg-white"
            >
              <div className="gsi-material-button-state"></div>
              <div className="gsi-material-button-content-wrapper flex items-center gap-2 px-4 py-1.5 justify-center font-sans font-bold">
                <div className="gsi-material-button-icon flex items-center justify-center">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: "block", width: "20px", height: "20px" }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span className="gsi-material-button-contents text-stone-700 text-xs font-black font-sans">गूगल के साथ लॉगिन करें (Link Google Account)</span>
              </div>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            
            {/* Backup actions triggers */}
            <div className="bg-stone-50/50 p-4 rounded-2xl border border-stone-200/50 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-left w-full md:w-auto">
                <span className="text-[10px] font-black text-amber-600 block uppercase tracking-wider">📤 क्लाउड बैकअप सहेजने के विकल्प</span>
                <p className="text-xs font-serif font-black text-stone-800 leading-relaxed mt-1">
                  दस्तावेज़ सीधे आपके <strong className="text-emerald-800">"One Tree Democracy - एक पेड़ लोकतंत्र"</strong> फ़ोल्डर में क्लाउड सुरक्षित स्थान पर जमा होंगे।
                </p>
              </div>

              <div className="flex gap-2.5 items-center w-full md:w-auto justify-end">
                {/* Save PNG to Drive */}
                <button
                  onClick={() => handleSaveToDrive("png")}
                  disabled={isSyncingDrive || apiLoading}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-emerald-850 bg-white hover:bg-emerald-50 border border-emerald-250 cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1.5 active:scale-95 shadow-xs"
                >
                  {isSyncingDrive ? <Loader2 className="w-4 h-4 animate-spin text-emerald-700" /> : <ImageIcon className="w-4 h-4 text-emerald-700" />}
                  <span>Drive में सहेजें (PNG Image)</span>
                </button>

                {/* Save PDF to Drive */}
                <button
                  onClick={() => handleSaveToDrive("pdf")}
                  disabled={isSyncingDrive || apiLoading}
                  className="px-4 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-750 hover:bg-emerald-800 cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1.5 active:scale-95 shadow-md"
                >
                  {isSyncingDrive ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Cloud className="w-4 h-4 text-white" />}
                  <span>Drive में अपलोड करें (Official PDF)</span>
                </button>
              </div>
            </div>

            {/* List of saved documents inside Google Drive Campaign Folder */}
            <div className="border border-stone-200/85 rounded-2xl overflow-hidden shadow-xs">
              <div className="bg-stone-50 px-4 py-3 border-b border-stone-200 flex justify-between items-center flex-wrap gap-2">
                <span className="text-xs font-black text-[#047857] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  📂 ड्राइव में पूर्व सुरक्षित प्रमाण पत्र ({driveFiles.length})
                </span>
                <span className="text-[10px] font-mono text-stone-400 font-bold">
                  पाथ: Google Drive / One Tree Democracy - एक पेड़ लोकतंत्र
                </span>
              </div>

              {apiLoading ? (
                <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
                  <span className="text-xs text-stone-500 font-serif font-bold">ड्राइव डायरेक्ट्री सिंक हो रही है...</span>
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="py-8 text-center flex flex-col items-center justify-center p-4">
                  <Cloud className="w-10 h-10 text-stone-300 mb-2 animate-bounce" />
                  <p className="text-xs font-serif text-stone-500 font-bold">
                    वर्तमान में गूगल ड्राइव फ़ोल्डर में कोई भी बैकअप प्रमाणपत्र सुरक्षित नहीं है।
                  </p>
                  <p className="text-[10.5px] text-stone-400 mt-1">
                    बटन की मदद से अपने प्रमाणपत्र को सुरक्षित क्लाउड सर्वर बैकअप पर सहेजें।
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-stone-50/70 border-b border-stone-200 text-[10px] text-stone-450 font-black uppercase tracking-wider font-mono">
                        <th className="p-3">दस्तावेज़ नाम (File Name)</th>
                        <th className="p-3">प्रकार (Type)</th>
                        <th className="p-3">आकार (Size)</th>
                        <th className="p-3">सृजन तिथि (Created At)</th>
                        <th className="p-3 text-right">कार्रवाई (Actions)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 bg-white">
                      {driveFiles.map((file) => {
                        const isPdf = file.mimeType.includes("pdf");
                        const fileSizeKb = file.size ? Math.round(parseInt(file.size) / 1024) : null;
                        const dateObj = new Date(file.createdTime);
                        const formattedDateStr = dateObj.toLocaleDateString("hi-IN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        });

                        return (
                          <tr key={file.id} className="hover:bg-stone-50/50 transition-all font-sans">
                            <td className="p-3 font-medium text-stone-850 break-all max-w-xs">{file.name}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                                isPdf 
                                  ? "bg-rose-50 text-rose-700 border border-rose-100" 
                                  : "bg-blue-50 text-blue-700 border border-blue-100"
                              }`}>
                                {isPdf ? "PDF" : "PNG"}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-stone-550">
                              {fileSizeKb ? `${fileSizeKb} KB` : "N/A"}
                            </td>
                            <td className="p-3 font-serif text-stone-600">{formattedDateStr}</td>
                            <td className="p-3 text-right">
                              <div className="flex items-center gap-1.5 justify-end">
                                {/* Open in Drive */}
                                <a
                                  href={file.webViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 transition-all text-stone-700 hover:text-stone-900 flex items-center gap-1 font-bold shadow-2xs whitespace-nowrap"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>खोलें</span>
                                </a>

                                {/* Delete button with confirmation */}
                                <button
                                  onClick={() => handleDeleteFile(file.id, file.name)}
                                  disabled={apiLoading}
                                  title="ड्राइव से प्रमाणपत्र हटाएं"
                                  className="p-1.5 rounded-lg border border-rose-100 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

