-- CreateTable
CREATE TABLE "ConversationRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    CONSTRAINT "ConversationRole_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "groupOwnerId" TEXT NOT NULL DEFAULT ''
);
INSERT INTO "new_Conversation" ("createdAt", "id", "requesterId", "status", "updatedAt") SELECT "createdAt", "id", "requesterId", "status", "updatedAt" FROM "Conversation";
DROP TABLE "Conversation";
ALTER TABLE "new_Conversation" RENAME TO "Conversation";
CREATE INDEX "Conversation_updatedAt_idx" ON "Conversation"("updatedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ConversationRole_conversationId_idx" ON "ConversationRole"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationRole_conversationId_userId_key" ON "ConversationRole"("conversationId", "userId");
