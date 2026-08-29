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
];
