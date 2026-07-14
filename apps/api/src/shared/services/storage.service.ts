export interface StoredFile {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export interface StorageService {
  store(file: Express.Multer.File): Promise<StoredFile>;
  resolvePath(fileUrl: string): string;
  delete(fileUrl: string): Promise<void>;
}
