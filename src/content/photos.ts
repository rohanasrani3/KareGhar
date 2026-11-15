/**
 * Real photographs used on the site. All come from Wikimedia Commons under
 * free licences (public domain, CC0, Free Art License or Creative Commons
 * Attribution / ShareAlike). They show real crafts and performances, NOT work
 * by KareGhar's (fictional) sample artists.
 *
 * PHOTOS are site imagery (home page). FORM_PHOTOS show one art form's work
 * with no people in frame; sample records may use them only as clearly
 * labelled example photos ("Example photo: …"), never as a real artist's work.
 *
 * CC BY / CC BY-SA / FAL require credit: show the credit beside the photo or
 * link to /credits, which lists every entry here. Files were resized, converted
 * to JPEG and their metadata removed; the images are otherwise unaltered.
 */
export type Photo = {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: { en: string; hi: string };
  place: { en: string; hi: string };
  author: string;
  license: string;
  licenseUrl: string;
  source: string;
};

const BY_SA_4 = "https://creativecommons.org/licenses/by-sa/4.0/";
const CC0 = "https://creativecommons.org/publicdomain/zero/1.0/";

export const PHOTOS = {
  pattachitra: {
    id: "pattachitra",
    src: "/photos/hero-pattachitra.jpg",
    width: 1600,
    height: 1200,
    alt: { en: "An artist painting fine detail on a Pattachitra scroll", hi: "पट्टचित्र पर बारीक चित्रकारी करता एक कलाकार" },
    place: { en: "Pattachitra, Raghurajpur, Odisha", hi: "पट्टचित्र, रघुराजपुर, ओडिशा" },
    author: "Sumit Surai",
    license: "CC BY-SA 4.0",
    licenseUrl: BY_SA_4,
    source: "https://commons.wikimedia.org/wiki/File:Raghurajpur_Artist.JPG",
  },
  madhubani: {
    id: "madhubani",
    src: "/photos/madhubani-artist.jpg",
    width: 1200,
    height: 800,
    alt: { en: "A Madhubani artist drawing at a stall hung with finished paintings", hi: "तैयार चित्रों से सजी दुकान पर चित्र बनाता मधुबनी कलाकार" },
    place: { en: "Madhubani, Dilli Haat, New Delhi", hi: "मधुबनी, दिल्ली हाट, नई दिल्ली" },
    author: "Pallav.journo",
    license: "CC BY-SA 4.0",
    licenseUrl: BY_SA_4,
    source: "https://commons.wikimedia.org/wiki/File:Dilli_Haat_Madhubani_Mithila_Painting_Artist.jpg",
  },
  warli: {
    id: "warli",
    src: "/photos/warli-wall.jpg",
    width: 1200,
    height: 1641,
    alt: { en: "Warli paintings covering the walls of a house in the forest", hi: "जंगल में एक घर की दीवारों पर बनी वारली चित्रकारी" },
    place: { en: "Warli, Sanjay Gandhi National Park, Mumbai", hi: "वारली, संजय गांधी राष्ट्रीय उद्यान, मुंबई" },
    author: "Blackstardust",
    license: "CC BY-SA 4.0",
    licenseUrl: BY_SA_4,
    source: "https://commons.wikimedia.org/wiki/File:Warli_art_on_a_house_wall_at_Sanjay_Gandhi_National_Park.jpg",
  },
  baul: {
    id: "baul",
    src: "/photos/baul.jpg",
    width: 1200,
    height: 845,
    alt: { en: "Two Baul singers in saffron playing an ektara and a dotara", hi: "भगवा वस्त्रों में एकतारा और दोतारा बजाते दो बाउल गायक" },
    place: { en: "Baul singers, West Bengal", hi: "बाउल गायक, पश्चिम बंगाल" },
    author: "Debavasya",
    license: "CC BY-SA 4.0",
    licenseUrl: BY_SA_4,
    source: "https://commons.wikimedia.org/wiki/File:Baul_Singer_1.jpg",
  },
  kathak: {
    id: "kathak",
    src: "/photos/kathak-tatkar.jpg",
    width: 1200,
    height: 674,
    alt: { en: "A Kathak dancer’s feet in ghungroo ankle bells, mid-footwork", hi: "घुंघरू पहने कथक नर्तक के पैर, तत्कार करते हुए" },
    place: { en: "Kathak tatkar, live performance", hi: "कथक तत्कार, मंच पर प्रस्तुति" },
    author: "RaniJhansi0310",
    license: "CC BY-SA 4.0",
    licenseUrl: BY_SA_4,
    source: "https://commons.wikimedia.org/wiki/File:Kathak_Tatkar.jpg",
  },
  kathakDancer: {
    id: "kathakDancer",
    src: "/photos/kathak-dancer.jpg",
    width: 1200,
    height: 1800,
    alt: { en: "A Kathak dancer in a red and gold costume", hi: "लाल और सुनहरी पोशाक में कथक नर्तकी" },
    place: { en: "Kathak", hi: "कथक" },
    author: "Suyash Dwivedi",
    license: "CC BY-SA 4.0",
    licenseUrl: BY_SA_4,
    source: "https://commons.wikimedia.org/wiki/File:Kathak_dancer_(5).jpg",
  },
  blockPrint: {
    id: "blockPrint",
    src: "/photos/block-print.jpg",
    width: 1200,
    height: 898,
    alt: { en: "A woman hand block printing a long length of cotton", hi: "सूती कपड़े पर हाथ से ब्लॉक प्रिंट करती एक महिला" },
    place: { en: "Block printing, Bagru, Rajasthan", hi: "ब्लॉक प्रिंट, बगरू, राजस्थान" },
    author: "Anildiggiwal",
    license: "CC0",
    licenseUrl: CC0,
    source: "https://commons.wikimedia.org/wiki/File:Woman_doing_Block_Printing_at_Bagru_village,_Jaipur,_India.jpg",
  },
  handloom: {
    id: "handloom",
    src: "/photos/handloom.jpg",
    width: 1200,
    height: 795,
    alt: { en: "A weaver at a wooden handloom in a sunlit workshop", hi: "धूप वाली कार्यशाला में लकड़ी के हथकरघे पर बुनकर" },
    place: { en: "Handloom, Maheshwar, Madhya Pradesh", hi: "हथकरघा, महेश्वर, मध्य प्रदेश" },
    author: "Eskay001",
    license: "CC BY-SA 4.0",
    licenseUrl: BY_SA_4,
    source: "https://commons.wikimedia.org/wiki/File:Handloom_weaver_in_Maheshwar_fort,_Khargone_district,_Madhya_Pradesh.jpg",
  },
  pottery: {
    id: "pottery",
    src: "/photos/pottery.jpg",
    width: 1200,
    height: 800,
    alt: { en: "Hands shaping clay on a spinning potter’s wheel", hi: "घूमते चाक पर मिट्टी को आकार देते हाथ" },
    place: { en: "Pottery, Odisha Crafts Museum", hi: "मिट्टी के बर्तन, ओडिशा शिल्प संग्रहालय" },
    author: "Kritzolina",
    license: "CC BY-SA 4.0",
    licenseUrl: BY_SA_4,
    source: "https://commons.wikimedia.org/wiki/File:Pottery_workshop_at_Odisha_Crafts_Museum_02.jpg",
  },
} satisfies Record<string, Photo>;

