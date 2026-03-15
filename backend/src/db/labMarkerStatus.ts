export type MarkerStatus = 'normal' | 'baixo' | 'alto' | 'subotimo' | 'acima_otimo';

/**
 * Calcula o status do marcador com base em value e faixas de referência/ótima.
 * Ordem: ref (baixo/alto) → optimal (subotimo/acima_otimo) → normal.
 */
export function computeMarkerStatus(
  value: number,
  ref_min?: number | null,
  ref_max?: number | null,
  optimal_min?: number | null,
  optimal_max?: number | null
): MarkerStatus {
  if (ref_min != null && value < ref_min) return 'baixo';
  if (ref_max != null && value > ref_max) return 'alto';
  if (optimal_min != null && value < optimal_min) return 'subotimo';
  if (optimal_max != null && value > optimal_max) return 'acima_otimo';
  return 'normal';
}
