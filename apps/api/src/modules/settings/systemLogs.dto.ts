export interface SystemLogDto {
  id: string;
  userId: string | null;
  userName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: string | null;
  createdAt: Date;
}
