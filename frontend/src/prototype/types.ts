export type Corner = 'FL' | 'FR' | 'RL' | 'RR'

export interface CornerConfig {
  code: Corner
  name: string
  axle: 'Front' | 'Rear'
  side: 'Left' | 'Right'
}

export const CORNERS: Record<Corner, CornerConfig> = {
  FL: { code: 'FL', name: 'Front Left', axle: 'Front', side: 'Left' },
  FR: { code: 'FR', name: 'Front Right', axle: 'Front', side: 'Right' },
  RL: { code: 'RL', name: 'Rear Left', axle: 'Rear', side: 'Left' },
  RR: { code: 'RR', name: 'Rear Right', axle: 'Rear', side: 'Right' },
}

export interface TyreReading {
  coldPressure: number
  hotPressure: number
  targetPressure: number
  temperature: number
}

export type TyresState = Record<Corner, TyreReading>

export function createInitialTyresState(): TyresState {
  return {
    FL: { coldPressure: 26.0, hotPressure: 33.5, targetPressure: 30.0, temperature: 68 },
    FR: { coldPressure: 26.0, hotPressure: 34.5, targetPressure: 30.0, temperature: 74 },
    RL: { coldPressure: 25.0, hotPressure: 30.5, targetPressure: 28.0, temperature: 58 },
    RR: { coldPressure: 25.0, hotPressure: 31.5, targetPressure: 28.0, temperature: 64 },
  }
}

export function calculateBleed(hotPressure: number, targetPressure: number): number {
  return Number((hotPressure - targetPressure).toFixed(2))
}
