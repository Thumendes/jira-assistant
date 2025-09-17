export interface FileUploadOptions {
  maxSize?: number; // em bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const DEFAULT_UPLOAD_OPTIONS: FileUploadOptions = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
};

export function validateFile(file: File, options: FileUploadOptions = {}): ValidationResult {
  const opts = { ...DEFAULT_UPLOAD_OPTIONS, ...options };

  // Verificar se o arquivo existe
  if (!file) {
    return { isValid: false, error: "Nenhum arquivo foi fornecido" };
  }

  // Verificar tamanho do arquivo
  if (opts.maxSize && file.size > opts.maxSize) {
    const maxSizeMB = opts.maxSize / (1024 * 1024);
    return {
      isValid: false,
      error: `Arquivo muito grande. Tamanho máximo permitido: ${maxSizeMB}MB`,
    };
  }

  // Verificar tipo MIME
  if (opts.allowedTypes && !opts.allowedTypes.includes(file.type)) {
    const allowedTypesStr = opts.allowedTypes
      .map((type) => type.split("/")[1].toUpperCase())
      .join(", ");
    return {
      isValid: false,
      error: `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypesStr}`,
    };
  }

  // Verificar extensão do arquivo
  if (opts.allowedExtensions) {
    const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!opts.allowedExtensions.includes(fileExtension)) {
      const allowedExtStr = opts.allowedExtensions.join(", ");
      return {
        isValid: false,
        error: `Extensão de arquivo não permitida. Extensões aceitas: ${allowedExtStr}`,
      };
    }
  }

  return { isValid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function generateUniqueFileName(originalName: string, prefix?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split(".").pop();
  const baseName = originalName.split(".").slice(0, -1).join(".");

  const cleanBaseName = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const prefixStr = prefix ? `${prefix}-` : "";
  return `${prefixStr}${cleanBaseName}-${timestamp}-${random}.${extension}`;
}

export async function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Erro ao converter arquivo para base64"));
      }
    };
    reader.onerror = (error) => reject(error);
  });
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

export async function compressImage(
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Calcular novas dimensões mantendo aspect ratio
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Desenhar imagem redimensionada
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error("Erro ao comprimir imagem"));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => reject(new Error("Erro ao carregar imagem"));
    img.src = URL.createObjectURL(file);
  });
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export async function uploadFileWithProgress(
  file: File,
  url: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const progress: UploadProgress = {
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100),
        };
        onProgress(progress);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(new Response(xhr.response, { status: xhr.status }));
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Upload failed"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload aborted"));
    });

    xhr.open("POST", url);
    xhr.send(formData);
  });
}
