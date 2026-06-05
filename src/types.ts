/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TreeType {
  id: string;
  nameHindi: string;
  nameEnglish: string;
  scientificName: string;
  descriptionHindi: string;
  descriptionEnglish: string;
  color: string;
}

export interface CertificateData {
  recipientName: string;
  guardianName: string; // पिता या पति का नाम
  mobileNumber: string; // मोबाइल नंबर (not visible on certificate)
  assemblyConstituency: string; // विधानसभा क्षेत्र (e.g. डीग-कुम्हेर 73)
  block: string; // ब्लॉक (e.g. पहाड़ी, डीग, कामां, नगर, कुम्हेर, सीकरी)
  district: string; // जिला
  treeId: string;
  plantationDate: string; // Default to 2026-06-05
  certificateId: string; // Unique Serial Number
  eroName: string; // Electoral Registration Officer
  eroDesignation: string; // Designation
  pledgeAccepted: boolean;
  sealColor: string; // gold, green, blue, brown
  borderStyle: string; // classic, eco-leaf, royal-gold, traditional
  isE_Signed: boolean;
  customSignatureText: string; // Hand-written text for officer
  stampTextHindi: string; // Custom Hindi text for ERO stamp
  stampTextEnglish: string; // Custom English text for ERO stamp
}

export const TREES_LIST: TreeType[] = [
  {
    id: "khejri",
    nameHindi: "खेजड़ी",
    nameEnglish: "Khejri",
    scientificName: "Prosopis cineraria",
    descriptionHindi: "राजस्थान का राज्य वृक्ष और मरुस्थल का कल्पवृक्ष।",
    descriptionEnglish: "State tree of Rajasthan, acts as the Kalpavriksha of the desert.",
    color: "emerald"
  },
  {
    id: "peepal",
    nameHindi: "पीपल",
    nameEnglish: "Peepal",
    scientificName: "Ficus religiosa",
    descriptionHindi: "अतुलनीय ऑक्सीजन प्रदाता और दीर्घायु का प्रतीक।",
    descriptionEnglish: "Incomparable oxygen provider, and a symbol of longevity.",
    color: "green"
  },
  {
    id: "neem",
    nameHindi: "नीम",
    nameEnglish: "Neem",
    scientificName: "Azadirachta indica",
    descriptionHindi: "प्राकृतिक वायु शोधक और परम औषधीय वृक्ष।",
    descriptionEnglish: "Natural air purifier and ultimate medicinal tree.",
    color: "teal"
  },
  {
    id: "bargad",
    nameHindi: "बरगद",
    nameEnglish: "Banyan",
    scientificName: "Ficus benghalensis",
    descriptionHindi: "भारत का राष्ट्रीय वृक्ष, असीम आस्था व छाया का स्रोत।",
    descriptionEnglish: "National tree of India, source of endless faith & shadow.",
    color: "lime"
  },
  {
    id: "amla",
    nameHindi: "आंवला",
    nameEnglish: "Amla",
    scientificName: "Phyllanthus emblica",
    descriptionHindi: "विटामिन सी युक्त अमृत फल देने वाला कल्याणकारी वृक्ष।",
    descriptionEnglish: "A benevolent tree giving vitamin C rich elixir-like fruit.",
    color: "green"
  },
  {
    id: "gulmohar",
    nameHindi: "गुलमोहर",
    nameEnglish: "Gulmohar",
    scientificName: "Delonix regia",
    descriptionHindi: "आकर्षक लाल-नारंगी फूलों वाली सुंदर शीतल छाया।",
    descriptionEnglish: "Beautiful cool shade with vibrant orange-red flowers.",
    color: "rose"
  }
];

export const ASSEMBLY_SEATS = [
  { id: "70", nameHindi: "कामां (70)", nameEnglish: "Kaman (70)" },
  { id: "71", nameHindi: "नगर (71)", nameEnglish: "Nagar (71)" },
  { id: "72", nameHindi: "डीग-कुम्हेर (72)", nameEnglish: "Deeg-Kumher (72)" }
];

export const SWEEP_SLOGANS = [
  "लोकतंत्र की ये पुकार, पेड़ लगाओ और करो मतदान!",
  "एक पेड़ लोकतंत्र के नाम लगाकर, देश को बनाएं सुदृढ़ और हरा-भरा।",
  "स्वच्छ पर्यावरण, सशक्त मतदान!",
  "जिस प्रकार पानी सींचता है पौधे को, वैसे ही हमारा मतदान मजबूत करता है लोकतंत्र को।",
  "वोटर होने पर गर्व करें, पर्यावरण की रक्षा करें!"
];

export const BLOCKS_LIST = [
  { id: "pahadi", nameHindi: "पहाड़ी", nameEnglish: "Pahadi" },
  { id: "deeg", nameHindi: "डीग", nameEnglish: "Deeg" },
  { id: "kaman", nameHindi: "कामां", nameEnglish: "Kaman" },
  { id: "nagar", nameHindi: "नगर", nameEnglish: "Nagar" },
  { id: "kumher", nameHindi: "कुम्हेर", nameEnglish: "Kumher" },
  { id: "sikri", nameHindi: "सीकरी", nameEnglish: "Sikri" }
];

export const INITIAL_DATA: CertificateData = {
  recipientName: "",
  guardianName: "",
  mobileNumber: "",
  assemblyConstituency: "डीग-कुम्हेर (72)",
  block: "पहाड़ी",
  district: "डीग (राजस्थान)",
  treeId: "khejri",
  plantationDate: "2026-06-05", // 5th June 2026
  certificateId: "SVEEP/DEEG/2026/0842",
  eroName: "श्री मोहन सिंह",
  eroDesignation: "अतिरिक्त मुख्य कार्यकारी अधिकारी डीग",
  pledgeAccepted: true,
  sealColor: "gold",
  borderStyle: "classic",
  isE_Signed: true,
  customSignatureText: "Mohan Singh",
  stampTextHindi: "अतिरिक्त मुख्य कार्यकारी अधिकारी डीग",
  stampTextEnglish: "ADDITIONAL CHIEF EXECUTIVE OFFICER DEEG"
};

export const NATURE_QUOTES = [
  "प्रकृति की शरण में जाना, अंतरात्मा का परमात्मा से मिलना है। 🌱",
  "एक पेड़, दस पुत्रों के समान फलदायी और कल्याणकारी होता है। 🌳",
  "पेड़-पौधें धरा के वो अद्भुत आभूषण हैं, जो हमें जीवनरूपी अमूल्य ऑक्सीजन प्रदान करते हैं। 🍃",
  "प्रकृति हमारे मन को असीम शांत करती है और आत्मा को नई प्राणवायु ऊर्जा देती है। 🌸",
  "वृक्षारोपण केवल पौधा लगाना नहीं, बल्कि आने वाली पीढ़ियों के लिए नया जीवन बोना है। 🍀",
  "धरती माँ का श्रृंगार करें, पौधे लगाएं और उनकी सदैव पुत्रवत रक्षा करें। 🌺",
  "पेड़ होंगे तो शुद्ध हवा होगी, शुद्ध हवा होगी तो सुखमय और सुरक्षित कल होगा। 🌲",
  "सशक्त लोकतंत्र और हरा-भरा सुंदर पर्यावरण, समृद्ध भारत की सच्ची पहचान है। 🇮🇳"
];

