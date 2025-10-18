// Astronomical calculations for star positions
export class AstronomyCalculator {
  // Convert degrees to radians
  static degToRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Convert radians to degrees
  static radToDeg(radians) {
    return radians * (180 / Math.PI);
  }

  // Calculate Julian Date
  static getJulianDate(date = new Date()) {
    const a = Math.floor((14 - (date.getMonth() + 1)) / 12);
    const y = date.getFullYear() + 4800 - a;
    const m = (date.getMonth() + 1) + 12 * a - 3;

    return date.getDate() + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045 + (date.getHours() - 12) / 24 + date.getMinutes() / 1440 + date.getSeconds() / 86400;
  }

  // Calculate Greenwich Mean Sidereal Time
  static getGMST(jd) {
    const T = (jd - 2451545.0) / 36525;
    let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.0003875 * T * T - 0.000000025 * T * T * T;
    gmst = gmst % 360;
    if (gmst < 0) gmst += 360;
    return gmst;
  }

  // Calculate Local Sidereal Time
  static getLST(jd, longitude) {
    const gmst = this.getGMST(jd);
    const lst = gmst + longitude;
    return lst % 360;
  }

  // Convert equatorial coordinates to horizontal coordinates
  static equatorialToHorizontal(ra, dec, lat, lst) {
    const raRad = this.degToRad(ra * 15); // RA in degrees (hours * 15)
    const decRad = this.degToRad(dec);
    const latRad = this.degToRad(lat);
    const lstRad = this.degToRad(lst);

    const hourAngle = lstRad - raRad;

    const sinAlt = Math.sin(decRad) * Math.sin(latRad) + Math.cos(decRad) * Math.cos(latRad) * Math.cos(hourAngle);
    const alt = Math.asin(sinAlt);

    const cosAz = (Math.sin(decRad) - Math.sin(alt) * Math.sin(latRad)) / (Math.cos(alt) * Math.cos(latRad));
    const az = Math.acos(cosAz);

    let azimuth = this.radToDeg(az);
    if (Math.sin(hourAngle) > 0) {
      azimuth = 360 - azimuth;
    }

    return {
      altitude: this.radToDeg(alt),
      azimuth: azimuth
    };
  }

  // Calculate constellation positions for current location and time
  static calculateStarPositions(location, date = new Date()) {
    if (!location) return [];

    const jd = this.getJulianDate(date);
    const lst = this.getLST(jd, location.coords.longitude);

    return CONSTELLATIONS.map(constellation => {
      // Calculate position for each star in the constellation
      const starsWithPositions = constellation.stars.map(star => {
        const position = this.equatorialToHorizontal(
          star.ra,
          star.dec,
          location.coords.latitude,
          lst
        );

        return {
          ...star,
          horizontalPosition: position,
          visible: true // Enable daytime viewing - stars are always "visible" in the overlay
        };
      });

      // Use the first visible star as reference for constellation position
      const referenceStar = starsWithPositions.find(star => star.visible) || starsWithPositions[0];

      return {
        ...constellation,
        stars: starsWithPositions,
        horizontalPosition: referenceStar?.horizontalPosition || { altitude: 0, azimuth: 0 },
        visible: true // Enable daytime viewing for constellations
      };
    });
  }

  // Calculate which stars should be visible based on compass heading
  static getVisibleStars(starPositions, heading, fieldOfView = 60) {
    return starPositions.filter(star => {
      if (!star.visible) return false;

      // Calculate angular distance from center of view
      const angularDistance = Math.abs(star.horizontalPosition.azimuth - heading);

      // Account for wraparound (0-360 degrees)
      const minDistance = Math.min(angularDistance, 360 - angularDistance);

      return minDistance <= fieldOfView / 2;
    });
  }
}

