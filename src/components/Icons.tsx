/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

// Stylized ECI (Election Commission of India) Tricolour Rhombus logo
export const ECILogo: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        {/* Background rounded clean white tile */}
        <rect width="100" height="100" rx="16" fill="white" />
        
        {/* Diamond Outer Framework */}
        <g transform="translate(10, 10) scale(0.8)">
          {/* Saffron Strip (Top-Left diagonal) */}
          <path
            d="M50 5 L95 50 L95 35 L50 5 Z"
            fill="#FF9933"
          />
          <path
            d="M50 5 L5 50 L20 50 L50 20 Z"
            fill="#FF9933"
          />
          {/* Main Rhombus Body with Tricolor layers */}
          <path
            d="M50 15 L85 50 L50 85 L15 50 Z"
            fill="#FFFFFF"
            stroke="#133B68"
            strokeWidth="3.5"
          />
          
          {/* Saffron Ribbon Segment inside */}
          <path
            d="M50 20 L80 50 L50 50 Z"
            fill="#FF9933"
          />
          
          {/* Green Ribbon Segment inside */}
          <path
            d="M15 50 L50 50 L50 80 Z"
            fill="#128807"
          />
          
          {/* Blue Ballot Box / Slot in Center */}
          <rect x="42" y="42" width="16" height="16" rx="2" fill="#000080" />
          {/* White Paper Ballot Line entering */}
          <rect x="46" y="38" width="8" height="6" fill="#FFFFFF" />
          <line x1="48" y1="41" x2="52" y2="41" stroke="#000080" strokeWidth="1" />
          
          {/* Blue Ashoka Spoke Emblem Detail */}
          <circle cx="50" cy="50" r="1.5" fill="#FFFFFF" />
        </g>
      </svg>
    </div>
  );
};

// High-fidelity vector of the National Emblem of India (Ashoka Pillar)
export const AshokaEmblem: React.FC<{ className?: string; color?: string }> = ({
  className = "w-14 h-16",
  color = "#8B6508" // Golden brown by default
}) => {
  return (
    <svg
      viewBox="0 0 120 160"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <g stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Top central lion face outline */}
        <path d="M60 15 C52 15 48 22 48 30 C48 38 52 42 60 42 C68 42 72 38 72 30 C72 22 68 15 60 15 Z" />
        <path d="M52 22 C52 22 55 18 60 18 C65 18 68 22 68 22" />
        <path d="M54 28 C56 26 64 26 66 28" strokeWidth="2" />
        {/* Mane details */}
        <path d="M48 25 C45 25 42 22 42 30 C42 38 48 40 48 40" />
        <path d="M72 25 C75 25 78 22 78 30 C78 38 72 40 72 40" />
        
        {/* Left lion profile */}
        <path d="M42 30 C35 30 32 35 32 42 C32 50 40 54 44 54" />
        <path d="M38 34 C34 38 34 44 38 48" strokeWidth="1.5" />
        
        {/* Right lion profile */}
        <path d="M78 30 C85 30 88 35 88 42 C88 50 80 54 76 54" />
        <path d="M82 34 C86 38 86 44 82 48" strokeWidth="1.5" />

        {/* Center detailed body torso */}
        <path d="M48 40 C48 48 50 62 54 74 L66 74 C70 62 72 48 72 40" />
        <path d="M44 54 C46 62 48 70 51 74" />
        <path d="M76 54 C74 62 72 70 69 74" />
        
        {/* Hair clusters lines */}
        <path d="M54 42 C56 46 56 50 54 54" strokeWidth="1.5" />
        <path d="M60 44 C60 48 60 52 60 56" strokeWidth="1.5" />
        <path d="M66 42 C64 46 64 50 66 54" strokeWidth="1.5" />
        <path d="M58 60 L62 60" strokeWidth="1.5" />
        <path d="M56 66 L64 66" strokeWidth="1.5" />
        <path d="M54 71 L66 71" strokeWidth="1.5" />

        {/* Abacus (Chakra and Animals base) */}
        <rect x="25" y="74" width="70" height="20" rx="3" fill="#FFFFFF" stroke={color} strokeWidth="3" />
        {/* Center Ashok Chakra */}
        <circle cx="60" cy="84" r="7" fill="none" stroke={color} strokeWidth="2" />
        <circle cx="60" cy="84" r="1.5" fill={color} />
        {/* Chakra Spokes detail */}
        <path d="M60 77 L60 91" strokeWidth="1" />
        <path d="M53 84 L67 84" strokeWidth="1" />
        <path d="M55 79 L65 89" strokeWidth="0.8" />
        <path d="M55 89 L65 79" strokeWidth="0.8" />
        
        {/* Symbolic tiny animal figures on abacus sides */}
        {/* Left Bull/Horse hint */}
        <circle cx="36" cy="84" r="2.5" fill="none" stroke={color} strokeWidth="1.5" />
        <path d="M33 84 H39" strokeWidth="1" />
        {/* Right Elephant hint */}
        <circle cx="84" cy="84" r="2.5" fill="none" stroke={color} strokeWidth="1.5" />
        <path d="M81 84 H87" strokeWidth="1" />

        {/* Bell-shaped sub-base (Inverted Lotus) */}
        <path d="M32 94 C32 94 30 115 42 120 C50 123 70 123 78 120 C90 115 88 94 88 94" fill="none" stroke={color} strokeWidth="3" />
        {/* Lotus folds lines */}
        <path d="M44 94 C44 105 48 114 48 117" strokeWidth="1.5" />
        <path d="M60 94 C60 102 60 115 60 119" strokeWidth="2" />
        <path d="M76 94 C76 105 72 114 72 117" strokeWidth="1.5" />

        {/* Base Plinth text box */}
        <rect x="20" y="121" width="80" height="15" rx="1" stroke={color} strokeWidth="2" />
        <line x1="20" y1="126" x2="100" y2="126" stroke={color} strokeWidth="1" />
      </g>
      {/* Devgari "सत्यमेव जयते" text label under */}
      <text
        x="60"
        y="152"
        fill={color}
        fontSize="11"
        fontWeight="800"
        textAnchor="middle"
        fontFamily="serif"
      >
        सत्यमेव जयते
      </text>
    </svg>
  );
};

