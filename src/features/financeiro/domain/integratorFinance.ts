export const getDailyChartLabels = (rows: Array<{ dataReceita: string; dataPrevista: string }>) =>
  Array.from(new Set(rows.flatMap((row) => [row.dataReceita, row.dataPrevista])))
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));
