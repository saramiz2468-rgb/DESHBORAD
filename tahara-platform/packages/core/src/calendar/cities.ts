/**
 * Cities for sunrise/sunset. The user picks a city; precise GPS location is
 * never requested. Coordinates are city centres (WGS84).
 */
export interface City {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export const CITIES: readonly City[] = [
  { id: 'jerusalem', name: 'ירושלים', lat: 31.7683, lng: 35.2137 },
  { id: 'tel-aviv', name: 'תל אביב–יפו', lat: 32.0853, lng: 34.7818 },
  { id: 'haifa', name: 'חיפה', lat: 32.794, lng: 34.9896 },
  { id: 'bnei-brak', name: 'בני ברק', lat: 32.0807, lng: 34.8338 },
  { id: 'petah-tikva', name: 'פתח תקווה', lat: 32.0871, lng: 34.8875 },
  { id: 'rishon', name: 'ראשון לציון', lat: 31.973, lng: 34.7925 },
  { id: 'rehovot', name: 'רחובות', lat: 31.8928, lng: 34.8113 },
  { id: 'ashdod', name: 'אשדוד', lat: 31.8014, lng: 34.6435 },
  { id: 'ashkelon', name: 'אשקלון', lat: 31.6688, lng: 34.5743 },
  { id: 'netanya', name: 'נתניה', lat: 32.3215, lng: 34.8532 },
  { id: 'hadera', name: 'חדרה', lat: 32.434, lng: 34.9196 },
  { id: 'raanana', name: 'רעננה', lat: 32.1848, lng: 34.8713 },
  { id: 'modiin', name: 'מודיעין', lat: 31.8969, lng: 35.0104 },
  { id: 'modiin-illit', name: 'מודיעין עילית', lat: 31.932, lng: 35.043 },
  { id: 'elad', name: 'אלעד', lat: 32.0522, lng: 34.951 },
  { id: 'beit-shemesh', name: 'בית שמש', lat: 31.747, lng: 34.9881 },
  { id: 'beitar-illit', name: 'ביתר עילית', lat: 31.6967, lng: 35.115 },
  { id: 'efrat', name: 'אפרת', lat: 31.653, lng: 35.15 },
  { id: 'maale-adumim', name: 'מעלה אדומים', lat: 31.777, lng: 35.298 },
  { id: 'ariel', name: 'אריאל', lat: 32.105, lng: 35.188 },
  { id: 'kiryat-arba', name: 'קריית ארבע', lat: 31.531, lng: 35.122 },
  { id: 'beer-sheva', name: 'באר שבע', lat: 31.2518, lng: 34.7913 },
  { id: 'arad', name: 'ערד', lat: 31.2589, lng: 35.2128 },
  { id: 'eilat', name: 'אילת', lat: 29.5577, lng: 34.9519 },
  { id: 'tiberias', name: 'טבריה', lat: 32.7959, lng: 35.531 },
  { id: 'safed', name: 'צפת', lat: 32.9646, lng: 35.496 },
  { id: 'karmiel', name: 'כרמיאל', lat: 32.919, lng: 35.295 },
  { id: 'nahariya', name: 'נהריה', lat: 33.0058, lng: 35.0941 },
  { id: 'afula', name: 'עפולה', lat: 32.6078, lng: 35.2897 },
  { id: 'kiryat-shmona', name: 'קריית שמונה', lat: 33.2073, lng: 35.57 },
];

export const DEFAULT_CITY_ID = 'jerusalem';

export function cityById(id: string | undefined): City {
  return CITIES.find((c) => c.id === id) ?? CITIES[0]!;
}
