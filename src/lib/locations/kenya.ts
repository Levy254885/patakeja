/**
 * Central, structured Kenyan location data. Every page reads locations from here (via lib/locations/index.ts);
 * nothing is hard-coded elsewhere. Admins can extend or hide entries from Admin > Locations (stored in the
 * Firestore `locations` collection and merged on top of this bundle).
 *
 * Hierarchy: County -> Subcounty -> Ward -> Town/locality -> Estate/neighbourhood -> property address.
 * Bundled data covers all 47 counties, subcounties (constituencies) for the busiest counties, and popular
 * towns/estates for every county. Wards are not bundled: add them in Admin > Locations as the platform grows.
 */
import type { LocationNode } from "../types";
import { slugify } from "../format";

export const COUNTIES: { code: string; name: string }[] = [
  ["001", "Mombasa"], ["002", "Kwale"], ["003", "Kilifi"], ["004", "Tana River"], ["005", "Lamu"],
  ["006", "Taita-Taveta"], ["007", "Garissa"], ["008", "Wajir"], ["009", "Mandera"], ["010", "Marsabit"],
  ["011", "Isiolo"], ["012", "Meru"], ["013", "Tharaka-Nithi"], ["014", "Embu"], ["015", "Kitui"],
  ["016", "Machakos"], ["017", "Makueni"], ["018", "Nyandarua"], ["019", "Nyeri"], ["020", "Kirinyaga"],
  ["021", "Murang'a"], ["022", "Kiambu"], ["023", "Turkana"], ["024", "West Pokot"], ["025", "Samburu"],
  ["026", "Trans Nzoia"], ["027", "Uasin Gishu"], ["028", "Elgeyo-Marakwet"], ["029", "Nandi"], ["030", "Baringo"],
  ["031", "Laikipia"], ["032", "Nakuru"], ["033", "Narok"], ["034", "Kajiado"], ["035", "Kericho"],
  ["036", "Bomet"], ["037", "Kakamega"], ["038", "Vihiga"], ["039", "Bungoma"], ["040", "Busia"],
  ["041", "Siaya"], ["042", "Kisumu"], ["043", "Homa Bay"], ["044", "Migori"], ["045", "Kisii"],
  ["046", "Nyamira"], ["047", "Nairobi"],
].map(([code, name]) => ({ code, name }));

/** Subcounties (constituency-level) for the busiest counties. Others accept free text until added by an admin. */
const SUBCOUNTIES: Record<string, string[]> = {
  "047": ["Westlands", "Dagoretti North", "Dagoretti South", "Langata", "Kibra", "Roysambu", "Kasarani", "Ruaraka", "Embakasi South", "Embakasi North", "Embakasi Central", "Embakasi East", "Embakasi West", "Makadara", "Kamukunji", "Starehe", "Mathare"],
  "001": ["Changamwe", "Jomvu", "Kisauni", "Nyali", "Likoni", "Mvita"],
  "042": ["Kisumu East", "Kisumu West", "Kisumu Central", "Seme", "Nyando", "Muhoroni", "Nyakach"],
  "022": ["Gatundu South", "Gatundu North", "Juja", "Thika Town", "Ruiru", "Githunguri", "Kiambu", "Kiambaa", "Kabete", "Kikuyu", "Limuru", "Lari"],
  "032": ["Nakuru Town East", "Nakuru Town West", "Naivasha", "Gilgil", "Molo", "Njoro", "Kuresoi North", "Kuresoi South", "Rongai", "Subukia", "Bahati"],
  "016": ["Machakos Town", "Mavoko", "Kathiani", "Yatta", "Kangundo", "Matungulu", "Mwala", "Masinga"],
  "034": ["Kajiado North", "Kajiado Central", "Kajiado East", "Kajiado West", "Kajiado South"],
  "027": ["Soy", "Turbo", "Moiben", "Ainabkoi", "Kapseret", "Kesses"],
  "019": ["Tetu", "Kieni", "Mathira", "Othaya", "Mukurweini", "Nyeri Town"],
  "003": ["Kilifi North", "Kilifi South", "Kaloleni", "Rabai", "Ganze", "Malindi", "Magarini"],
  "002": ["Msambweni", "Lunga Lunga", "Matuga", "Kinango"],
  "021": ["Kangema", "Mathioya", "Kiharu", "Kigumo", "Maragwa", "Kandara", "Gatanga"],
};

