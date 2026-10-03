/**
 * Seed admin-editable cities and localities into MongoDB.
 *
 *   node --env-file=.env scripts/seed-cities.mjs
 *
 * These live in the City collection rather than src/data/cities.js so they
 * can be edited or removed from /admin/cities like any city an admin adds.
 *
 * Inserts only what is missing, matched on slug — a city the admin already
 * added, edited or renamed is never touched, so re-running is safe.
 *
 * A locality carries `parent`: the city whose lawyers its page lists, since
 * nobody registers with "Saket" as their city (see lawyerCityOf).
 */
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set. Run it as: node --env-file=.env scripts/seed-cities.mjs');
  process.exit(1);
}

const CITIES = [
  {"slug": "tirupati", "name": "Tirupati", "state": "Andhra Pradesh", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Tirumala_090615.jpg/500px-Tirumala_090615.jpg"},
  {"slug": "nellore", "name": "Nellore", "state": "Andhra Pradesh", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Sri_Ranganathaswamy_Temple%2C_Galigopuram%2C_Nellore_%284%29.jpg/500px-Sri_Ranganathaswamy_Temple%2C_Galigopuram%2C_Nellore_%284%29.jpg"},
  {"slug": "kurnool", "name": "Kurnool", "state": "Andhra Pradesh", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/23_-_Telugu_Talli_Statue_with_Kondareddy_Buruju_as_background.JPG/500px-23_-_Telugu_Talli_Statue_with_Kondareddy_Buruju_as_background.JPG"},
  {"slug": "rajahmundry", "name": "Rajahmundry", "state": "Andhra Pradesh", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Sunset_at_Godavri.JPG/500px-Sunset_at_Godavri.JPG"},
  {"slug": "kakinada", "name": "Kakinada", "state": "Andhra Pradesh", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/District_Collector_Office_building_at_Kakinada.jpg/500px-District_Collector_Office_building_at_Kakinada.jpg"},
  {"slug": "salem", "name": "Salem", "state": "Tamil Nadu", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Salem_city_from_Hills.jpg/500px-Salem_city_from_Hills.jpg"},
  {"slug": "tiruppur", "name": "Tiruppur", "state": "Tamil Nadu", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Noyyal_River_in_Tiruppur_JEG0334.jpg/500px-Noyyal_River_in_Tiruppur_JEG0334.jpg"},
  {"slug": "erode", "name": "Erode", "state": "Tamil Nadu", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Cauvery_at_Erode.JPG/500px-Cauvery_at_Erode.JPG"},
  {"slug": "vellore", "name": "Vellore", "state": "Tamil Nadu", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Javadi_Hills.jpg/500px-Javadi_Hills.jpg"},
  {"slug": "tirunelveli", "name": "Tirunelveli", "state": "Tamil Nadu", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Nellaiappar_temple_tower.jpg/500px-Nellaiappar_temple_tower.jpg"},
  {"slug": "thrissur", "name": "Thrissur", "state": "Kerala", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/JJP_112.jpg/500px-JJP_112.jpg"},
  {"slug": "kollam", "name": "Kollam", "state": "Kerala"},
  {"slug": "kannur", "name": "Kannur", "state": "Kerala", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Kannur_Skyline_3.jpg/500px-Kannur_Skyline_3.jpg"},
  {"slug": "kottayam", "name": "Kottayam", "state": "Kerala", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Kottayam_Collage.jpg/500px-Kottayam_Collage.jpg"},
  {"slug": "belagavi", "name": "Belagavi", "state": "Karnataka", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Kamal_Basti_view%2C_Belgaum.jpg/500px-Kamal_Basti_view%2C_Belgaum.jpg"},
  {"slug": "kalaburagi", "name": "Kalaburagi", "state": "Karnataka", "image": "https://upload.wikimedia.org/wikipedia/en/thumb/1/17/GulbargaPlaces.png/500px-GulbargaPlaces.png"},
  {"slug": "davanagere", "name": "Davanagere", "state": "Karnataka", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/HBPA_N_1107_Davanagere_Glass_House.jpg/500px-HBPA_N_1107_Davanagere_Glass_House.jpg"},
  {"slug": "shivamogga", "name": "Shivamogga", "state": "Karnataka", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/City_centre_mall_shimoga.jpg/500px-City_centre_mall_shimoga.jpg"},
  {"slug": "udupi", "name": "Udupi", "state": "Karnataka", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Udupi_Krishna_Temple.jpg/500px-Udupi_Krishna_Temple.jpg"},
  {"slug": "solapur", "name": "Solapur", "state": "Maharashtra", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Solapur_Municipal_Corporation_building%2C_Indra_Bhuvan_credit_Alka_Kshirsagar.jpg/500px-Solapur_Municipal_Corporation_building%2C_Indra_Bhuvan_credit_Alka_Kshirsagar.jpg"},
  {"slug": "kolhapur", "name": "Kolhapur", "state": "Maharashtra", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Mahalaxmi_Temple%2C_Kolhapur.jpg/500px-Mahalaxmi_Temple%2C_Kolhapur.jpg"},
  {"slug": "amravati", "name": "Amravati", "state": "Maharashtra", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Amravati_Court.jpg/500px-Amravati_Court.jpg"},
  {"slug": "sangli", "name": "Sangli", "state": "Maharashtra", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Sangli-ganpati-02.jpg/500px-Sangli-ganpati-02.jpg"},
  {"slug": "ahmednagar", "name": "Ahmednagar", "state": "Maharashtra", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Ahmednagarrailwaystation.jpg/500px-Ahmednagarrailwaystation.jpg"},
  {"slug": "nanded", "name": "Nanded", "state": "Maharashtra", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Vishnupuri_temple_-_panoramio.jpg/500px-Vishnupuri_temple_-_panoramio.jpg"},
  {"slug": "bhavnagar", "name": "Bhavnagar", "state": "Gujarat", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Shri_Swaminarayan_Mandir_gate.jpg/500px-Shri_Swaminarayan_Mandir_gate.jpg"},
  {"slug": "jamnagar", "name": "Jamnagar", "state": "Gujarat", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Lakhota_lake_Jamnagar%2C_Golden_hours.jpg/500px-Lakhota_lake_Jamnagar%2C_Golden_hours.jpg"},
  {"slug": "junagadh", "name": "Junagadh", "state": "Gujarat", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Dattatreya_Temple_of_Girnar.JPG/500px-Dattatreya_Temple_of_Girnar.JPG"},
  {"slug": "ajmer", "name": "Ajmer", "state": "Rajasthan", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/ADHAI_DIN_KA_JHONPRA.jpg/500px-ADHAI_DIN_KA_JHONPRA.jpg"},
  {"slug": "bikaner", "name": "Bikaner", "state": "Rajasthan", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/The_Laxmi_Niwas_Palace%2C_Bikaner%2C_Rajasthan.jpg/500px-The_Laxmi_Niwas_Palace%2C_Bikaner%2C_Rajasthan.jpg"},
  {"slug": "alwar", "name": "Alwar", "state": "Rajasthan", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Skyline_of_Alwar_City.jpg/500px-Skyline_of_Alwar_City.jpg"},
  {"slug": "ujjain", "name": "Ujjain", "state": "Madhya Pradesh", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Mahakaleshwar_Temple%2C_Ujjain.jpg/500px-Mahakaleshwar_Temple%2C_Ujjain.jpg"},
  {"slug": "sagar", "name": "Sagar", "state": "Madhya Pradesh", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Lakha_Banjara_Lake_Sagar.png/500px-Lakha_Banjara_Lake_Sagar.png"},
  {"slug": "rewa", "name": "Rewa", "state": "Madhya Pradesh", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Vyankat_Bhawan.jpg/500px-Vyankat_Bhawan.jpg"},
  {"slug": "bareilly", "name": "Bareilly", "state": "Uttar Pradesh", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Dargah_Aala_Hazrat_2.jpg/500px-Dargah_Aala_Hazrat_2.jpg"},
  {"slug": "aligarh", "name": "Aligarh", "state": "Uttar Pradesh"},
  {"slug": "moradabad", "name": "Moradabad", "state": "Uttar Pradesh", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/New_Moradabad_Skyline_NH_24.jpg/500px-New_Moradabad_Skyline_NH_24.jpg"},
  {"slug": "saharanpur", "name": "Saharanpur", "state": "Uttar Pradesh", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Baba_Bhura_Dev_temple%2C_Shakumbhri_Devi_-_panoramio.jpg/500px-Baba_Bhura_Dev_temple%2C_Shakumbhri_Devi_-_panoramio.jpg"},
  {"slug": "jhansi", "name": "Jhansi", "state": "Uttar Pradesh", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Inside_the_Rani_Laxmibai%27s_Jhansi_Fort_in_Jhansi%2C_Uttar_Pradesh_04.jpg/500px-Inside_the_Rani_Laxmibai%27s_Jhansi_Fort_in_Jhansi%2C_Uttar_Pradesh_04.jpg"},
  {"slug": "mathura", "name": "Mathura", "state": "Uttar Pradesh", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Vishram_Ghat.jpg/500px-Vishram_Ghat.jpg"},
  {"slug": "ayodhya", "name": "Ayodhya", "state": "Uttar Pradesh", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Shri_Ram_Janambhoomi_Mandir%2C_Ayodhya_Dham.jpg/500px-Shri_Ram_Janambhoomi_Mandir%2C_Ayodhya_Dham.jpg"},
  {"slug": "greater-noida", "name": "Greater Noida", "state": "Uttar Pradesh", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Greaternoida_expressway_Q2.jpg/500px-Greaternoida_expressway_Q2.jpg"},
  {"slug": "haldwani", "name": "Haldwani", "state": "Uttarakhand", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Tikonia_Haldwani_02.jpg/500px-Tikonia_Haldwani_02.jpg"},
  {"slug": "rishikesh", "name": "Rishikesh", "state": "Uttarakhand", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Trayambakeshwar_Temple_VK.jpg/500px-Trayambakeshwar_Temple_VK.jpg"},
  {"slug": "nainital", "name": "Nainital", "state": "Uttarakhand", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Nainital_metro.jpg/500px-Nainital_metro.jpg"},
  {"slug": "patiala", "name": "Patiala", "state": "Punjab", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Qila_Mubarak%2C_Patiala_%28Cropped%29.jpg/500px-Qila_Mubarak%2C_Patiala_%28Cropped%29.jpg"},
  {"slug": "bathinda", "name": "Bathinda", "state": "Punjab", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Qila_Mubarak_in_2015%282%29.jpg/500px-Qila_Mubarak_in_2015%282%29.jpg"},
  {"slug": "mohali", "name": "Mohali", "state": "Punjab", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/View_of_Chandigarh_International_Airport_road_%2CMohali_in_spring_season_08_%28cropped%29.jpg/500px-View_of_Chandigarh_International_Airport_road_%2CMohali_in_spring_season_08_%28cropped%29.jpg"},
  {"slug": "ambala", "name": "Ambala", "state": "Haryana", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Ambala_Cantonment_Railway_Station.jpg/500px-Ambala_Cantonment_Railway_Station.jpg"},
  {"slug": "karnal", "name": "Karnal", "state": "Haryana", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Karnal_2.jpg/500px-Karnal_2.jpg"},
  {"slug": "hisar", "name": "Hisar", "state": "Haryana"},
  {"slug": "rohtak", "name": "Rohtak", "state": "Haryana", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Indian_Institute_of_Management_Rohtak%2C_Academic_Block.jpg/500px-Indian_Institute_of_Management_Rohtak%2C_Academic_Block.jpg"},
  {"slug": "sonipat", "name": "Sonipat", "state": "Haryana", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Sonipat_junction.jpg/500px-Sonipat_junction.jpg"},
  {"slug": "panchkula", "name": "Panchkula", "state": "Haryana", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Yagya_Shala%2C_within_the_Mansa_Devi_temple_complex%2C_Panchkula_near_Chandigarh.jpg/500px-Yagya_Shala%2C_within_the_Mansa_Devi_temple_complex%2C_Panchkula_near_Chandigarh.jpg"},
  {"slug": "muzaffarpur", "name": "Muzaffarpur", "state": "Bihar", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Aerial_view_of_Muzaffarpur.jpg/500px-Aerial_view_of_Muzaffarpur.jpg"},
  {"slug": "darbhanga", "name": "Darbhanga", "state": "Bihar", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Darbhanga_1.jpg/500px-Darbhanga_1.jpg"},
  {"slug": "bokaro", "name": "Bokaro", "state": "Jharkhand", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Bokaro_Steel_Plant_.jpg/500px-Bokaro_Steel_Plant_.jpg"},
  {"slug": "deoghar", "name": "Deoghar", "state": "Jharkhand", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Baba_Baidyanath_Jyotirlinga_Temple.jpg/500px-Baba_Baidyanath_Jyotirlinga_Temple.jpg"},
  {"slug": "berhampur", "name": "Berhampur", "state": "Odisha", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Ramalingeswar_%2C_Brahmapur%2C_Odisha.jpg/500px-Ramalingeswar_%2C_Brahmapur%2C_Odisha.jpg"},
  {"slug": "sambalpur", "name": "Sambalpur", "state": "Odisha", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Hirakud_Dam.jpg/500px-Hirakud_Dam.jpg"},
  {"slug": "puri", "name": "Puri", "state": "Odisha"},
  {"slug": "asansol", "name": "Asansol", "state": "West Bengal", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/IMG_asnrlyjn.jpg/500px-IMG_asnrlyjn.jpg"},
  {"slug": "jorhat", "name": "Jorhat", "state": "Assam", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Tarun_Ram_Phukan_Road_Jorhat.jpg/500px-Tarun_Ram_Phukan_Road_Jorhat.jpg"},
  {"slug": "karimnagar", "name": "Karimnagar", "state": "Telangana", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Teen_minar_Elgandal_fort_Karimnagar.jpg/500px-Teen_minar_Elgandal_fort_Karimnagar.jpg"},
  {"slug": "durg", "name": "Durg", "state": "Chhattisgarh", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Rajendra_park%2C_durg.jpg/500px-Rajendra_park%2C_durg.jpg"},
  {"slug": "saket", "name": "Saket", "state": "Delhi", "parent": "Delhi"},
  {"slug": "dwarka", "name": "Dwarka", "state": "Delhi", "parent": "Delhi"},
  {"slug": "rohini", "name": "Rohini", "state": "Delhi", "parent": "Delhi", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Adventure_Island_Entrance...near_Rithala_Metro_Station.png/500px-Adventure_Island_Entrance...near_Rithala_Metro_Station.png"},
  {"slug": "karkardooma", "name": "Karkardooma", "state": "Delhi", "parent": "Delhi"},
  {"slug": "connaught-place", "name": "Connaught Place", "state": "Delhi", "parent": "Delhi"},
  {"slug": "andheri", "name": "Andheri", "state": "Maharashtra", "parent": "Mumbai"},
  {"slug": "bandra", "name": "Bandra", "state": "Maharashtra", "parent": "Mumbai", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Bandra_Worli_Sea_Link_at_night.jpg/500px-Bandra_Worli_Sea_Link_at_night.jpg"},
  {"slug": "borivali", "name": "Borivali", "state": "Maharashtra", "parent": "Mumbai", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Skyscrapers_of_Mumbai_viewed_from_%27National_Park%2C_Borivili.jpg/500px-Skyscrapers_of_Mumbai_viewed_from_%27National_Park%2C_Borivili.jpg"},
  {"slug": "whitefield", "name": "Whitefield", "state": "Karnataka", "parent": "Bengaluru", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Prestige_Shantiniketan_In_Whitefield_Main_Road.jpg/500px-Prestige_Shantiniketan_In_Whitefield_Main_Road.jpg"},
  {"slug": "koramangala", "name": "Koramangala", "state": "Karnataka", "parent": "Bengaluru", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Koramangala_Junction.JPG/500px-Koramangala_Junction.JPG"},
  {"slug": "secunderabad", "name": "Secunderabad", "state": "Telangana", "parent": "Hyderabad", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Clock_Tower_Secunderabad.jpg/500px-Clock_Tower_Secunderabad.jpg"},
  {"slug": "gachibowli", "name": "Gachibowli", "state": "Telangana", "parent": "Hyderabad", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/GachibowliSkyLine.jpg/500px-GachibowliSkyLine.jpg"},
  {"slug": "anna-nagar", "name": "Anna Nagar", "state": "Tamil Nadu", "parent": "Chennai", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Anna_Nagar_Tower_Park_From_Entrance_20Jan2013.jpg/500px-Anna_Nagar_Tower_Park_From_Entrance_20Jan2013.jpg"},
  {"slug": "salt-lake", "name": "Salt Lake", "state": "West Bengal", "parent": "Kolkata", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Salt_Lake_City_Sector_V.jpg/500px-Salt_Lake_City_Sector_V.jpg"},
  {"slug": "shivajinagar-pune", "name": "Shivajinagar", "state": "Maharashtra", "parent": "Pune"},
];

await mongoose.connect(MONGODB_URI);
const col = mongoose.connection.db.collection('cities');

let added = 0;
let skipped = 0;
for (const c of CITIES) {
  const now = new Date();
  const res = await col.updateOne(
    { slug: c.slug },
    {
      $setOnInsert: {
        slug: c.slug,
        name: c.name,
        state: c.state,
        parent: c.parent || '',
        advocates: 0,
        image: c.image || '',
        createdAt: now,
        updatedAt: now,
      },
    },
    { upsert: true }
  );
  if (res.upsertedCount) added += 1;
  else skipped += 1;
}

console.log(`cities: ${added} added, ${skipped} already there`);
await mongoose.disconnect();
