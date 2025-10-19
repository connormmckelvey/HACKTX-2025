// 3D projection utilities for perspective projection and frustum culling

export interface ScreenPoint {
  x: number;
  y: number;
  z: number; // Depth for z-buffering
}

export interface CameraSpacePoint {
  x: number;
  y: number;
  z: number;
}

/**
 * Checks if a point in camera space is within the viewing frustum
 * @param point Point in camera space
 * @param fovDegrees Field of view in degrees
 * @param nearClip Near clipping plane distance
 * @param farClip Far clipping plane distance
 * @returns true if point is visible
 */
export function isInFrustum(
  point: CameraSpacePoint,
  fovDegrees: number = 60,
  nearClip: number = 0.1,
  farClip: number = 1000
): boolean {
  const { x, y, z } = point;
  
  // Check if point is behind camera
  if (z >= 0) return false;
  
  // Check if point is within near/far clipping planes
  if (z > -nearClip || z < -farClip) return false;
  
  // Calculate frustum boundaries
  const fovRad = (fovDegrees * Math.PI) / 180;
  const halfFov = fovRad / 2;
  
  // Calculate the distance from camera to the point
  const distance = Math.abs(z);
  
  // Calculate the frustum width and height at this distance
  const frustumHeight = 2 * distance * Math.tan(halfFov);
  const frustumWidth = frustumHeight; // Assuming square aspect ratio
  
  // Check if point is within horizontal and vertical bounds
  const maxX = frustumWidth / 2;
  const maxY = frustumHeight / 2;
  
  return Math.abs(x) <= maxX && Math.abs(y) <= maxY;
}

/**
 * Projects a 3D point in camera space to 2D screen coordinates
 * @param point Point in camera space
 * @param screenWidth Screen width in pixels
 * @param screenHeight Screen height in pixels
 * @param fovDegrees Field of view in degrees
 * @returns Screen coordinates with depth
 */
export function projectToScreen(
  point: CameraSpacePoint,
  screenWidth: number,
  screenHeight: number,
  fovDegrees: number = 60
): ScreenPoint {
  const { x, y, z } = point;
  
  // Calculate focal length from field of view
  const fovRad = (fovDegrees * Math.PI) / 180;
  const focalLength = screenHeight / (2 * Math.tan(fovRad / 2));
  
  // Perform perspective projection
  // Note: z is negative in camera space, so we use -z for depth
  const projectedX = (x / -z) * focalLength + screenWidth / 2;
  const projectedY = (y / -z) * focalLength + screenHeight / 2;
  const depth = -z; // Store positive depth for z-buffering
  
  return {
    x: projectedX,
    y: projectedY,
    z: depth
  };
}

/**
 * Unprojects a 2D screen point back to 3D camera space at a given depth
 * @param screenPoint Screen coordinates
 * @param depth Depth in camera space (positive value)
 * @param screenWidth Screen width in pixels
 * @param screenHeight Screen height in pixels
 * @param fovDegrees Field of view in degrees
 * @returns Point in camera space
 */
export function unprojectFromScreen(
  screenPoint: ScreenPoint,
  depth: number,
  screenWidth: number,
  screenHeight: number,
  fovDegrees: number = 60
): CameraSpacePoint {
  const fovRad = (fovDegrees * Math.PI) / 180;
  const focalLength = screenHeight / (2 * Math.tan(fovRad / 2));
  
  // Convert screen coordinates to normalized device coordinates
  const ndcX = (screenPoint.x - screenWidth / 2) / focalLength;
  const ndcY = (screenPoint.y - screenHeight / 2) / focalLength;
  
  // Unproject to camera space
  const cameraX = ndcX * depth;
  const cameraY = ndcY * depth;
  const cameraZ = -depth; // Negative z in camera space
  
  return {
    x: cameraX,
    y: cameraY,
    z: cameraZ
  };
}

/**
 * Calculates the distance from camera to a point in camera space
 * @param point Point in camera space
 * @returns Distance from camera
 */
export function distanceFromCamera(point: CameraSpacePoint): number {
  return Math.sqrt(point.x * point.x + point.y * point.y + point.z * point.z);
}

/**
 * Calculates the angular distance between two points in camera space
 * @param point1 First point
 * @param point2 Second point
 * @returns Angular distance in radians
 */
export function angularDistanceBetweenPoints(
  point1: CameraSpacePoint,
  point2: CameraSpacePoint
): number {
  const dot = point1.x * point2.x + point1.y * point2.y + point1.z * point2.z;
  const mag1 = Math.sqrt(point1.x * point1.x + point1.y * point1.y + point1.z * point1.z);
  const mag2 = Math.sqrt(point2.x * point2.x + point2.y * point2.y + point2.z * point2.z);
  
  const cosAngle = dot / (mag1 * mag2);
  return Math.acos(Math.max(-1, Math.min(1, cosAngle)));
}

/**
 * Checks if a point is within a circular field of view
 * @param point Point in camera space
 * @param fovDegrees Field of view in degrees
 * @returns true if point is within circular FOV
 */
export function isInCircularFrustum(
  point: CameraSpacePoint,
  fovDegrees: number = 60
): boolean {
  const { x, y, z } = point;
  
  // Check if point is behind camera
  if (z >= 0) return false;
  
  // Calculate angular distance from center
  const distance = Math.sqrt(x * x + y * y + z * z);
  const angle = Math.acos(-z / distance); // -z because z is negative
  
  const halfFovRad = (fovDegrees * Math.PI) / 360;
  
  return angle <= halfFovRad;
}

/**
 * Calculates the screen space bounding box for a 3D point
 * @param point Point in camera space
 * @param screenWidth Screen width in pixels
 * @param screenHeight Screen height in pixels
 * @param fovDegrees Field of view in degrees
 * @param pointSize Size of the point in pixels
 * @returns Bounding box in screen coordinates
 */
export function getScreenBoundingBox(
  point: CameraSpacePoint,
  screenWidth: number,
  screenHeight: number,
  fovDegrees: number = 60,
  pointSize: number = 2
): {
  left: number;
  right: number;
  top: number;
  bottom: number;
} {
  const projected = projectToScreen(point, screenWidth, screenHeight, fovDegrees);
  const halfSize = pointSize / 2;
  
  return {
    left: projected.x - halfSize,
    right: projected.x + halfSize,
    top: projected.y - halfSize,
    bottom: projected.y + halfSize
  };
}