/** Popular towns and estates per county. `towns` are urban centres, `estates` are neighbourhoods/estates. */
const AREAS: Record<string, { towns: string[]; estates?: string[] }> = {
  "047": { towns: ["Nairobi CBD", "Eastleigh", "Upper Hill"], estates: ["Kilimani", "Kileleshwa", "Lavington", "Westlands", "Parklands", "Karen", "Runda", "Muthaiga", "Kitisuru", "Loresho", "Spring Valley", "Riverside", "South B", "South C", "Langata", "Kasarani", "Roysambu", "Zimmerman", "Githurai", "Ruaraka", "Donholm", "Buruburu", "Umoja", "Embakasi", "Pipeline", "Utawala", "Ngong Road", "Dagoretti", "Kawangware", "Kibra"] },
  "001": { towns: ["Mombasa Island", "Mtwapa", "Likoni"], estates: ["Nyali", "Bamburi", "Kizingo", "Tudor", "Shanzu", "Mkomani", "Ganjoni", "Kongowea", "Changamwe", "Tononoka", "English Point"] },
  "042": { towns: ["Kisumu City"], estates: ["Milimani", "Mamboleo", "Kondele", "Manyatta", "Nyamasaria", "Riat", "Migosi", "Polyview", "Dunga", "Tom Mboya"] },
  "022": { towns: ["Ruaka", "Thika", "Ruiru", "Juja", "Kikuyu", "Kiambu Town", "Limuru", "Githunguri"], estates: ["Karuri", "Banana", "Gachie", "Kamiti", "Membley", "Tatu City"] },
  "032": { towns: ["Nakuru Town", "Naivasha", "Gilgil", "Njoro"], estates: ["Milimani", "Section 58", "Lanet", "Free Area", "Pipeline", "Kiamunyi", "Barnabas", "London", "Naivasha Town"] },
  "016": { towns: ["Syokimau", "Mlolongo", "Athi River", "Machakos Town", "Kangundo", "Tala"], estates: ["Joska", "Katani", "Mavoko"] },
  "034": { towns: ["Kitengela", "Ongata Rongai", "Ngong", "Kiserian", "Isinya", "Kajiado Town", "Namanga"], estates: ["Rongai", "Matasia", "Acacia"] },
  "027": { towns: ["Eldoret Town", "Burnt Forest", "Turbo"], estates: ["Elgon View", "Kimumu", "Langas", "Huruma", "Pioneer", "Kapseret"] },
  "019": { towns: ["Nyeri Town", "Karatina", "Othaya", "Mweiga", "Naro Moru"] },
  "003": { towns: ["Malindi", "Kilifi Town", "Mtwapa", "Watamu", "Mariakani"] },
  "002": { towns: ["Ukunda", "Diani Beach", "Msambweni", "Kinango"] },
  "004": { towns: ["Hola"] }, "005": { towns: ["Lamu Town", "Mpeketoni"] }, "006": { towns: ["Voi", "Wundanyi"] },
  "007": { towns: ["Garissa Town"] }, "008": { towns: ["Wajir Town"] }, "009": { towns: ["Mandera Town"] },
  "010": { towns: ["Marsabit Town", "Moyale"] }, "011": { towns: ["Isiolo Town"] }, "012": { towns: ["Meru Town", "Maua"] },
  "013": { towns: ["Chuka"] }, "014": { towns: ["Embu Town"] }, "015": { towns: ["Kitui Town"] },
  "017": { towns: ["Wote", "Emali"] }, "018": { towns: ["Ol Kalou"] }, "020": { towns: ["Kerugoya", "Kutus", "Wanguru"] },
  "021": { towns: ["Murang'a Town", "Kenol", "Maragua"] }, "023": { towns: ["Lodwar"] }, "024": { towns: ["Kapenguria"] },
  "025": { towns: ["Maralal"] }, "026": { towns: ["Kitale"] }, "028": { towns: ["Iten"] }, "029": { towns: ["Kapsabet"] },
  "030": { towns: ["Kabarnet", "Marigat"] }, "031": { towns: ["Nanyuki", "Nyahururu"] }, "033": { towns: ["Narok Town"] },
  "035": { towns: ["Kericho Town"] }, "036": { towns: ["Bomet Town"] }, "037": { towns: ["Kakamega Town", "Mumias"] },
  "038": { towns: ["Mbale", "Luanda"] }, "039": { towns: ["Bungoma Town", "Webuye", "Kimilili"] }, "040": { towns: ["Busia Town"] },
  "041": { towns: ["Siaya Town", "Bondo"] }, "043": { towns: ["Homa Bay Town"] }, "044": { towns: ["Migori Town", "Rongo"] },
  "045": { towns: ["Kisii Town"] }, "046": { towns: ["Nyamira Town"] },
};

export const countyIdFromCode = (code: string) => code;

function node(level: LocationNode["level"], name: string, countyId: string, parentId?: string): LocationNode {
  const slug = slugify(name);
  const prefix = level === "subcounty" ? "s" : level === "town" ? "t" : level === "estate" ? "e" : level === "ward" ? "w" : "";
  return { id: level === "county" ? countyId : `${countyId}-${prefix}-${slug}`, name, level, parentId, countyId, slug, active: true };
}

/** All bundled nodes as a flat list (ids are deterministic, so the seed script can write them idempotently). */
export function buildStaticNodes(): LocationNode[] {
  const out: LocationNode[] = [];
  for (const c of COUNTIES) {
    out.push(node("county", c.name, c.code));
    for (const s of SUBCOUNTIES[c.code] ?? []) out.push(node("subcounty", s, c.code, c.code));
    const a = AREAS[c.code];
    for (const t of a?.towns ?? []) out.push(node("town", t, c.code, c.code));
    for (const e of a?.estates ?? []) out.push(node("estate", e, c.code, c.code));
  }
  return out;
}
