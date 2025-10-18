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
const CONSTELLATIONS = [
  {
    id: 1,
    name: "The Great Coyote",
    stars: [
      { ra: 6.5, dec: 45.2, name: "Coyote Alpha" },
      { ra: 6.8, dec: 46.1, name: "Coyote Beta" },
      { ra: 7.2, dec: 45.8, name: "Coyote Gamma" },
      { ra: 7.0, dec: 45.5, name: "Coyote Delta" }
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 0]]
  },
  {
    id: 2,
    name: "The Buffalo Spirit",
    stars: [
      { ra: 14.2, dec: 32.1, name: "Buffalo Alpha" },
      { ra: 14.8, dec: 33.5, name: "Buffalo Beta" },
      { ra: 15.1, dec: 32.8, name: "Buffalo Gamma" },
      { ra: 14.5, dec: 32.9, name: "Buffalo Delta" },
      { ra: 14.9, dec: 32.3, name: "Buffalo Epsilon" }
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]]
  },
  {
    id: 3,
    name: "The Eagle's Flight",
    stars: [
      { ra: 19.8, dec: 8.9, name: "Eagle Alpha" },
      { ra: 20.2, dec: 9.8, name: "Eagle Beta" },
      { ra: 20.5, dec: 9.2, name: "Eagle Gamma" },
      { ra: 20.0, dec: 9.5, name: "Eagle Delta" }
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 0]]
  },
  {
    id: 4,
    name: "The Deer Star",
    stars: [
      { ra: 4.5, dec: 16.5, name: "Deer Alpha" },
      { ra: 4.9, dec: 17.2, name: "Deer Beta" },
      { ra: 5.2, dec: 16.8, name: "Deer Gamma" }
    ],
    lines: [[0, 1], [1, 2], [2, 0]]
  },
  {
    id: 5,
    name: "The Moon's Path",
    stars: [
      { ra: 2.1, dec: 89.3, name: "Moon Alpha" },
      { ra: 2.5, dec: 88.8, name: "Moon Beta" },
      { ra: 2.9, dec: 89.1, name: "Moon Gamma" },
      { ra: 2.3, dec: 89.5, name: "Moon Delta" }
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 0]]
  }
];
