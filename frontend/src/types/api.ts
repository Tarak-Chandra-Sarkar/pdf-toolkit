export interface HealthResponse {
  status: string;
  service: string;
  version: string;
}

export interface PdfMetadata {
  title: string | null;
  author: string | null;
  subject: string | null;
  creator: string | null;
  producer: string | null;
}

export interface PdfInfo {
  file_id: string;
  filename: string;
  size_bytes: number;
  page_count: number;
  metadata: PdfMetadata;
}