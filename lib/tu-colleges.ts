export interface TUCollege {
  id: string;
  name: string;
  location: string;
  type: "Constituent" | "Affiliated";
  facultyOrInstitute: string;
  program: string;
  aliases?: string[];
}

export const TU_CSIT_COLLEGES: TUCollege[] = [
  // --- Constituent Campuses (TU IOST) ---
  {
    id: "mechi-multiple-campus",
    name: "Mechi Multiple Campus",
    location: "Bhadrapur, Jhapa",
    type: "Constituent",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["MMC", "Mechi Campus"]
  },
  {
    id: "central-campus-of-technology",
    name: "Central Campus of Technology",
    location: "Hattisar, Dharan",
    type: "Constituent",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["CCT", "CCT Dharan", "Central Campus Dharan"]
  },
  {
    id: "mahendra-morang-adarsha-multiple-campus",
    name: "Mahendra Morang Adarsha Multiple Campus",
    location: "Biratnagar, Morang",
    type: "Constituent",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["MMAMC", "Mahendra Morang Campus", "MMAMC Biratnagar"]
  },
  {
    id: "ramsorup-ramsagar-multiple-campus",
    name: "Ramsorup Ramsagar Multiple Campus",
    location: "Janakpur, Dhanusha",
    type: "Constituent",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["RRM Campus", "RR Campus Janakpur", "Ramsorup Ramsagar"]
  },
  {
    id: "birendra-multiple-campus",
    name: "Birendra Multiple Campus",
    location: "Bharatpur, Chitwan",
    type: "Constituent",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["BMC Bharatpur", "Birendra Campus Chitwan"]
  },
  {
    id: "prithivi-narayan-multiple-campus",
    name: "Prithivi Narayan Multiple Campus",
    location: "Bhimsen Tol, Pokhara",
    type: "Constituent",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["PNC", "PN Campus", "Prithvi Narayan Campus"]
  },
  {
    id: "sidha-nath-science-campus",
    name: "Sidha Nath Science Campus",
    location: "Mahendranagar, Kanchanpur",
    type: "Constituent",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["SNSC", "Siddhanath Science Campus", "Sidhanath"]
  },
  {
    id: "mahendra-multiple-campus-nepalgunj",
    name: "Mahendra Multiple Campus",
    location: "Nepalgunj, Banke",
    type: "Constituent",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["MMC Nepalgunj", "Mahendra Campus Nepalgunj"]
  },
  {
    id: "butwal-multiple-campus",
    name: "Butwal Multiple Campus",
    location: "Butwal, Rupandehi",
    type: "Constituent",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["BMC Butwal", "Butwal Campus"]
  },
  {
    id: "amrit-science-campus",
    name: "Amrit Science Campus",
    location: "Lainchaur, Kathmandu",
    type: "Constituent",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["ASCOL", "Amrit Campus", "Ascol Campus"]
  },
  {
    id: "patan-multiple-campus",
    name: "Patan Multiple Campus",
    location: "Patan Dhoka, Lalitpur",
    type: "Constituent",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["PMC", "Patan Campus"]
  },
  {
    id: "bhaktapur-multiple-campus",
    name: "Bhaktapur Multiple Campus",
    location: "Dhudhpati, Bhaktapur",
    type: "Constituent",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["BMC Bhaktapur", "Bhaktapur Campus"]
  },
  {
    id: "padma-kanya-multiple-campus",
    name: "Padma Kanya Multiple Campus",
    location: "Bagbazar, Kathmandu",
    type: "Constituent",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["PK Campus", "Padma Kanya Campus", "PK"]
  },
  {
    id: "mahendra-multiple-campus-dang",
    name: "Mahendra Multiple Campus",
    location: "Ghorahi, Dang",
    type: "Constituent",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["MMC Dang", "Mahendra Campus Ghorahi", "Dang Campus"]
  },
  {
    id: "bhairahawa-multiple-campus",
    name: "Bhairahawa Multiple Campus",
    location: "Bhairahawa, Rupandehi",
    type: "Constituent",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["BMC Bhairahawa", "Bhairahawa Campus"]
  },

  // --- Affiliated Campuses (TU IOST) ---
  {
    id: "st-xaviers-college",
    name: "St. Xavier's College",
    location: "Maitighar, Kathmandu",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["SXC", "St Xaviers", "Saint Xaviers"]
  },
  {
    id: "mt-annapurna-campus",
    name: "Mt. Annapurna Campus",
    location: "Pokhara, Kaski",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["Mount Annapurna", "MAC Pokhara"]
  },
  {
    id: "birendra-memorial-college",
    name: "Birendra Memorial College",
    location: "Dharan, Sunsari",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["BMC Dharan", "Birendra Memorial"]
  },
  {
    id: "new-summit-college",
    name: "New Summit College",
    location: "Purano Baneshwor, Kathmandu",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["NSC", "New Summit"]
  },
  {
    id: "kathford-intl-college",
    name: "Kathford International College of Engineering and Management",
    location: "Balkumari, Lalitpur",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["Kathford", "Kathford College"]
  },
  {
    id: "prime-college",
    name: "Prime College",
    location: "Nayabazar, Khusibu, Kathmandu",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["Prime", "Prime Nayabazar"]
  },
  {
    id: "nccs-college",
    name: "National College of Computer Studies",
    location: "Paknajol, Kantipath, Kathmandu",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["NCCS", "National College of Computer Studies (NCCS)"]
  },
  {
    id: "nagarjun-college-of-it",
    name: "Nagarjun College of IT",
    location: "Pulchowk, Lalitpur",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["NCIT Hariharbhawan", "Nagarjun College"]
  },
  {
    id: "st-lawrence-college",
    name: "St. Lawrence College",
    location: "Chabahil, Kathmandu",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["SLC", "St Lawrence"]
  },
  {
    id: "shreeyantra-college",
    name: "Shreeyantra College",
    location: "Damak, Jhapa",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["Shreeyantra Damak"]
  },
  {
    id: "orchid-international-college",
    name: "Orchid International College",
    location: "Sinamangal, Kathmandu",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["OIC", "Orchid College"]
  },
  {
    id: "nepalaya-college",
    name: "Nepalaya College",
    location: "Kalanki, Kathmandu",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["Nepalaya"]
  },
  {
    id: "madan-bhandari-memorial-college",
    name: "Madan Bhandari Memorial College",
    location: "Anamnagar, Kathmandu",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["MBMC", "Madan Bhandari College"]
  },
  {
    id: "vedas-college",
    name: "Vedas College",
    location: "Jawalakhel, Lalitpur",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["Vedas", "Vedas Jawalakhel"]
  },
  {
    id: "kathmandu-bernhardt-college",
    name: "Kathmandu Bernhardt College",
    location: "Bafal, Kathmandu",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["KBC", "Bernhardt College"]
  },
  {
    id: "academia-international-college",
    name: "Academia International College",
    location: "Gwarko, Lalitpur",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["AIC", "Academia College"]
  },
  {
    id: "asian-school-of-management-and-technology",
    name: "Asian School of Management & Technology",
    location: "Samakhushi, Kathmandu",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["ASMT", "Asian School"]
  },
  {
    id: "himalaya-college-of-engineering",
    name: "Himalaya College of Engineering",
    location: "Shankhamul, Lalitpur",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["HCOE", "Himalaya College"]
  },
  {
    id: "sagarmatha-college-of-science-and-technology",
    name: "Sagarmatha College of Science & Technology",
    location: "Sanepa, Lalitpur",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["SCST", "Sagarmatha College"]
  },
  {
    id: "college-of-applied-business",
    name: "College of Applied Business",
    location: "Gangahity, Chabahil, Kathmandu",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["CAB", "CAB Chabahil"]
  },
  {
    id: "ambition-college",
    name: "Ambition College",
    location: "Baneshwor, Kathmandu",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["Ambition"]
  },
  {
    id: "texas-international-college",
    name: "Texas International College",
    location: "Mitrapark, Chabahil, Kathmandu",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["Texas", "Texas College"]
  },
  {
    id: "deerwalk-institute-of-technology",
    name: "Deerwalk Institute of Technology",
    location: "Sifal, Kathmandu",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["DWIT", "Deerwalk"]
  },
  {
    id: "nist-college-banepa",
    name: "NIST College",
    location: "Banepa, Kavre",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["NIST Banepa"]
  },
  {
    id: "national-infotec-college",
    name: "National Infotec College",
    location: "Birgunj, Parsa",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["NIC Birgunj", "National Infotech"]
  },
  {
    id: "niharika-college",
    name: "Niharika College",
    location: "Biratnagar, Morang",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["Niharika Biratnagar"]
  },
  {
    id: "birat-kshitiz-college",
    name: "Birat Kshitiz College",
    location: "Biratnagar, Morang",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["BKC", "Birat Kchitize College"]
  },
  {
    id: "birat-multiple-college",
    name: "Birat Multiple College",
    location: "Biratnagar, Morang",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["BMC Biratnagar"]
  },
  {
    id: "aims-college",
    name: "AIMS College",
    location: "Biratnagar, Morang",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["AIMS", "Aims College Biratnagar"]
  },
  {
    id: "godawari-college",
    name: "Godawari College",
    location: "Itahari, Sunsari",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["Godawari Itahari"]
  },
  {
    id: "hetauda-city-college",
    name: "Hetauda City College",
    location: "Hetauda, Makawanpur",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["HCC", "Hetauda City"]
  },
  {
    id: "indreni-college",
    name: "Indreni College",
    location: "Bharatpur, Chitwan",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["Indreni Bharatpur"]
  },
  {
    id: "soch-college-of-it",
    name: "Soch College of I.T.",
    location: "Ranipauwa, Pokhara",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["Soch College", "Soch IT Pokhara"]
  },
  {
    id: "lumbini-ict-college",
    name: "Lumbini ICT College",
    location: "Gaidakot, Nawalparasi",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["LICT", "Lumbini ICT"]
  },
  {
    id: "lumbini-city-college",
    name: "Lumbini City College",
    location: "Butwal, Rupandehi",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["Lumbini City Butwal"]
  },
  {
    id: "trinity-international-college",
    name: "Trinity International College",
    location: "Dillibazar, Kathmandu",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["Trinity", "Trinity College"]
  },
  {
    id: "kathmandu-college-of-technology",
    name: "Kathmandu College of Technology",
    location: "Lokanthali, Bhaktapur",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["KCT", "KCT Lokanthali"]
  },
  {
    id: "swastik-college",
    name: "Swastik College",
    location: "Thimi, Bhaktapur",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["Swastik", "Swastik Thimi"]
  },
  {
    id: "samriddhi-college",
    name: "Samriddhi College",
    location: "Lokanthali, Bhaktapur",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["Samriddhi", "Samridhi College"]
  },
  {
    id: "nepalgunj-campus",
    name: "Nepalgunj Campus",
    location: "Nepalgunj, Banke",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["Nepalgung Campus"]
  },
  {
    id: "nepathya-college",
    name: "Nepathya College",
    location: "Butwal, Rupandehi",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["Nepathya Butwal"]
  },
  {
    id: "ambikeshwari-campus",
    name: "Ambikeshwari Information & Technical Campus",
    location: "Ghorahi, Dang",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["AITC Dang", "Ambikeshowri", "Ambikeshwari Campus"]
  },
  {
    id: "banke-bageshwori-college",
    name: "Banke Bageshwori College",
    location: "Nepalgunj, Banke",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["BBC Nepalgunj", "Bake Bageshori College"]
  },
  {
    id: "asian-college-of-higher-studies",
    name: "Asian College of Higher Studies",
    location: "Kamaladi, Kathmandu",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["ACHS", "ACHS Kamaladi", "Asian College"]
  },
  {
    id: "himalaya-darshan-college",
    name: "Himalaya Darshan College",
    location: "Biratnagar, Morang",
    type: "Affiliated",
    facultyOrInstitute: "Institute of Science and Technology",
    program: "B.Sc. CSIT",
    aliases: ["HDC Biratnagar", "Himalaya Darahan Colllege"]
  }
];

export function searchTUColleges(query: string): TUCollege[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const qClean = q.replace(/[^a-z0-9]/g, "");

  return TU_CSIT_COLLEGES.filter((college) => {
    const nameMatch = college.name.toLowerCase().includes(q);
    const locationMatch = college.location.toLowerCase().includes(q);
    const typeMatch = college.type.toLowerCase().startsWith(q);
    const aliasMatch = college.aliases?.some((a) => {
      const aLower = a.toLowerCase();
      const aClean = aLower.replace(/[^a-z0-9]/g, "");
      return aLower.includes(q) || (qClean.length >= 2 && aClean.includes(qClean));
    });
    return Boolean(nameMatch || locationMatch || typeMatch || aliasMatch);
  });
}
