export function formatDuration(sec: number): string {
  if (sec < 60) return `${sec} sec`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

export function formatReadTime(min: number): string {
  return `${min} min read`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit" });
}
