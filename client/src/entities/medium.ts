export interface Medium {
  id: string;
  title: string;
  isAvailable: boolean;
  isChecked: boolean;
  mimeType: string;
  duration: number;
  filePath: string;
  ext: string;
}

export interface MediumSummary {
  name: string;
  type: string;
}
