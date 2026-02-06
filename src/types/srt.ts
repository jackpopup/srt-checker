export interface SrtEntry {
  index: number;
  startTime: string;
  endTime: string;
  text: string;
}

export type SrtFormat = "standard" | "premiere";

export interface SrtFile {
  entries: SrtEntry[];
  raw: string;
  format: SrtFormat;
}
