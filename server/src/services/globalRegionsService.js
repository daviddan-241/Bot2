export const REGION_PRESETS = {
  north_america_europe: {
    label: 'North America + Europe',
    locations: [
      'New York, United States', 'Los Angeles, United States', 'Chicago, United States', 'Houston, United States', 'Miami, United States', 'San Francisco, United States', 'Seattle, United States', 'Boston, United States', 'Atlanta, United States', 'Dallas, United States',
      'Toronto, Canada', 'Vancouver, Canada', 'Montreal, Canada', 'Mexico City, Mexico',
      'London, United Kingdom', 'Manchester, United Kingdom', 'Dublin, Ireland', 'Paris, France', 'Lyon, France', 'Berlin, Germany', 'Munich, Germany', 'Hamburg, Germany', 'Amsterdam, Netherlands', 'Madrid, Spain', 'Barcelona, Spain', 'Rome, Italy', 'Milan, Italy', 'Stockholm, Sweden', 'Copenhagen, Denmark', 'Oslo, Norway', 'Zurich, Switzerland', 'Vienna, Austria', 'Warsaw, Poland', 'Lisbon, Portugal'
    ]
  },
  north_america: {
    label: 'North America',
    locations: [
      'New York, United States', 'Los Angeles, United States', 'Chicago, United States', 'Houston, United States', 'Phoenix, United States', 'Philadelphia, United States', 'San Antonio, United States', 'San Diego, United States', 'Dallas, United States', 'San Jose, United States', 'Austin, United States', 'Jacksonville, United States', 'Fort Worth, United States', 'Columbus, United States', 'Charlotte, United States', 'San Francisco, United States', 'Indianapolis, United States', 'Seattle, United States', 'Denver, United States', 'Washington DC, United States', 'Boston, United States', 'Nashville, United States', 'Atlanta, United States', 'Miami, United States',
      'Toronto, Canada', 'Montreal, Canada', 'Vancouver, Canada', 'Calgary, Canada', 'Ottawa, Canada', 'Edmonton, Canada', 'Winnipeg, Canada',
      'Mexico City, Mexico', 'Guadalajara, Mexico', 'Monterrey, Mexico', 'Tijuana, Mexico'
    ]
  },
  europe: {
    label: 'Europe',
    locations: [
      'London, United Kingdom', 'Manchester, United Kingdom', 'Birmingham, United Kingdom', 'Edinburgh, United Kingdom', 'Dublin, Ireland',
      'Paris, France', 'Marseille, France', 'Lyon, France', 'Berlin, Germany', 'Munich, Germany', 'Hamburg, Germany', 'Frankfurt, Germany',
      'Madrid, Spain', 'Barcelona, Spain', 'Valencia, Spain', 'Rome, Italy', 'Milan, Italy', 'Naples, Italy',
      'Amsterdam, Netherlands', 'Rotterdam, Netherlands', 'Brussels, Belgium', 'Antwerp, Belgium',
      'Stockholm, Sweden', 'Gothenburg, Sweden', 'Copenhagen, Denmark', 'Oslo, Norway', 'Helsinki, Finland',
      'Zurich, Switzerland', 'Geneva, Switzerland', 'Vienna, Austria', 'Warsaw, Poland', 'Krakow, Poland', 'Prague, Czechia',
      'Lisbon, Portugal', 'Porto, Portugal', 'Athens, Greece', 'Budapest, Hungary', 'Bucharest, Romania'
    ]
  },
  latin_america: {
    label: 'Latin America',
    locations: [
      'São Paulo, Brazil', 'Rio de Janeiro, Brazil', 'Brasília, Brazil', 'Salvador, Brazil', 'Buenos Aires, Argentina', 'Córdoba, Argentina', 'Santiago, Chile', 'Bogotá, Colombia', 'Medellín, Colombia', 'Lima, Peru', 'Quito, Ecuador', 'Guayaquil, Ecuador', 'Montevideo, Uruguay', 'Asunción, Paraguay', 'La Paz, Bolivia', 'Panama City, Panama', 'San José, Costa Rica', 'Santo Domingo, Dominican Republic', 'San Juan, Puerto Rico'
    ]
  },
  africa: {
    label: 'Africa',
    locations: [
      'Lagos, Nigeria', 'Abuja, Nigeria', 'Port Harcourt, Nigeria', 'Accra, Ghana', 'Kumasi, Ghana', 'Nairobi, Kenya', 'Mombasa, Kenya', 'Kampala, Uganda', 'Kigali, Rwanda', 'Addis Ababa, Ethiopia', 'Cairo, Egypt', 'Alexandria, Egypt', 'Casablanca, Morocco', 'Rabat, Morocco', 'Johannesburg, South Africa', 'Cape Town, South Africa', 'Durban, South Africa', 'Pretoria, South Africa', 'Dakar, Senegal', 'Abidjan, Côte d’Ivoire', 'Tunis, Tunisia'
    ]
  },
  middle_east: {
    label: 'Middle East',
    locations: [
      'Dubai, United Arab Emirates', 'Abu Dhabi, United Arab Emirates', 'Doha, Qatar', 'Riyadh, Saudi Arabia', 'Jeddah, Saudi Arabia', 'Kuwait City, Kuwait', 'Manama, Bahrain', 'Muscat, Oman', 'Amman, Jordan', 'Tel Aviv, Israel', 'Istanbul, Türkiye', 'Ankara, Türkiye'
    ]
  },
  asia_pacific: {
    label: 'Asia Pacific',
    locations: [
      'Singapore', 'Hong Kong', 'Tokyo, Japan', 'Osaka, Japan', 'Seoul, South Korea', 'Taipei, Taiwan', 'Bangkok, Thailand', 'Chiang Mai, Thailand', 'Kuala Lumpur, Malaysia', 'Jakarta, Indonesia', 'Surabaya, Indonesia', 'Manila, Philippines', 'Cebu, Philippines', 'Ho Chi Minh City, Vietnam', 'Hanoi, Vietnam', 'Mumbai, India', 'Delhi, India', 'Bengaluru, India', 'Hyderabad, India', 'Chennai, India', 'Pune, India', 'Shanghai, China', 'Shenzhen, China'
    ]
  },
  oceania: {
    label: 'Oceania',
    locations: [
      'Sydney, Australia', 'Melbourne, Australia', 'Brisbane, Australia', 'Perth, Australia', 'Adelaide, Australia', 'Canberra, Australia', 'Auckland, New Zealand', 'Wellington, New Zealand', 'Christchurch, New Zealand'
    ]
  }
};

export function listRegionPresets() {
  return Object.entries(REGION_PRESETS).map(([id, value]) => ({ id, label: value.label, count: value.locations.length, locations: value.locations }));
}

export function expandTargetLocations({ region = '', regions = [], location = '', locations = [] } = {}) {
  const selected = [];
  const add = (value) => {
    if (!value) return;
    if (Array.isArray(value)) return value.forEach(add);
    String(value).split('\n').flatMap((line) => line.split(';')).flatMap((line) => line.split('|')).forEach((part) => {
      const cleaned = part.trim();
      if (cleaned) selected.push(cleaned);
    });
  };

  const regionIds = [...new Set([region, ...(Array.isArray(regions) ? regions : String(regions || '').split(','))].filter(Boolean))];
  for (const id of regionIds) {
    if (id === 'global') Object.values(REGION_PRESETS).forEach((preset) => add(preset.locations));
    else if (REGION_PRESETS[id]) add(REGION_PRESETS[id].locations);
  }
  add(location);
  add(locations);

  const seen = new Set();
  return selected.filter((value) => {
    const key = value.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
