-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Conversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'accepted',
    "requesterId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "groupName" TEXT NOT NULL DEFAULT '',
    "groupAvatar" TEXT NOT NULL DEFAULT '',
    "groupOwnerId" TEXT NOT NULL DEFAULT '',
    "isRequest" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Conversation" ("createdAt", "groupAvatar", "groupName", "groupOwnerId", "id", "requesterId", "status", "updatedAt") SELECT "createdAt", "groupAvatar", "groupName", "groupOwnerId", "id", "requesterId", "status", "updatedAt" FROM "Conversation";
DROP TABLE "Conversation";
ALTER TABLE "new_Conversation" RENAME TO "Conversation";
CREATE INDEX "Conversation_updatedAt_idx" ON "Conversation"("updatedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