export type PhotoId = keyof typeof PHOTOS;

/** One photo per art category, for category links and cards. */
export const CATEGORY_PHOTOS: Record<"painting" | "music" | "dance" | "craft", PhotoId> = {
  painting: "madhubani",
  music: "baul",
  dance: "kathak",
  craft: "blockPrint",
};

const PD = "https://creativecommons.org/publicdomain/mark/1.0/";
const commons = (file: string) => "https://commons.wikimedia.org/wiki/File:" + file;
type FormPhoto = Omit<Photo, "id" | "place"> & { form: string };
const formPhoto = (  form: string, width: number, height: number, en: string, hi: string,
  author: string, license: string, licenseUrl: string, file: string,
): FormPhoto => ({ form, src: `/photos/forms/${form}.jpg`, width, height, alt: { en, hi }, author, license, licenseUrl, source: commons(file) });

/** One photo of each seed art form's work, with no people in frame. */
export const FORM_PHOTOS: Record<string, FormPhoto> = Object.fromEntries([
  formPhoto("warli", 1200, 1243, "Warli figures dancing, acrylic on canvas", "कैनवास पर नाचती वारली आकृतियाँ", "PVRMurty1944", "CC0", CC0, "Warli_art_-_acrylic_painting_on_canvas.jpg"),
  formPhoto("madhubani", 1200, 967, "A framed Madhubani painting of Krishna and Radha", "कृष्ण और राधा का फ़्रेम किया हुआ मधुबनी चित्र", "Sumukhi Umesh", "FAL", "https://artlibre.org/licence/lal/en/", "Madhubani_art.jpg"),
  formPhoto("gond", 1200, 710, "A Gond painting of deer under trees full of birds", "पक्षियों से भरे पेड़ों के नीचे हिरणों का गोंड चित्र", "Sumita Roy Dutta", "CC BY-SA 4.0", BY_SA_4, "Gond_art_IMG_8707.jpg"),
  formPhoto("pattachitra", 1200, 2032, "A Pattachitra painting of Jagannath with ornate borders", "सजी हुई किनारियों वाला जगन्नाथ का पट्टचित्र", "Patrick.zip", "CC0", CC0, "Pattachitra_of_Jagannath.jpg"),
  formPhoto("kalamkari", 1200, 900, "Hand-painted Kalamkari cloth with a peacock and lotuses", "मोर और कमल वाला हाथ से रंगा कलमकारी कपड़ा", "rajaraman sundaram", "CC BY 3.0", "https://creativecommons.org/licenses/by/3.0/", "KALAMKARI_HAND_PAINTED_CLOTH_SRIKALAHASTI_AP_-_panoramio.jpg"),
  formPhoto("marathi-folk", 1200, 1600, "A dholak and a tasha, folk drums", "ढोलक और ताशा, लोक वाद्य", "Prabhavathi anaka", "CC BY-SA 4.0", BY_SA_4, "Dholak,Tasha_drum.jpg"),
  formPhoto("baul", 1200, 1200, "Ektaras, the one-string Baul instrument, at a stall", "दुकान पर रखे एकतारे, बाउल गायकों का वाद्य", "Salim Khandoker", "CC BY-SA 3.0", "https://creativecommons.org/licenses/by-sa/3.0/", "Ektara_.jpg"),
  formPhoto("hindustani", 1200, 1600, "A pair of tanpuras ready for a concert", "संगीत सभा के लिए तैयार दो तानपुरे", "Martin spaink", "CC BY-SA 3.0", "https://creativecommons.org/licenses/by-sa/3.0/", "A_pair_of_female_vocal_tanpuras.jpg"),
  formPhoto("carnatic", 1200, 652, "A Saraswati veena from Chennai", "चेन्नई की सरस्वती वीणा", "Katharina Common", "CC BY-SA 4.0", BY_SA_4, "Saraswati_veena_(Indian_long-necked_lute).png"),
  formPhoto("lavani", 1200, 675, "Ghungroo ankle bells with marigold flowers", "गेंदे के फूलों के साथ घुंघरू", "Nidhi Amol Kulkarni", "CC BY-SA 4.0", BY_SA_4, "Ghungroo_-_the_depiction_of_a_divine_art.jpg"),
  formPhoto("kathak", 1200, 800, "A string of brass ghungroo bells worn for Kathak", "कथक के लिए पहने जाने वाले पीतल के घुंघरू", "Wiki-uk", "Public domain", PD, "Ghungroo.jpg"),
  formPhoto("bharatanatyam", 1200, 803, "Rows of bronze figures in classical dance poses", "शास्त्रीय नृत्य मुद्राओं में कांसे की मूर्तियों की कतारें", "Wikimedia Commons", "CC BY-SA 2.5", "https://creativecommons.org/licenses/by-sa/2.5/", "Kadavul_tandavas.jpg"),
  formPhoto("kathputli", 1200, 1800, "A Kathputli string puppet in a red and gold costume", "लाल और सुनहरे वस्त्रों में कठपुतली", "Manojmeena", "CC BY-SA 4.0", BY_SA_4, "Kathputli_(Puppet)_of_Rajasthan.jpg"),
  formPhoto("block-print", 1059, 699, "Carved wooden blocks for printing textiles", "कपड़े पर छपाई के लिए नक्काशीदार लकड़ी के ठप्पे", "LBM1948", "CC BY-SA 4.0", BY_SA_4, "Rayast%C3%A1n,_textiles_(2002)_06.jpg"),
  formPhoto("terracotta", 1200, 900, "Bankura terracotta horses lined up outside a shop", "दुकान के बाहर कतार में बांकुरा के टेराकोटा घोड़े", "Footlooseinme", "CC BY-SA 4.0", BY_SA_4, "Bankura_Terracotta_Horses.jpg"),
  formPhoto("handloom", 1200, 900, "Handwoven silk saris displayed on a wall", "दीवार पर सजी हाथ से बुनी रेशमी साड़ियाँ", "రహ్మానుద్దీన్ (Rahmanuddin)", "CC BY-SA 3.0", "https://creativecommons.org/licenses/by-sa/3.0/", "Kanchipuram_silk_sareer.JPG"),
  formPhoto("chikankari", 1200, 1098, "A hand-embroidered Chikankari motif on cotton", "सूती कपड़े पर हाथ की चिकनकारी कढ़ाई", "CraftArtisansofIndia", "CC BY-SA 4.0", BY_SA_4, "Chikankari_motif_of_17th_Century.jpg"),
].map((p) => [p.form, p]));
