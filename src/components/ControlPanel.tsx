/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { CertificateData, TREES_LIST, ASSEMBLY_SEATS, SWEEP_SLOGANS, BLOCKS_LIST } from "../types";
import { Sparkles, RefreshCw, User, Clipboard, Calendar, ShieldCheck, MapPin, Award, CheckSquare, Edit3, Download, Image as ImageIcon, Printer, Share2, Loader2, Check } from "lucide-react";

interface ControlPanelProps {
  data: CertificateData;
  onChange: (newData: CertificateData) => void;
  isAdminMode: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ 
  data, 
  onChange, 
  isAdminMode 
}) => {
  const updateField = (key: keyof CertificateData, value: any) => {
    onChange({ ...data, [key]: value });
  };

  const handleRandomizeId = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const codes = ["DEEG", "NAGAR", "KAMAN", "SVEEP"];
    const code = codes[Math.floor(Math.random() * codes.length)];
    updateField("certificateId", `SVEEP/${code}/2026/${randomNum}`);
  };

  return (
    <div className="bg-white rounded-2xl border border-emerald-100 shadow-md p-4 sm:p-6 w-full space-y-6">
      <div className="border-b border-stone-100 pb-3">
        <h3 className="font-bold text-stone-850 flex items-center gap-2 text-md sm:text-lg">
          <Edit3 className="w-5 h-5 text-[#047857]" />
          प्रमाणपत्र कस्टमाइजेशन | Certificate Details
        </h3>
        <p className="text-xs text-stone-500 mt-0.5">
          यहाँ विवरण भरें, प्रमाण पत्र स्वतः ही लाइव रूप में अपडेट हो जायेगा।
        </p>
      </div>

      {/* SECTION 1: Recipient Identity (विवरण) */}
      <div className="space-y-4">
        <span className="text-xs font-black text-[#047857] tracking-wider uppercase flex items-center gap-1.5 border-b border-stone-100 pb-1">
          <User className="w-3.5 h-3.5" /> 1. व्यक्तिगत जानकारी / Personal Credentials
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              मतदाता / नागरिक का नाम (Recipient Name) *
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="यहाँ नाम दर्ज करें"
                value={data.recipientName}
                onChange={(e) => updateField("recipientName", e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                id="recipient_name_field"
              />
              <span className="absolute right-3 top-2.5 text-stone-450 font-mono text-[10px] select-none">दिनांकित</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              पिता या पति का नाम (Father's/Guardian Name)
            </label>
            <input
              type="text"
              placeholder="यहाँ पिता या पति का नाम दर्ज करें"
              value={data.guardianName}
              onChange={(e) => updateField("guardianName", e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
              id="guardian_name_field"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              मोबाइल नंबर (Mobile Number) *
            </label>
            <input
              type="text"
              maxLength={10}
              placeholder="10 अंकों का मोबाइल नंबर दर्ज करें"
              value={data.mobileNumber || ""}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                updateField("mobileNumber", val);
              }}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
              id="mobile_number_field"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              विधानसभा क्षेत्र (Seat)
            </label>
            <select
              value={data.assemblyConstituency}
              onChange={(e) => updateField("assemblyConstituency", e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
              id="constituency_select"
            >
              {ASSEMBLY_SEATS.map((seat) => (
                <option key={seat.id} value={seat.nameHindi}>
                  {seat.nameHindi}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              ब्लॉक क्षेत्र (Block) *
            </label>
            <select
              value={data.block}
              onChange={(e) => updateField("block", e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-bold"
              id="block_select"
            >
              {BLOCKS_LIST.map((b) => (
                <option key={b.id} value={b.nameHindi}>
                  {b.nameHindi} ({b.nameEnglish})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              जिला (District Name)
            </label>
            <input
              type="text"
              value={data.district}
              onChange={(e) => updateField("district", e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
              id="district_field"
            />
          </div>
        </div>
      </div>

      {/* SECTIONS 2, 3, 4 (Only visible when Admin Mode is enabled) */}
      {isAdminMode && (
        <>
          {/* SECTION 2: Environmental Tree Details (वृक्ष रोपण) */}
          <div className="space-y-4 pt-2 border-t border-stone-100">
            <span className="text-xs font-black text-[#047857] tracking-wider uppercase flex items-center gap-1.5 border-b border-stone-100 pb-1">
              <Award className="w-3.5 h-3.5 text-emerald-700" /> 2. वृक्षारोपण विवरण / Plantation Info
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  रोपित वृक्ष का चयन (Choose Tree Planted)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TREES_LIST.map((tree) => {
                    const isSelected = data.treeId === tree.id;
                    return (
                      <button
                        key={tree.id}
                        type="button"
                        onClick={() => updateField("treeId", tree.id)}
                        className={`p-2 rounded-xl text-xs flex flex-col items-center justify-center border text-center transition-all cursor-pointer ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs"
                            : "border-stone-200 bg-stone-50 text-stone-550 hover:bg-stone-100"
                        }`}
                      >
                        <span className="text-lg">🌱</span>
                        <span className="mt-0.5 whitespace-nowrap block truncate w-full text-[10.5px]">
                          {tree.nameHindi}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-stone-400 mt-1.5">
                  चयनित वृक्ष का वैज्ञानिक नाम और महत्व प्रमाण पत्र में समाहित होगा।
                </p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    रोपण दिनांक (Plantation Date)
                  </label>
                  <input
                    type="date"
                    value={data.plantationDate}
                    onChange={(e) => updateField("plantationDate", e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-mono"
                    id="plantation_date_field"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-700">
                      प्रमाणपत्र क्रमांक (Certificate Serial)
                    </label>
                    <button
                      onClick={handleRandomizeId}
                      className="text-[10.5px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> नया नंबर
                    </button>
                  </div>
                  <input
                    type="text"
                    value={data.certificateId}
                    onChange={(e) => updateField("certificateId", e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-mono"
                    id="serial_id_field"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Authorized Officer details (अधिकारी विवरण) */}
          <div className="space-y-4 pt-2 border-t border-stone-100">
            <span className="text-xs font-black text-[#047857] tracking-wider uppercase flex items-center gap-1.5 border-b border-stone-100 pb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> 3. अधिकृत अधिकारी विवरण / ERO Signature
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  अधिकारी का नाम (Authorized Officer)
                </label>
                <input
                  type="text"
                  placeholder="उदा. श्री मोहन सिंह"
                  value={data.eroName}
                  onChange={(e) => updateField("eroName", e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-bold font-serif"
                  id="ero_name_field"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  पदनाम (Officer Designation)
                </label>
                <input
                  type="text"
                  placeholder="उदा. निर्वाचक रजिस्ट्रीकरण अधिकारी (SDM)"
                  value={data.eroDesignation}
                  onChange={(e) => updateField("eroDesignation", e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all text-xs"
                  id="ero_designation_field"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_e_signed_checkbox"
                  checked={data.isE_Signed}
                  onChange={(e) => updateField("isE_Signed", e.target.checked)}
                  className="w-4.5 h-4.5 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300 cursor-pointer"
                />
                <label htmlFor="is_e_signed_checkbox" className="text-xs font-bold text-stone-700 cursor-pointer">
                  डिजिटल हस्तक्षर शामिल करें (E-Signature Enabled)
                </label>
              </div>

              {data.isE_Signed && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    हस्ताक्षर अक्षर शैली (Signature initials for script)
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. A. K. Sharma"
                    value={data.customSignatureText}
                    onChange={(e) => updateField("customSignatureText", e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-sm text-blue-700 font-signature focus:outline-none focus:border-emerald-600 focus:bg-white transition-all text-lg"
                    id="signature_text_field"
                  />
                </div>
              )}
            </div>
          </div>

          {/* SECTION 4: Certificate Aesthetics (डिजाइन थीम कस्टमाइजेशन) */}
          <div className="space-y-4 pt-2 border-t border-stone-100">
            <span className="text-xs font-black text-[#047857] tracking-wider uppercase flex items-center gap-1.5 border-b border-stone-100 pb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> 4. डिज़ाइन कस्टमाइजेशन / Style & Seal
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  सर्टिफिकेट बॉर्डर शैली (Border Frame Option)
                </label>
                <select
                  value={data.borderStyle}
                  onChange={(e) => updateField("borderStyle", e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                  id="border_style_select"
                >
                  <option value="classic">क्लासिक स्वीप ग्रीन-गोल्ड (Classic Green-Gold)</option>
                  <option value="eco-leaf">सघन प्राकृतिक ग्रीन (Eco Leafy Emerald)</option>
                  <option value="royal-gold">शाही देवनागरी राज स्वर्ण (Royal Gold)</option>
                  <option value="traditional">लकड़ी नक्काशी पारम्परिक (Terracotta Wooden)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  वेरिफिकेशन सील का रंग (Stamp Color)
                </label>
                <div className="flex items-center gap-2 pd-1.5">
                  {(["gold", "green", "blue", "brown"] as const).map((color) => {
                    const colorHexes = {
                      gold: "bg-amber-600",
                      green: "bg-emerald-700",
                      blue: "bg-blue-900",
                      brown: "bg-amber-900",
                    };
                    const labels = {
                      gold: "स्वर्ण / Gold",
                      green: "हरा / Green",
                      blue: "नीला / Blue",
                      brown: "भूरा / Brown",
                    };
                    const isSelected = data.sealColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => updateField("sealColor", color)}
                        className={`flex-1 py-2 px-2.5 rounded-xl border text-[11px] font-bold text-stone-800 cursor-pointer flex items-center justify-center gap-1 transition-all ${
                          isSelected
                            ? "border-emerald-605 bg-emerald-50 text-emerald-950 font-black scale-102"
                            : "border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-550"
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full ${colorHexes[color]} border border-white`} />
                        <span className="hidden lg:inline">{labels[color]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Voting Pledge checkbox - triggers special layout on watermark */}
            <div className="bg-emerald-50/70 border border-emerald-100 p-3 rounded-xl">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="pledge_accepted_input"
                  checked={data.pledgeAccepted}
                  onChange={(e) => updateField("pledgeAccepted", e.target.checked)}
                  className="w-5 h-5 rounded text-[#047857] border-stone-300 focus:ring-emerald-500 cursor-pointer mt-0.5"
                />
                <div>
                  <label htmlFor="pledge_accepted_input" className="text-xs font-bold text-emerald-950 cursor-pointer block">
                    मतदाता ई-शपथ स्वीकार करें (Accept Electoral Eco-Oath)
                  </label>
                  <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                    इसे चेक करने से प्रमाणपत्र पर आधिकारिक "संकल्पित मतदाता (Certified Voter Pledge)" का गोल्ड-स्टार बैज प्रिंट होगा।
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