// Real constellation data with astronomical coordinates (RA in hours, Dec in degrees)
// Based on major constellations visible from Central Texas (30°N latitude)
const CONSTELLATIONS = [
  {
    id: 1,
    name: "The Great Coyote",
    story: "In the time before time, when the world was still forming, Great Coyote wandered the vast plains of Central Texas. He was the clever trickster who brought fire to the people and taught them to hunt wisely. The stars mark his path across the night sky as he chases the moon, forever reminding us of his cunning nature and the delicate balance between mischief and wisdom. The Tonkawa people tell how Coyote's howls can still be heard in the wind, guiding hunters and warning of danger.",
    artwork: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 30 Q30 25 40 30 Q50 35 60 30 Q70 25 80 30" stroke="#FFD700" stroke-width="2" fill="none"/>
      <circle cx="20" cy="30" r="3" fill="#FFD700"/>
      <circle cx="40" cy="30" r="3" fill="#FFD700"/>
      <circle cx="60" cy="30" r="3" fill="#FFD700"/>
      <circle cx="80" cy="30" r="3" fill="#FFD700"/>
      <path d="M30 35 L35 45 M50 35 L55 45" stroke="#FFD700" stroke-width="1.5"/>
    </svg>`,
    stars: [
      // Using real stars: Dubhe, Merak, Phecda, Megrez (The Big Dipper)
      { ra: 11.062, dec: 61.75, name: "Dubhe" },
      { ra: 11.031, dec: 56.38, name: "Merak" },
      { ra: 11.897, dec: 53.69, name: "Phecda" },
      { ra: 12.257, dec: 57.03, name: "Megrez" },
      { ra: 13.792, dec: 49.31, name: "Alioth" },
      { ra: 14.275, dec: 54.00, name: "Mizar" },
      { ra: 13.398, dec: 54.92, name: "Alkaid" }
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]]
  },
  {
    id: 2,
    name: "The Buffalo Spirit",
    story: "The mighty buffalo once roamed freely across the Texas plains, providing sustenance and spiritual guidance to the Comanche people. This constellation shows Tatanka, the Buffalo Spirit, charging across the celestial plains. The Comanche believe that when buffalo appear in the night sky, it is a sign of abundance and that the herds will be plentiful. The constellation's path mirrors the ancient buffalo trails that crisscrossed the land, reminding us of the sacred connection between the people and these majestic creatures who gave their lives so that others might live.",
    artwork: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 40 Q25 35 35 40 Q45 45 55 40 Q65 35 75 40 L80 45 L75 55 L20 55 Z" stroke="#FFD700" stroke-width="2" fill="none"/>
      <circle cx="25" cy="45" r="2" fill="#FFD700"/>
      <circle cx="45" cy="50" r="2" fill="#FFD700"/>
      <circle cx="65" cy="45" r="2" fill="#FFD700"/>
      <path d="M70 35 L75 25 M75 35 L80 25" stroke="#FFD700" stroke-width="1.5"/>
    </svg>`,
    stars: [
      // Cassiopeia - The Queen
      { ra: 0.675, dec: 56.54, name: "Shedar" },
      { ra: 0.947, dec: 60.72, name: "Caph" },
      { ra: 1.417, dec: 63.67, name: "Gamma Cassiopeiae" },
      { ra: 2.292, dec: 63.07, name: "Ruchbah" },
      { ra: 3.367, dec: 59.15, name: "Segin" }
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4]]
  },
  {
    id: 3,
    name: "The Eagle's Flight",
    story: "Soaring high above the Edwards Plateau, the eagle was revered by both Tonkawa and Comanche peoples as a messenger between the earth and the spirit world. This constellation traces the eagle's powerful wings as it circles in the night sky, watching over the land and its people. The eagle teaches us about vision, courage, and the importance of seeing the bigger picture. When eagles appear in dreams or in the stars, they bring messages from ancestors and remind us to honor the sacred connection between all living things.",
    artwork: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 20 L30 40 L35 45 L45 35 L55 35 L65 45 L70 40 Z" stroke="#FFD700" stroke-width="2" fill="none"/>
      <circle cx="30" cy="40" r="3" fill="#FFD700"/>
      <circle cx="45" cy="35" r="3" fill="#FFD700"/>
      <circle cx="55" cy="35" r="3" fill="#FFD700"/>
      <circle cx="70" cy="40" r="3" fill="#FFD700"/>
      <path d="M40 25 Q50 15 60 25" stroke="#FFD700" stroke-width="1.5"/>
    </svg>`,
    stars: [
      // Altair, Tarazed, Alshain (Aquila - The Eagle)
      { ra: 19.846, dec: 8.87, name: "Altair" },
      { ra: 20.670, dec: 10.61, name: "Tarazed" },
      { ra: 19.846, dec: 6.43, name: "Alshain" },
      { ra: 19.078, dec: 10.96, name: "Deneb el Okab" }
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 0]]
  },
  {
    id: 4,
    name: "The Deer Star",
    story: "The white-tailed deer has always been a vital part of life in Central Texas, providing food, clothing, and tools for the indigenous peoples. This constellation shows the Deer Spirit leaping gracefully through the night sky, her path marking the changing seasons. The Tonkawa and Comanche peoples honored the deer for her gentleness and keen awareness, teaching lessons about living in harmony with nature. When this constellation is visible, it reminds hunters to approach their sacred duty with respect and gratitude for the life that will be given.",
    artwork: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M25 60 Q35 55 45 60 L50 50 L55 60 Q65 55 75 60 L80 65 L75 75 L25 75 Z" stroke="#FFD700" stroke-width="2" fill="none"/>
      <circle cx="35" cy="60" r="2" fill="#FFD700"/>
      <circle cx="50" cy="50" r="2" fill="#FFD700"/>
      <circle cx="65" cy="60" r="2" fill="#FFD700"/>
      <path d="M40 45 L50 35 L60 45" stroke="#FFD700" stroke-width="1.5"/>
    </svg>`,
    stars: [
      // Rigel, Bellatrix, Mintaka, Alnilam, Alnitak, Saiph (Orion)
      { ra: 5.242, dec: -8.20, name: "Rigel" },
      { ra: 5.419, dec: 6.35, name: "Bellatrix" },
      { ra: 5.533, dec: -0.30, name: "Mintaka" },
      { ra: 5.603, dec: -1.20, name: "Alnilam" },
      { ra: 5.679, dec: -1.94, name: "Alnitak" },
      { ra: 5.795, dec: -9.67, name: "Saiph" },
      { ra: 5.588, dec: 7.41, name: "Betelgeuse" }
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [6, 1], [6, 3]]
  },
  {
    id: 5,
    name: "The Moon's Path",
    story: "The moon holds special significance in the spiritual life of the Tonkawa and Comanche peoples, marking time and guiding ceremonies. This constellation traces the Moon Spirit's journey across the night sky, weaving together stories of creation, renewal, and the cyclical nature of life. The moon teaches about patience, reflection, and the importance of honoring the feminine wisdom that guides all living things. When the full moon rises, it illuminates the ancestral paths and reminds us that we are all connected in the great circle of existence.",
    artwork: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 25 Q30 35 25 50 Q30 65 50 75 Q70 65 75 50 Q70 35 50 25" stroke="#FFD700" stroke-width="2" fill="none"/>
      <circle cx="25" cy="50" r="3" fill="#FFD700"/>
      <circle cx="50" cy="25" r="3" fill="#FFD700"/>
      <circle cx="75" cy="50" r="3" fill="#FFD700"/>
      <circle cx="50" cy="75" r="3" fill="#FFD700"/>
      <path d="M35 40 Q50 30 65 40" stroke="#FFD700" stroke-width="1"/>
    </svg>`,
    stars: [
      // Polaris, Kochab, Pherkad (Ursa Minor)
      { ra: 2.530, dec: 89.26, name: "Polaris" },
      { ra: 14.845, dec: 74.16, name: "Kochab" },
      { ra: 15.346, dec: 71.83, name: "Pherkad" },
      { ra: 17.537, dec: 86.59, name: "Yildun" }
    ],
    lines: [[0, 1], [1, 2], [2, 3]]
  },
  {
    id: 6,
    name: "The Seven Sisters",
    story: "The Pleiades, known as the Seven Sisters, hold a special place in the stories of many indigenous peoples across North America. These stars represent seven sisters who fled from danger and were placed in the sky by the Creator. The Tonkawa and Comanche tell how the sisters watch over travelers and hunters, their light guiding the way through dark nights. When the Pleiades are visible, it marks important times for ceremonies and storytelling, reminding us that even in darkness, there is always light and guidance from those who came before us.",
    artwork: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="35" cy="40" r="2" fill="#FFD700"/>
      <circle cx="45" cy="35" r="2" fill="#FFD700"/>
      <circle cx="55" cy="40" r="2" fill="#FFD700"/>
      <circle cx="50" cy="45" r="2" fill="#FFD700"/>
      <circle cx="40" cy="50" r="2" fill="#FFD700"/>
      <circle cx="60" cy="50" r="2" fill="#FFD700"/>
      <circle cx="50" cy="55" r="2" fill="#FFD700"/>
      <path d="M35 40 L55 40 M45 35 L50 45 M40 50 L60 50 M50 55 L50 35" stroke="#FFD700" stroke-width="1"/>
    </svg>`,
    stars: [
      // Pleiades cluster
      { ra: 3.763, dec: 24.12, name: "Alcyone" },
      { ra: 3.773, dec: 24.14, name: "Atlas" },
      { ra: 3.783, dec: 24.15, name: "Electra" },
      { ra: 3.793, dec: 24.16, name: "Maia" },
      { ra: 3.803, dec: 24.17, name: "Merope" },
      { ra: 3.813, dec: 24.18, name: "Taygeta" },
      { ra: 3.823, dec: 24.19, name: "Pleione" },
      { ra: 3.833, dec: 24.20, name: "Celaeno" }
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7]]
  },
  {
    id: 7,
    name: "The Hunter's Bow",
    story: "The great hunter of the Comanche and Tonkawa peoples is represented by this constellation, showing his mighty bow drawn back, ready to release an arrow toward the buffalo herds. This constellation teaches about focus, patience, and the responsibility of the hunt. The hunter's bow reminds us that every action has consequences and that we must respect the balance of nature. When this constellation rises, hunters would prepare for the next day's work, asking for guidance and a successful hunt that would feed their families.",
    artwork: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 50 Q30 45 40 50 Q50 55 60 50 Q70 45 80 50" stroke="#FFD700" stroke-width="2" fill="none"/>
      <circle cx="30" cy="50" r="2" fill="#FFD700"/>
      <circle cx="50" cy="52" r="2" fill="#FFD700"/>
      <circle cx="70" cy="48" r="2" fill="#FFD700"/>
      <path d="M25 45 L35 55 M45 47 L55 57 M65 43 L75 53" stroke="#FFD700" stroke-width="1"/>
    </svg>`,
    stars: [
      // Arcturus, Spica, Regulus (Spring Triangle)
      { ra: 14.261, dec: 19.18, name: "Arcturus" },
      { ra: 13.420, dec: -11.16, name: "Spica" },
      { ra: 10.139, dec: 11.97, name: "Regulus" },
      { ra: 11.897, dec: 53.69, name: "Denebola" }
    ],
    lines: [[0, 1], [1, 2], [2, 3]]
  }
];
