// Quaternion math utilities using gl-matrix

import { quat, vec3, mat4 } from 'gl-matrix';

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Converts device orientation (Euler angles) to quaternion
 * @param pitch Rotation around X-axis in radians
 * @param roll Rotation around Y-axis in radians  
 * @param yaw Rotation around Z-axis in radians
 * @returns Quaternion representation
 */
export function deviceOrientationToQuaternion(
  pitch: number,
  roll: number,
  yaw: number
): Quaternion {
  const q = quat.create();
  
  // Create rotation quaternions for each axis
  const pitchQuat = quat.create();
  const rollQuat = quat.create();
  const yawQuat = quat.create();
  
  quat.setAxisAngle(pitchQuat, [1, 0, 0], pitch);
  quat.setAxisAngle(rollQuat, [0, 1, 0], roll);
  quat.setAxisAngle(yawQuat, [0, 0, 1], yaw);
  
  // Combine rotations: yaw * roll * pitch
  quat.multiply(q, rollQuat, pitchQuat);
  quat.multiply(q, yawQuat, q);
  
  return {
    x: q[0],
    y: q[1],
    z: q[2],
    w: q[3]
  };
}

/**
 * Applies quaternion rotation to a 3D vector
 * @param quaternion Quaternion rotation
 * @param vector 3D vector to rotate
 * @returns Rotated 3D vector
 */
export function applyQuaternionToVector(
  quaternion: Quaternion,
  vector: Vector3D
): Vector3D {
  const q = quat.fromValues(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
  const v = vec3.fromValues(vector.x, vector.y, vector.z);
  const result = vec3.create();
  
  vec3.transformQuat(result, v, q);
  
  return {
    x: result[0],
    y: result[1],
    z: result[2]
  };
}

/**
 * Computes the inverse of a quaternion
 * @param quaternion Input quaternion
 * @returns Inverse quaternion
 */
export function invertQuaternion(quaternion: Quaternion): Quaternion {
  const q = quat.fromValues(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
  const inverse = quat.create();
  
  quat.invert(inverse, q);
  
  return {
    x: inverse[0],
    y: inverse[1],
    z: inverse[2],
    w: inverse[3]
  };
}

/**
 * Multiplies two quaternions
 * @param q1 First quaternion
 * @param q2 Second quaternion
 * @returns Product quaternion
 */
export function multiplyQuaternions(q1: Quaternion, q2: Quaternion): Quaternion {
  const quat1 = quat.fromValues(q1.x, q1.y, q1.z, q1.w);
  const quat2 = quat.fromValues(q2.x, q2.y, q2.z, q2.w);
  const result = quat.create();
  
  quat.multiply(result, quat1, quat2);
  
  return {
    x: result[0],
    y: result[1],
    z: result[2],
    w: result[3]
  };
}

/**
 * Normalizes a quaternion to unit length
 * @param quaternion Input quaternion
 * @returns Normalized quaternion
 */
export function normalizeQuaternion(quaternion: Quaternion): Quaternion {
  const q = quat.fromValues(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
  quat.normalize(q, q);
  
  return {
    x: q[0],
    y: q[1],
    z: q[2],
    w: q[3]
  };
}

/**
 * Converts quaternion to Euler angles (for debugging)
 * @param quaternion Input quaternion
 * @returns Object with pitch, roll, yaw in radians
 */
export function quaternionToEuler(quaternion: Quaternion): {
  pitch: number;
  roll: number;
  yaw: number;
} {
  const q = quat.fromValues(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
  
  // Convert quaternion to rotation matrix
  const matrix = mat4.create();
  mat4.fromQuat(matrix, q);
  
  // Extract Euler angles from rotation matrix
  const pitch = Math.asin(-matrix[9]);
  const roll = Math.atan2(matrix[8], matrix[10]);
  const yaw = Math.atan2(matrix[4], matrix[0]);
  
  return { pitch, roll, yaw };
}

/**
 * Creates a quaternion from axis-angle representation
 * @param axis Rotation axis (unit vector)
 * @param angle Rotation angle in radians
 * @returns Quaternion
 */
export function axisAngleToQuaternion(axis: Vector3D, angle: number): Quaternion {
  const q = quat.create();
  quat.setAxisAngle(q, [axis.x, axis.y, axis.z], angle);
  
  return {
    x: q[0],
    y: q[1],
    z: q[2],
    w: q[3]
  };
}

/**
 * Spherical linear interpolation between two quaternions
 * @param q1 Start quaternion
 * @param q2 End quaternion
 * @param t Interpolation factor (0-1)
 * @returns Interpolated quaternion
 */
export function slerpQuaternions(q1: Quaternion, q2: Quaternion, t: number): Quaternion {
  const quat1 = quat.fromValues(q1.x, q1.y, q1.z, q1.w);
  const quat2 = quat.fromValues(q2.x, q2.y, q2.z, q2.w);
  const result = quat.create();
  
  quat.slerp(result, quat1, quat2, t);
  
  return {
    x: result[0],
    y: result[1],
    z: result[2],
    w: result[3]
  };
}
