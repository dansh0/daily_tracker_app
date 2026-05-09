import { MandatoryData } from '../types'

export function calculateScore(
  mandatoryData: MandatoryData,
  completedOptionalIds: string[]
): number {
  const mandatoryComplete =
    mandatoryData.satisfaction !== null &&
    mandatoryData.mood !== null &&
    mandatoryData.stress !== null

  const base = mandatoryComplete ? 0.5 : 0
  const bonus = completedOptionalIds.length * 0.25
  return base + bonus
}
