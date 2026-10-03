/**
 * Popular cities used by search, city landing pages and the sitemap.
 * `image` is a real landmark photo of the city (Wikimedia Commons, 500px).
 *
 * Order matters twice over: the homepage rail shows only the first twenty (see
 * PopularCities), and /cities lists them all in this order. So the metros lead,
 * then the rest roughly by size and by how widely the name is recognised.
 *
 * The list leans towards places a legal directory actually needs — every High
 * Court seat and bench is here, which is why Prayagraj, Jodhpur, Cuttack and
 * Jabalpur sit among cities several times their size.
 *
 * Names are the ones a lawyer types into the registration form, because that
 * is what they are matched against (see `servesCity`). That means the current
 * official name almost everywhere — Bengaluru, Prayagraj, Mysuru — but
 * Aurangabad rather than Chhatrapati Sambhajinagar, which nobody enters yet.
 *
 * `advocates` on the older entries is a legacy seed figure and is not a count
 * of anything. Nothing public reads it — the tiles and city pages count real
 * registrations via `getLawyerCountsByCity` — so newer entries do not carry a
 * made-up one.
 */
export const CITIES = [
  {
    slug: 'delhi',
    name: 'Delhi',
    state: 'Delhi',
    advocates: 8600,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/India_Gate_%28All_India_War_Memorial%29.jpg/500px-India_Gate_%28All_India_War_Memorial%29.jpg',
  },
  {
    slug: 'mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    advocates: 7900,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Mumbai_03-2016_30_Gateway_of_India.jpg/500px-Mumbai_03-2016_30_Gateway_of_India.jpg',
  },
  {
    slug: 'bengaluru',
    name: 'Bengaluru',
    state: 'Karnataka',
    advocates: 6400,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Vidhana_Soudha_2012.jpg/500px-Vidhana_Soudha_2012.jpg',
  },
  {
    slug: 'hyderabad',
    name: 'Hyderabad',
    state: 'Telangana',
    advocates: 5100,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Charminar_Hyderabad_1.jpg/500px-Charminar_Hyderabad_1.jpg',
  },
  {
    slug: 'chennai',
    name: 'Chennai',
    state: 'Tamil Nadu',
    advocates: 4800,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Kapaleeswarar1.jpg/500px-Kapaleeswarar1.jpg',
  },
  {
    slug: 'kolkata',
    name: 'Kolkata',
    state: 'West Bengal',
    advocates: 4300,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Victoria_Memorial_situated_in_Kolkata.jpg/500px-Victoria_Memorial_situated_in_Kolkata.jpg',
  },
  {
    slug: 'pune',
    name: 'Pune',
    state: 'Maharashtra',
    advocates: 3700,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Front_view_of_Shaniwar_Wada_illuminated.jpg/500px-Front_view_of_Shaniwar_Wada_illuminated.jpg',
  },
  {
    slug: 'ahmedabad',
    name: 'Ahmedabad',
    state: 'Gujarat',
    advocates: 3200,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/GANDHI_ASHRAM_03.jpg/500px-GANDHI_ASHRAM_03.jpg',
  },
  {
    slug: 'jaipur',
    name: 'Jaipur',
    state: 'Rajasthan',
    advocates: 2600,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/East_facade_Hawa_Mahal_Jaipur_from_ground_level_%28July_2022%29_-_img_01.jpg/500px-East_facade_Hawa_Mahal_Jaipur_from_ground_level_%28July_2022%29_-_img_01.jpg',
  },
  {
    slug: 'lucknow',
    name: 'Lucknow',
    state: 'Uttar Pradesh',
    advocates: 2400,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Rumi_Darwaza_-_DSC2797-01.jpg/500px-Rumi_Darwaza_-_DSC2797-01.jpg',
  },
  {
    slug: 'chandigarh',
    name: 'Chandigarh',
    state: 'Chandigarh',
    advocates: 1900,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Chandigarh_Rock_Garden_4.jpg/500px-Chandigarh_Rock_Garden_4.jpg',
  },
  {
    slug: 'patna',
    name: 'Patna',
    state: 'Bihar',
    advocates: 1700,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Golghar_%E0%A5%AA.jpg/500px-Golghar_%E0%A5%AA.jpg',
  },
  {
    slug: 'gurugram',
    name: 'Gurugram',
    state: 'Haryana',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Culture_Gully_and_Nautanki_Mahal_auditorium%2C_Kingdom_of_Dreams%2C_Gurgaon.jpg/500px-Culture_Gully_and_Nautanki_Mahal_auditorium%2C_Kingdom_of_Dreams%2C_Gurgaon.jpg',
  },
  {
    slug: 'noida',
    name: 'Noida',
    state: 'Uttar Pradesh',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Sector_78_Noida_with_Moonlight.jpg/500px-Sector_78_Noida_with_Moonlight.jpg',
  },
  {
    slug: 'surat',
    name: 'Surat',
    state: 'Gujarat',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Bharthana_Althan_area.jpg/500px-Bharthana_Althan_area.jpg',
  },
  {
    slug: 'nagpur',
    name: 'Nagpur',
    state: 'Maharashtra',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Dheekshabhoomi_in_Nagpur.jpg/500px-Dheekshabhoomi_in_Nagpur.jpg',
  },
  {
    slug: 'indore',
    name: 'Indore',
    state: 'Madhya Pradesh',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Indore_Rajwada01.jpg/500px-Indore_Rajwada01.jpg',
  },
  {
    slug: 'bhopal',
    name: 'Bhopal',
    state: 'Madhya Pradesh',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Taj-ul-Masjid%2C_Bhopal%2C_India.jpg/500px-Taj-ul-Masjid%2C_Bhopal%2C_India.jpg',
  },
  {
    slug: 'kochi',
    name: 'Kochi',
    state: 'Kerala',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Kochi%2C_Fishing_nets_at_sunset%2C_Kerala%2C_India.jpg/500px-Kochi%2C_Fishing_nets_at_sunset%2C_Kerala%2C_India.jpg',
  },
  {
    slug: 'visakhapatnam',
    name: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Kailasagiri.jpg/500px-Kailasagiri.jpg',
  },
  {
    slug: 'ghaziabad',
    name: 'Ghaziabad',
    state: 'Uttar Pradesh',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Indirapuram.jpg/500px-Indirapuram.jpg',
  },
  {
    slug: 'faridabad',
    name: 'Faridabad',
    state: 'Haryana',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Vatika_Business_Towers_Faridabad.png/500px-Vatika_Business_Towers_Faridabad.png',
  },
  {
    slug: 'thane',
    name: 'Thane',
    state: 'Maharashtra',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Hiranandaniestate.jpg/500px-Hiranandaniestate.jpg',
  },
  {
    slug: 'navi-mumbai',
    name: 'Navi Mumbai',
    state: 'Maharashtra',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Vashi_Skyline.jpg/500px-Vashi_Skyline.jpg',
  },
  {
    slug: 'nashik',
    name: 'Nashik',
    state: 'Maharashtra',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Trimbakeshwar_Temple-Nashik-Maharashtra-1.jpg/500px-Trimbakeshwar_Temple-Nashik-Maharashtra-1.jpg',
  },
  {
    slug: 'kanpur',
    name: 'Kanpur',
    state: 'Uttar Pradesh',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/J.K._Temple_%28cropped%29.jpg/500px-J.K._Temple_%28cropped%29.jpg',
  },
  {
    slug: 'prayagraj',
    name: 'Prayagraj',
    state: 'Uttar Pradesh',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Allahabad_high_court.jpg/500px-Allahabad_high_court.jpg',
  },
  {
    slug: 'varanasi',
    name: 'Varanasi',
    state: 'Uttar Pradesh',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Dasaswamedh_ghat-varanasi_india-andres_larin.jpg/500px-Dasaswamedh_ghat-varanasi_india-andres_larin.jpg',
  },
  {
    slug: 'agra',
    name: 'Agra',
    state: 'Uttar Pradesh',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Taj_Mahal_%28Edited%29.jpeg/500px-Taj_Mahal_%28Edited%29.jpeg',
  },
  {
    slug: 'meerut',
    name: 'Meerut',
    state: 'Uttar Pradesh',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Mustafa_Castle_--_night_shot.jpg/500px-Mustafa_Castle_--_night_shot.jpg',
  },
  {
    slug: 'gorakhpur',
    name: 'Gorakhpur',
    state: 'Uttar Pradesh',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Gorakhnath_Mandir_in_nutshell.jpg/500px-Gorakhnath_Mandir_in_nutshell.jpg',
  },
  {
    slug: 'dehradun',
    name: 'Dehradun',
    state: 'Uttarakhand',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Dehradun_view_from_maggi_point.jpg/500px-Dehradun_view_from_maggi_point.jpg',
  },
  {
    slug: 'ludhiana',
    name: 'Ludhiana',
    state: 'Punjab',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Omaxe_Twin_Tower_%281%29.jpg/500px-Omaxe_Twin_Tower_%281%29.jpg',
  },
  {
    slug: 'amritsar',
    name: 'Amritsar',
    state: 'Punjab',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/The_Golden_Temple_of_Amrithsar_7.jpg/500px-The_Golden_Temple_of_Amrithsar_7.jpg',
  },
  {
    slug: 'shimla',
    name: 'Shimla',
    state: 'Himachal Pradesh',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/The_Ridge_Shimla_5.jpg/500px-The_Ridge_Shimla_5.jpg',
  },
  {
    slug: 'jammu',
    name: 'Jammu',
    state: 'Jammu and Kashmir',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Bahu_Fort%2C_Jammu%2C_India.jpg/500px-Bahu_Fort%2C_Jammu%2C_India.jpg',
  },
  {
    slug: 'srinagar',
    name: 'Srinagar',
    state: 'Jammu and Kashmir',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Dal_Lake_Hazratbal_Srinagar.jpg/500px-Dal_Lake_Hazratbal_Srinagar.jpg',
  },
  {
    slug: 'jodhpur',
    name: 'Jodhpur',
    state: 'Rajasthan',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Mehrangarh_Fort_sanhita.jpg/500px-Mehrangarh_Fort_sanhita.jpg',
  },
  {
    slug: 'udaipur',
    name: 'Udaipur',
    state: 'Rajasthan',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Udaipur_City_Palace.jpg/500px-Udaipur_City_Palace.jpg',
  },
  {
    slug: 'kota',
    name: 'Kota',
    state: 'Rajasthan',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Jag_Mandir_Kota.jpg/500px-Jag_Mandir_Kota.jpg',
  },
  {
    slug: 'vadodara',
    name: 'Vadodara',
    state: 'Gujarat',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Lakshmi_Vilas_Palace%2C_Vadodara.jpg/500px-Lakshmi_Vilas_Palace%2C_Vadodara.jpg',
  },
  {
    slug: 'rajkot',
    name: 'Rajkot',
    state: 'Gujarat',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/High_street_-_150_ft_Ring_road_Rajkot.jpg/500px-High_street_-_150_ft_Ring_road_Rajkot.jpg',
  },
  {
    slug: 'gandhinagar',
    name: 'Gandhinagar',
    state: 'Gujarat',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Akshardham_Gandhinagar_Gujarat.jpg/500px-Akshardham_Gandhinagar_Gujarat.jpg',
  },
  {
    slug: 'jabalpur',
    name: 'Jabalpur',
    state: 'Madhya Pradesh',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Dhuandhar_Waterfalls_in_Bhedaghat%2C_India.jpg/500px-Dhuandhar_Waterfalls_in_Bhedaghat%2C_India.jpg',
  },
  {
    slug: 'gwalior',
    name: 'Gwalior',
    state: 'Madhya Pradesh',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Gwalior_Fort_front.jpg/500px-Gwalior_Fort_front.jpg',
  },
  {
    slug: 'raipur',
    name: 'Raipur',
    state: 'Chhattisgarh',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Sri_Ram_Mandir_raipur_.jpg/500px-Sri_Ram_Mandir_raipur_.jpg',
  },
  {
    slug: 'aurangabad',
    name: 'Aurangabad',
    state: 'Maharashtra',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/The_Tomb_of_Dilras_Banu_Begum.jpg/500px-The_Tomb_of_Dilras_Banu_Begum.jpg',
  },
  {
    slug: 'panaji',
    name: 'Panaji',
    state: 'Goa',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Panaji_City.JPG/500px-Panaji_City.JPG',
  },
  {
    slug: 'mysuru',
    name: 'Mysuru',
    state: 'Karnataka',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Mysore_Palace_Morning.jpg/500px-Mysore_Palace_Morning.jpg',
  },
  {
    slug: 'mangaluru',
    name: 'Mangaluru',
    state: 'Karnataka',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Growing_skylines_of_the_Mangalore_CBD_region.jpg/500px-Growing_skylines_of_the_Mangalore_CBD_region.jpg',
  },
  {
    slug: 'hubballi',
    name: 'Hubballi',
    state: 'Karnataka',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Hubliwiki.jpg/500px-Hubliwiki.jpg',
  },
  {
    slug: 'thiruvananthapuram',
    name: 'Thiruvananthapuram',
    state: 'Kerala',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Sree_Padmanabhaswamy_temple_01.jpg/500px-Sree_Padmanabhaswamy_temple_01.jpg',
  },
  {
    slug: 'coimbatore',
    name: 'Coimbatore',
    state: 'Tamil Nadu',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/CHIL_SEZ.jpg/500px-CHIL_SEZ.jpg',
  },
  {
    slug: 'madurai',
    name: 'Madurai',
    state: 'Tamil Nadu',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/An_aerial_view_of_Madurai_city_from_atop_of_Meenakshi_Amman_temple.jpg/500px-An_aerial_view_of_Madurai_city_from_atop_of_Meenakshi_Amman_temple.jpg',
  },
  {
    slug: 'tiruchirappalli',
    name: 'Tiruchirappalli',
    state: 'Tamil Nadu',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Rock_Fortress_-_Tiruchirappalli_-_India.JPG/500px-Rock_Fortress_-_Tiruchirappalli_-_India.JPG',
  },
  {
    slug: 'vijayawada',
    name: 'Vijayawada',
    state: 'Andhra Pradesh',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Kanakadurga_Temple_gopuram.jpg/500px-Kanakadurga_Temple_gopuram.jpg',
  },
  {
    slug: 'warangal',
    name: 'Warangal',
    state: 'Telangana',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/1000pillar_temple_warangal.jpg/500px-1000pillar_temple_warangal.jpg',
  },
  {
    slug: 'bhubaneswar',
    name: 'Bhubaneswar',
    state: 'Odisha',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Lingaraj_Temple_%2C_Bhubaneswar.jpg/500px-Lingaraj_Temple_%2C_Bhubaneswar.jpg',
  },
  {
    slug: 'cuttack',
    name: 'Cuttack',
    state: 'Odisha',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Entrance_of_Barabati_fort.jpg/500px-Entrance_of_Barabati_fort.jpg',
  },
  {
    slug: 'ranchi',
    name: 'Ranchi',
    state: 'Jharkhand',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Ranchi_Cityscape.jpg/500px-Ranchi_Cityscape.jpg',
  },
  {
    slug: 'jamshedpur',
    name: 'Jamshedpur',
    state: 'Jharkhand',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Jublie_Park_Night_on_March.jpg/500px-Jublie_Park_Night_on_March.jpg',
  },
  {
    slug: 'howrah',
    name: 'Howrah',
    state: 'West Bengal',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Howrah_bridge_at_night.jpg/500px-Howrah_bridge_at_night.jpg',
  },
  {
    slug: 'siliguri',
    name: 'Siliguri',
    state: 'West Bengal',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Siliguri_view_3.jpg/500px-Siliguri_view_3.jpg',
  },
  {
    slug: 'guwahati',
    name: 'Guwahati',
    state: 'Assam',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Kamakhya_Temple_-_DEV_8829.jpg/500px-Kamakhya_Temple_-_DEV_8829.jpg',
  },
  {
    slug: 'shillong',
    name: 'Shillong',
    state: 'Meghalaya',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Elephant_Falls_II%2C_Shillong.jpg/500px-Elephant_Falls_II%2C_Shillong.jpg',
  },
  {
    slug: 'puducherry',
    name: 'Puducherry',
    state: 'Puducherry',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Pondicherry-Rock_beach_aerial_view.jpg/500px-Pondicherry-Rock_beach_aerial_view.jpg',
  },
  // ── More cities ──────────────────────────────────────────────────────
  // District headquarters and well-known towns that clients search by name.
  // Anything the admin had already added from the panel is left to the panel.
  {
    slug: 'tirupati',
    name: 'Tirupati',
    state: 'Andhra Pradesh',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Tirumala_090615.jpg/500px-Tirumala_090615.jpg',
  },
  {
    slug: 'nellore',
    name: 'Nellore',
    state: 'Andhra Pradesh',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Sri_Ranganathaswamy_Temple%2C_Galigopuram%2C_Nellore_%284%29.jpg/500px-Sri_Ranganathaswamy_Temple%2C_Galigopuram%2C_Nellore_%284%29.jpg',
  },
  {
    slug: 'kurnool',
    name: 'Kurnool',
    state: 'Andhra Pradesh',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/23_-_Telugu_Talli_Statue_with_Kondareddy_Buruju_as_background.JPG/500px-23_-_Telugu_Talli_Statue_with_Kondareddy_Buruju_as_background.JPG',
  },
  {
    slug: 'rajahmundry',
    name: 'Rajahmundry',
    state: 'Andhra Pradesh',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Sunset_at_Godavri.JPG/500px-Sunset_at_Godavri.JPG',
  },
  {
    slug: 'kakinada',
    name: 'Kakinada',
    state: 'Andhra Pradesh',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/District_Collector_Office_building_at_Kakinada.jpg/500px-District_Collector_Office_building_at_Kakinada.jpg',
  },
  {
    slug: 'salem',
    name: 'Salem',
    state: 'Tamil Nadu',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Salem_city_from_Hills.jpg/500px-Salem_city_from_Hills.jpg',
  },
  {
    slug: 'tiruppur',
    name: 'Tiruppur',
    state: 'Tamil Nadu',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Noyyal_River_in_Tiruppur_JEG0334.jpg/500px-Noyyal_River_in_Tiruppur_JEG0334.jpg',
  },
  {
    slug: 'erode',
    name: 'Erode',
    state: 'Tamil Nadu',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Cauvery_at_Erode.JPG/500px-Cauvery_at_Erode.JPG',
  },
  {
    slug: 'vellore',
    name: 'Vellore',
    state: 'Tamil Nadu',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Javadi_Hills.jpg/500px-Javadi_Hills.jpg',
  },
  {
    slug: 'tirunelveli',
    name: 'Tirunelveli',
    state: 'Tamil Nadu',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Nellaiappar_temple_tower.jpg/500px-Nellaiappar_temple_tower.jpg',
  },
  {
    slug: 'thrissur',
    name: 'Thrissur',
    state: 'Kerala',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/JJP_112.jpg/500px-JJP_112.jpg',
  },
  {
    slug: 'kollam',
    name: 'Kollam',
    state: 'Kerala',
  },
  {
    slug: 'kannur',
    name: 'Kannur',
    state: 'Kerala',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Kannur_Skyline_3.jpg/500px-Kannur_Skyline_3.jpg',
  },
  {
    slug: 'kottayam',
    name: 'Kottayam',
    state: 'Kerala',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Kottayam_Collage.jpg/500px-Kottayam_Collage.jpg',
  },
  {
    slug: 'belagavi',
    name: 'Belagavi',
    state: 'Karnataka',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Kamal_Basti_view%2C_Belgaum.jpg/500px-Kamal_Basti_view%2C_Belgaum.jpg',
  },
  {
    slug: 'kalaburagi',
    name: 'Kalaburagi',
    state: 'Karnataka',
    image:
      'https://upload.wikimedia.org/wikipedia/en/thumb/1/17/GulbargaPlaces.png/500px-GulbargaPlaces.png',
  },
  {
    slug: 'davanagere',
    name: 'Davanagere',
    state: 'Karnataka',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/HBPA_N_1107_Davanagere_Glass_House.jpg/500px-HBPA_N_1107_Davanagere_Glass_House.jpg',
  },
  {
    slug: 'shivamogga',
    name: 'Shivamogga',
    state: 'Karnataka',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/City_centre_mall_shimoga.jpg/500px-City_centre_mall_shimoga.jpg',
  },
  {
    slug: 'udupi',
    name: 'Udupi',
    state: 'Karnataka',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Udupi_Krishna_Temple.jpg/500px-Udupi_Krishna_Temple.jpg',
  },
  {
    slug: 'solapur',
    name: 'Solapur',
    state: 'Maharashtra',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Solapur_Municipal_Corporation_building%2C_Indra_Bhuvan_credit_Alka_Kshirsagar.jpg/500px-Solapur_Municipal_Corporation_building%2C_Indra_Bhuvan_credit_Alka_Kshirsagar.jpg',
  },
  {
    slug: 'kolhapur',
    name: 'Kolhapur',
    state: 'Maharashtra',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Mahalaxmi_Temple%2C_Kolhapur.jpg/500px-Mahalaxmi_Temple%2C_Kolhapur.jpg',
  },
  {
    slug: 'amravati',
    name: 'Amravati',
    state: 'Maharashtra',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Amravati_Court.jpg/500px-Amravati_Court.jpg',
  },
  {
    slug: 'sangli',
    name: 'Sangli',
    state: 'Maharashtra',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Sangli-ganpati-02.jpg/500px-Sangli-ganpati-02.jpg',
  },
  {
    slug: 'ahmednagar',
    name: 'Ahmednagar',
    state: 'Maharashtra',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Ahmednagarrailwaystation.jpg/500px-Ahmednagarrailwaystation.jpg',
  },
  {
    slug: 'nanded',
    name: 'Nanded',
    state: 'Maharashtra',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Vishnupuri_temple_-_panoramio.jpg/500px-Vishnupuri_temple_-_panoramio.jpg',
  },
  {
    slug: 'bhavnagar',
    name: 'Bhavnagar',
    state: 'Gujarat',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Shri_Swaminarayan_Mandir_gate.jpg/500px-Shri_Swaminarayan_Mandir_gate.jpg',
  },
  {
    slug: 'jamnagar',
    name: 'Jamnagar',
    state: 'Gujarat',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Lakhota_lake_Jamnagar%2C_Golden_hours.jpg/500px-Lakhota_lake_Jamnagar%2C_Golden_hours.jpg',
  },
  {
    slug: 'junagadh',
    name: 'Junagadh',
    state: 'Gujarat',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Dattatreya_Temple_of_Girnar.JPG/500px-Dattatreya_Temple_of_Girnar.JPG',
  },
  {
    slug: 'ajmer',
    name: 'Ajmer',
    state: 'Rajasthan',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/ADHAI_DIN_KA_JHONPRA.jpg/500px-ADHAI_DIN_KA_JHONPRA.jpg',
  },
  {
    slug: 'bikaner',
    name: 'Bikaner',
    state: 'Rajasthan',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/The_Laxmi_Niwas_Palace%2C_Bikaner%2C_Rajasthan.jpg/500px-The_Laxmi_Niwas_Palace%2C_Bikaner%2C_Rajasthan.jpg',
  },
  {
    slug: 'alwar',
    name: 'Alwar',
    state: 'Rajasthan',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Skyline_of_Alwar_City.jpg/500px-Skyline_of_Alwar_City.jpg',
  },
  {
    slug: 'ujjain',
    name: 'Ujjain',
    state: 'Madhya Pradesh',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Mahakaleshwar_Temple%2C_Ujjain.jpg/500px-Mahakaleshwar_Temple%2C_Ujjain.jpg',
  },
  {
    slug: 'sagar',
    name: 'Sagar',
    state: 'Madhya Pradesh',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Lakha_Banjara_Lake_Sagar.png/500px-Lakha_Banjara_Lake_Sagar.png',
  },
  {
    slug: 'rewa',
    name: 'Rewa',
    state: 'Madhya Pradesh',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Vyankat_Bhawan.jpg/500px-Vyankat_Bhawan.jpg',
  },
  {
    slug: 'bareilly',
    name: 'Bareilly',
    state: 'Uttar Pradesh',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Dargah_Aala_Hazrat_2.jpg/500px-Dargah_Aala_Hazrat_2.jpg',
  },
  {
    slug: 'aligarh',
    name: 'Aligarh',
    state: 'Uttar Pradesh',
  },
  {
    slug: 'moradabad',
    name: 'Moradabad',
    state: 'Uttar Pradesh',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/New_Moradabad_Skyline_NH_24.jpg/500px-New_Moradabad_Skyline_NH_24.jpg',
  },
  {
    slug: 'saharanpur',
    name: 'Saharanpur',
    state: 'Uttar Pradesh',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Baba_Bhura_Dev_temple%2C_Shakumbhri_Devi_-_panoramio.jpg/500px-Baba_Bhura_Dev_temple%2C_Shakumbhri_Devi_-_panoramio.jpg',
  },
  {
    slug: 'jhansi',
    name: 'Jhansi',
    state: 'Uttar Pradesh',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Inside_the_Rani_Laxmibai%27s_Jhansi_Fort_in_Jhansi%2C_Uttar_Pradesh_04.jpg/500px-Inside_the_Rani_Laxmibai%27s_Jhansi_Fort_in_Jhansi%2C_Uttar_Pradesh_04.jpg',
  },
  {
    slug: 'mathura',
    name: 'Mathura',
    state: 'Uttar Pradesh',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Vishram_Ghat.jpg/500px-Vishram_Ghat.jpg',
  },
  {
    slug: 'ayodhya',
    name: 'Ayodhya',
    state: 'Uttar Pradesh',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Shri_Ram_Janambhoomi_Mandir%2C_Ayodhya_Dham.jpg/500px-Shri_Ram_Janambhoomi_Mandir%2C_Ayodhya_Dham.jpg',
  },
  {
    slug: 'greater-noida',
    name: 'Greater Noida',
    state: 'Uttar Pradesh',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Greaternoida_expressway_Q2.jpg/500px-Greaternoida_expressway_Q2.jpg',
  },
  {
    slug: 'haldwani',
    name: 'Haldwani',
    state: 'Uttarakhand',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Tikonia_Haldwani_02.jpg/500px-Tikonia_Haldwani_02.jpg',
  },
  {
    slug: 'rishikesh',
    name: 'Rishikesh',
    state: 'Uttarakhand',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Trayambakeshwar_Temple_VK.jpg/500px-Trayambakeshwar_Temple_VK.jpg',
  },
  {
    slug: 'nainital',
    name: 'Nainital',
    state: 'Uttarakhand',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Nainital_metro.jpg/500px-Nainital_metro.jpg',
  },
  {
    slug: 'patiala',
    name: 'Patiala',
    state: 'Punjab',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Qila_Mubarak%2C_Patiala_%28Cropped%29.jpg/500px-Qila_Mubarak%2C_Patiala_%28Cropped%29.jpg',
  },
  {
    slug: 'bathinda',
    name: 'Bathinda',
    state: 'Punjab',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Qila_Mubarak_in_2015%282%29.jpg/500px-Qila_Mubarak_in_2015%282%29.jpg',
  },
  {
    slug: 'mohali',
    name: 'Mohali',
    state: 'Punjab',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/View_of_Chandigarh_International_Airport_road_%2CMohali_in_spring_season_08_%28cropped%29.jpg/500px-View_of_Chandigarh_International_Airport_road_%2CMohali_in_spring_season_08_%28cropped%29.jpg',
  },
  {
    slug: 'ambala',
    name: 'Ambala',
    state: 'Haryana',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Ambala_Cantonment_Railway_Station.jpg/500px-Ambala_Cantonment_Railway_Station.jpg',
  },
  {
    slug: 'karnal',
    name: 'Karnal',
    state: 'Haryana',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Karnal_2.jpg/500px-Karnal_2.jpg',
  },
  {
    slug: 'hisar',
    name: 'Hisar',
    state: 'Haryana',
  },
  {
    slug: 'rohtak',
    name: 'Rohtak',
    state: 'Haryana',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Indian_Institute_of_Management_Rohtak%2C_Academic_Block.jpg/500px-Indian_Institute_of_Management_Rohtak%2C_Academic_Block.jpg',
  },
  {
    slug: 'sonipat',
    name: 'Sonipat',
    state: 'Haryana',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Sonipat_junction.jpg/500px-Sonipat_junction.jpg',
  },
  {
    slug: 'panchkula',
    name: 'Panchkula',
    state: 'Haryana',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Yagya_Shala%2C_within_the_Mansa_Devi_temple_complex%2C_Panchkula_near_Chandigarh.jpg/500px-Yagya_Shala%2C_within_the_Mansa_Devi_temple_complex%2C_Panchkula_near_Chandigarh.jpg',
  },
  {
    slug: 'muzaffarpur',
    name: 'Muzaffarpur',
    state: 'Bihar',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Aerial_view_of_Muzaffarpur.jpg/500px-Aerial_view_of_Muzaffarpur.jpg',
  },
  {
    slug: 'darbhanga',
    name: 'Darbhanga',
    state: 'Bihar',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Darbhanga_1.jpg/500px-Darbhanga_1.jpg',
  },
  {
    slug: 'bokaro',
    name: 'Bokaro',
    state: 'Jharkhand',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Bokaro_Steel_Plant_.jpg/500px-Bokaro_Steel_Plant_.jpg',
  },
  {
    slug: 'deoghar',
    name: 'Deoghar',
    state: 'Jharkhand',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Baba_Baidyanath_Jyotirlinga_Temple.jpg/500px-Baba_Baidyanath_Jyotirlinga_Temple.jpg',
  },
  {
    slug: 'berhampur',
    name: 'Berhampur',
    state: 'Odisha',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Ramalingeswar_%2C_Brahmapur%2C_Odisha.jpg/500px-Ramalingeswar_%2C_Brahmapur%2C_Odisha.jpg',
  },
  {
    slug: 'sambalpur',
    name: 'Sambalpur',
    state: 'Odisha',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Hirakud_Dam.jpg/500px-Hirakud_Dam.jpg',
  },
  {
    slug: 'puri',
    name: 'Puri',
    state: 'Odisha',
  },
  {
    slug: 'asansol',
    name: 'Asansol',
    state: 'West Bengal',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/IMG_asnrlyjn.jpg/500px-IMG_asnrlyjn.jpg',
  },
  {
    slug: 'jorhat',
    name: 'Jorhat',
    state: 'Assam',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Tarun_Ram_Phukan_Road_Jorhat.jpg/500px-Tarun_Ram_Phukan_Road_Jorhat.jpg',
  },
  {
    slug: 'karimnagar',
    name: 'Karimnagar',
    state: 'Telangana',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Teen_minar_Elgandal_fort_Karimnagar.jpg/500px-Teen_minar_Elgandal_fort_Karimnagar.jpg',
  },
  {
    slug: 'durg',
    name: 'Durg',
    state: 'Chhattisgarh',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Rajendra_park%2C_durg.jpg/500px-Rajendra_park%2C_durg.jpg',
  },

  // ── Localities ───────────────────────────────────────────────────────
  // Areas inside a big city that people search by name — "lawyer in Saket",
  // "advocate in Andheri" — often because a district court sits there.
  // `parent` is the city whose lawyers the page lists: nobody registers with
  // Saket as their city, so matching on the locality's own name would leave
  // every one of these pages empty. See `lawyerCityOf`.
  {
    slug: 'saket',
    name: 'Saket',
    state: 'Delhi',
    parent: 'Delhi',
  },
  {
    slug: 'dwarka',
    name: 'Dwarka',
    state: 'Delhi',
    parent: 'Delhi',
  },
  {
    slug: 'rohini',
    name: 'Rohini',
    state: 'Delhi',
    parent: 'Delhi',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Adventure_Island_Entrance...near_Rithala_Metro_Station.png/500px-Adventure_Island_Entrance...near_Rithala_Metro_Station.png',
  },
  {
    slug: 'karkardooma',
    name: 'Karkardooma',
    state: 'Delhi',
    parent: 'Delhi',
  },
  {
    slug: 'connaught-place',
    name: 'Connaught Place',
    state: 'Delhi',
    parent: 'Delhi',
  },
  {
    slug: 'andheri',
    name: 'Andheri',
    state: 'Maharashtra',
    parent: 'Mumbai',
  },
  {
    slug: 'bandra',
    name: 'Bandra',
    state: 'Maharashtra',
    parent: 'Mumbai',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Bandra_Worli_Sea_Link_at_night.jpg/500px-Bandra_Worli_Sea_Link_at_night.jpg',
  },
  {
    slug: 'borivali',
    name: 'Borivali',
    state: 'Maharashtra',
    parent: 'Mumbai',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Skyscrapers_of_Mumbai_viewed_from_%27National_Park%2C_Borivili.jpg/500px-Skyscrapers_of_Mumbai_viewed_from_%27National_Park%2C_Borivili.jpg',
  },
  {
    slug: 'whitefield',
    name: 'Whitefield',
    state: 'Karnataka',
    parent: 'Bengaluru',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Prestige_Shantiniketan_In_Whitefield_Main_Road.jpg/500px-Prestige_Shantiniketan_In_Whitefield_Main_Road.jpg',
  },
  {
    slug: 'koramangala',
    name: 'Koramangala',
    state: 'Karnataka',
    parent: 'Bengaluru',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Koramangala_Junction.JPG/500px-Koramangala_Junction.JPG',
  },
  {
    slug: 'secunderabad',
    name: 'Secunderabad',
    state: 'Telangana',
    parent: 'Hyderabad',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Clock_Tower_Secunderabad.jpg/500px-Clock_Tower_Secunderabad.jpg',
  },
  {
    slug: 'gachibowli',
    name: 'Gachibowli',
    state: 'Telangana',
    parent: 'Hyderabad',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/GachibowliSkyLine.jpg/500px-GachibowliSkyLine.jpg',
  },
  {
    slug: 'anna-nagar',
    name: 'Anna Nagar',
    state: 'Tamil Nadu',
    parent: 'Chennai',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Anna_Nagar_Tower_Park_From_Entrance_20Jan2013.jpg/500px-Anna_Nagar_Tower_Park_From_Entrance_20Jan2013.jpg',
  },
  {
    slug: 'salt-lake',
    name: 'Salt Lake',
    state: 'West Bengal',
    parent: 'Kolkata',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Salt_Lake_City_Sector_V.jpg/500px-Salt_Lake_City_Sector_V.jpg',
  },
  {
    slug: 'shivajinagar-pune',
    name: 'Shivajinagar',
    state: 'Maharashtra',
    parent: 'Pune',
  },
];

/**
 * The city whose lawyers a page should list.
 *
 * A locality (`parent` set) borrows its parent city's lawyers and counts; a
 * city is itself. Every lawyer match and count lookup keyed by a city goes
 * through this, so a locality page is never an empty one.
 *
 * @param {{name:string, parent?:string}} [city]
 * @returns {string}
 */
export function lawyerCityOf(city) {
  return city?.parent || city?.name || '';
}