// Beautiful vector illustration of a "Tree of Democracy" (लोकतंत्र का संकल्प वृक्ष)
export const TreeOfDemocracyLogo: React.FC<{
  className?: string;
  watermark?: boolean;
}> = ({ className = "w-24 h-24", watermark = false }) => {
  const primaryColor = watermark ? "rgba(16, 185, 129, 0.08)" : "#047857"; // Emerald-700
  const secondaryColor = watermark ? "rgba(245, 158, 11, 0.06)" : "#D97706"; // Amber-600
  const trunkColor = watermark ? "rgba(120, 53, 4, 0.05)" : "#78350F"; // Brown-800
  const detailColor = watermark ? "rgba(59, 130, 246, 0.05)" : "#1E3A8A"; // Blue-900

  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      {/* Decorative sunburst behind tree */}
      <circle cx="100" cy="95" r="70" stroke={secondaryColor} strokeWidth="1" strokeDasharray="4 6" opacity={watermark ? 0.3 : 0.6} />

      {/* Roots growing from a circular Democratic Voting Box / Shield */}
      <g transform="translate(0, 10)">
        {/* Voting Dial Circle / Shield Base */}
        <circle cx="100" cy="145" r="28" fill="white" stroke={detailColor} strokeWidth="3" />
        {/* Tricolour rings inside Shield */}
        <circle cx="100" cy="145" r="22" stroke="#FF9933" strokeWidth="1.5" />
        <circle cx="100" cy="145" r="16" stroke="#128807" strokeWidth="1.5" />
        
        {/* Inked index finger voting symbol inside shield representing democracy */}
        <path
          d="M97 151 C97 155 103 155 103 151 C103 150 102 143 102 138 C102 134 98 134 98 138 Z"
          fill={detailColor}
        />
        {/* Voter ink mark (Blue tick or line) */}
        <path d="M100 134 L100 144" stroke="#0000FF" strokeWidth="2.5" strokeLinecap="round" />
        
        {/* Thick curved beautiful roots of the tree wrapping around the democracy base */}
        <path d="M100 115 C95 119 86 119 76 127 C68 133 72 138 74 140" stroke={trunkColor} strokeWidth="3.5" strokeLinecap="round" />
        <path d="M100 115 C105 119 114 119 124 127 C132 133 128 138 126 140" stroke={trunkColor} strokeWidth="3.5" strokeLinecap="round" />
        <path d="M98 115 L92 128 C90 131 92 134 94 135" stroke={trunkColor} strokeWidth="2.5" />
        <path d="M102 115 L108 128 C110 131 108 134 106 135" stroke={trunkColor} strokeWidth="2.5" />
      </g>

      {/* Main majestic tree trunk */}
      <path
        d="M93 125 C93 110 90 90 85 85 C83 83 80 84 75 80 C68 76 72 65 80 68 C83 69 86 73 88 75 C92 72 95 62 92 50 C91 45 95 40 100 45 C105 40 109 45 108 50 C105 62 108 72 112 75 C114 73 117 69 120 68 C128 65 132 76 125 80 C120 84 117 83 115 85 C110 90 107 110 107 125 Z"
        fill={trunkColor}
      />
      
      {/* Multi-layered dense leaves representing environment & electorate growth */}
      {/* Base/Back layer darker leaves */}
      <circle cx="70" cy="70" r="22" fill={primaryColor} opacity="0.85" />
      <circle cx="130" cy="70" r="22" fill={primaryColor} opacity="0.85" />
      <circle cx="100" cy="55" r="25" fill={primaryColor} opacity="0.85" />
      
      {/* Front layer vibrant leaves */}
      <circle cx="82" cy="60" r="18" fill={primaryColor} />
      <circle cx="118" cy="60" r="18" fill={primaryColor} />
      <circle cx="100" cy="72" r="20" fill={primaryColor} />
      <circle cx="65" cy="85" r="16" fill={primaryColor} />
      <circle cx="135" cy="85" r="16" fill={primaryColor} />

      {/* Glowing Orange/Amber blossoms representing civic rights and votes */}
      <circle cx="85" cy="50" r="6" fill={secondaryColor} />
      <circle cx="115" cy="50" r="6" fill={secondaryColor} />
      <circle cx="60" cy="75" r="6" fill={secondaryColor} />
      <circle cx="140" cy="75" r="6" fill={secondaryColor} />
      <circle cx="100" cy="35" r="7" fill={secondaryColor} />
      <circle cx="100" cy="85" r="5" fill={secondaryColor} />
      <circle cx="75" cy="90" r="5" fill={secondaryColor} />
      <circle cx="125" cy="90" r="5" fill={secondaryColor} />

      {/* Decorative leaf details (veins or fluttering green highlights) */}
      <path d="M96 35 L104 35" stroke="white" strokeWidth="1" />
      <path d="M81 50 L89 50" stroke="white" strokeWidth="1" />
      <path d="M111 50 L119 50" stroke="white" strokeWidth="1" />
    </svg>
  );
};

