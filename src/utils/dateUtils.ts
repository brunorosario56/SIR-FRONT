/**
 * Retorna uma data ISO formatada para input datetime-local
 * @param hours - Número de horas a adicionar à data atual
 * @returns String no formato YYYY-MM-DDTHH:MM
 */
export function isoNowPlus(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  d.setMinutes(0, 0, 0);
  return d.toISOString().slice(0, 16); // para input datetime-local
}
