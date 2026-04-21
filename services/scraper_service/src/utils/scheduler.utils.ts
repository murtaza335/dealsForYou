export function getNextRunTime(runTimes: string[]): Date {
  const now = new Date();

  const futureTimes = runTimes
    .map((t) => {
      
      const [h, m] = t.split(":").map(Number);

      const d = new Date();
      d.setHours(h, m, 0, 0);
      
      if (d <= now) d.setDate(d.getDate() + 1);

      return d;
    })
    .sort((a, b) => a.getTime() - b.getTime());

  return futureTimes[0];
}

export function getDelay(targetDate: Date): number {
  return targetDate.getTime() - Date.now();
}