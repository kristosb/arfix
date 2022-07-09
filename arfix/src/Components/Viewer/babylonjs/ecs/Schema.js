
import "@javelin/core"
import { registerSchema, number, string, boolean } from "@javelin/ecs"
//import { float64, string16 } from "@javelin/pack"

export const Position = { x: number, y: number, z: number };
export const Rotation = { x: number, y: number, z: number, w: number };
export const Body = { position: Position, quaternion: Rotation };
export const Mesh = { position: Position, quaternion: Rotation };
export const SunPosition = { x: number, y: number, z: number };
export const ToggleKey = {name: string, trigger: boolean, hold: boolean};
export const Id = {name: string};
export const Sun = {inclination: number};//{ position: Position, direction: Position, sunIntensity: number, ambientIntensity: number };
registerSchema(Position, 1);
registerSchema(Rotation, 2);
registerSchema(Body, 3);
registerSchema(Mesh, 4);
registerSchema(SunPosition, 5);
registerSchema(ToggleKey, 6);
registerSchema(Id, 7);
registerSchema(Sun, 8);