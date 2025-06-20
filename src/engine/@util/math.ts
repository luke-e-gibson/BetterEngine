import { vec3 } from "gl-matrix";

export class MathUtils {
  public static degToRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  public static radToDeg(radians: number): number {
    return radians * (180 / Math.PI);
  }

  public static quatToEuler(quat: { x: number; y: number; z: number; w: number }): { x: number; y: number; z: number } {
    // Reference: https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles
    const { x, y, z, w } = quat;

    // roll (x-axis rotation)
    const sinr_cosp = 2 * (w * x + y * z);
    const cosr_cosp = 1 - 2 * (x * x + y * y);
    const roll = Math.atan2(sinr_cosp, cosr_cosp);

    // pitch (y-axis rotation)
    let sinp = 2 * (w * y - z * x);
    let pitch: number;
    if (Math.abs(sinp) >= 1) {
      pitch = Math.sign(sinp) * Math.PI / 2; // use 90 degrees if out of range
    } else {
      pitch = Math.asin(sinp);
    }

    // yaw (z-axis rotation)
    const siny_cosp = 2 * (w * z + x * y);
    const cosy_cosp = 1 - 2 * (y * y + z * z);
    const yaw = Math.atan2(siny_cosp, cosy_cosp);

    return { x: roll, y: pitch, z: yaw };
  }  public static eulerToQuat(euler: vec3): { x: number; y: number; z: number; w: number } {
    // Convert Euler angles (in radians) to quaternion
    // Using ZYX rotation order (yaw, pitch, roll)
    const x = euler[0];
    const y = euler[1];
    const z = euler[2];

    const cy = Math.cos(z * 0.5);
    const sy = Math.sin(z * 0.5);
    const cp = Math.cos(y * 0.5);
    const sp = Math.sin(y * 0.5);
    const cr = Math.cos(x * 0.5);
    const sr = Math.sin(x * 0.5);

    return {
      w: cr * cp * cy + sr * sp * sy,
      x: sr * cp * cy - cr * sp * sy,
      y: cr * sp * cy + sr * cp * sy,
      z: cr * cp * sy - sr * sp * cy
    };
  }
}