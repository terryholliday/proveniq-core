import { db } from "@/lib/db";

export type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "VERIFICATION" | "SYSTEM";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(input: CreateNotificationInput) {
  return db.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      metadata: input.metadata as any,
    },
  });
}

export async function getUserNotifications(userId: string, limit = 20, offset = 0) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}

export async function getUnreadCount(userId: string) {
  return db.notification.count({
    where: {
      userId,
      readAt: null,
    },
  });
}

export async function markAsRead(notificationId: string, userId: string) {
  return db.notification.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data: {
      readAt: new Date(),
    },
  });
}

export async function markAllAsRead(userId: string) {
  return db.notification.updateMany({
    where: {
      userId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });
}

export async function deleteNotification(notificationId: string, userId: string) {
  return db.notification.deleteMany({
    where: {
      id: notificationId,
      userId,
    },
  });
}
