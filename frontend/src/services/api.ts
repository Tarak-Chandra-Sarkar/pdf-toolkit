import type {
  HealthResponse,
  PdfInfo,
} from "../types/api";


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:8000";


async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    options,
  );

  if (!response.ok) {

    let message =
      `Request failed: ${response.status}`;

    try {

      const error =
        await response.json();

      if (
        typeof error.detail ===
        "string"
      ) {
        message = error.detail;
      }

    } catch {
      // Keep default message.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function getHealth()
  : Promise<HealthResponse> {

  return request<HealthResponse>(
    "/api/v1/health",
  );
}

export async function uploadPdf(
  file: File,
): Promise<PdfInfo> {

  const formData =
    new FormData();

  formData.append(
    "file",
    file,
  );

  return request<PdfInfo>(
    "/api/v1/pdf/upload",
    {
      method: "POST",
      body: formData,
    },
  );
}

export async function mergePdfs(
  files: File[],
): Promise<PdfInfo> {

  const formData =
    new FormData();

  for (const file of files) {

    formData.append(
      "files",
      file,
    );
  }

  return request<PdfInfo>(
    "/api/v1/pdf/merge",
    {
      method: "POST",
      body: formData,
    },
  );
}

export function getPdfDownloadUrl(
  fileId: string,
): string {

  return (
    `${API_BASE_URL}` +
    `/api/v1/pdf/${fileId}/download`
  );
}

export function getPdfPreviewUrl(
  fileId: string,
  pageNumber: number,
): string {

  return (
    `${API_BASE_URL}` +
    `/api/v1/pdf/${fileId}` +
    `/pages/${pageNumber}/preview`
  );
}

export async function deletePdf(
  fileId: string,
): Promise<void> {

  await request(
    `/api/v1/pdf/${fileId}`,
    {
      method: "DELETE",
    },
  );
}

export async function convertImagesToPdf(
  files: File[],
): Promise<Blob> {

  const formData = new FormData();

  for (const file of files) {
    formData.append("files", file);
  }

  const response = await fetch(
    `${API_BASE_URL}/api/v1/pdf/from-images`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {

    let message =
      "Unable to convert images to PDF.";

    try {

      const data =
        await response.json();

      if (data?.detail) {
        message = data.detail;
      }

    } catch {
      // Ignore JSON parsing errors.
    }

    throw new Error(message);
  }

  return response.blob();
}