// Official Seal/Stamp of Deeg Electoral Office
export const VerificationStamp: React.FC<{
  className?: string;
  sealColor?: string;
  textHindi?: string;
  textEnglish?: string;
}> = ({
  className = "w-24 h-24",
  sealColor = "gold",
  textHindi = "जिला निर्वाचन कार्यालय डीग",
  textEnglish = "DISTRICT ELECTION OFFICE DEEG"
}) => {
  const colorMap: Record<string, string> = {
    gold: "#D97706",  // Amber-600
    green: "#047857", // Emerald-700
    blue: "#1E3A8A",  // Blue-900
    brown: "#78350F"  // Brown-800
  };

  const stampColor = colorMap[sealColor] || "#D97706";

  return (
    <div className={`relative flex items-center justify-center ${className} select-none transform rotate-[-6deg]`}>
      <svg
        viewBox="0 0 120 120"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Outer dotted/serrated circle */}
        <circle cx="60" cy="60" r="56" fill="none" stroke={stampColor} strokeWidth="1.5" strokeDasharray="3 3" />
        
        {/* Outer solid thick circle */}
        <circle cx="60" cy="60" r="52" fill="none" stroke={stampColor} strokeWidth="3" />
        
        {/* Inner thin circle */}
        <circle cx="60" cy="60" r="42" fill="none" stroke={stampColor} strokeWidth="1.5" />

        {/* Circular Hindi curved text on top */}
        <path id="curveHindi" d="M 22 60 A 38 38 0 1 1 98 60" fill="none" />
        <text fill={stampColor} fontSize="7.5" fontWeight="900" letterSpacing="0.8" className="font-serif">
          <textPath href="#curveHindi" startOffset="50%" textAnchor="middle">
            {textHindi}
          </textPath>
        </text>

        {/* Circular English curved text on bottom */}
        <path id="curveEnglish" d="M 98 60 A 38 38 0 1 1 22 60" fill="none" />
        <text fill={stampColor} fontSize="6" fontWeight="800" letterSpacing="0.5" className="font-sans">
          <textPath href="#curveEnglish" startOffset="50%" textAnchor="middle">
            {textEnglish}
          </textPath>
        </text>

        {/* Center icon / emblem of ECI or Voting Star */}
        <g transform="translate(42, 42) scale(0.36)">
          {/* Detailed Green Tree / Voting Thumb hybrid inside stamp */}
          <path
            d="M50 85 V30 M30 50 C30 35, 70 35, 70 50 C70 55, 60 65, 50 85"
            stroke={stampColor}
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />
          {/* Horizontal Vote lines */}
          <circle cx="50" cy="30" r="10" fill={stampColor} />
          <path d="M40 50 H60 M44 60 H56" stroke={stampColor} strokeWidth="6" strokeLinecap="round" />
        </g>

        {/* Diagonal "स्वीकृत / PLEDGED" ribbon across stamp */}
        <rect x="20" y="52" width="80" height="16" fill="white" stroke={stampColor} strokeWidth="1.5" rx="1" />
        <text
          x="60"
          y="63"
          fill={stampColor}
          fontSize="9.5"
          fontWeight="950"
          textAnchor="middle"
          className="font-yatra tracking-wider"
        >
          स्वीप संकल्प
        </text>
      </svg>
    </div>
  );
};
