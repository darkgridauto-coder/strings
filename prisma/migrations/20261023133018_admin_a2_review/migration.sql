-- CreateTable
CREATE TABLE "Strike" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "issuedById" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 1,
    "category" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "postId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Strike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "media" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" DATETIME,
    "mediaUrls" TEXT NOT NULL DEFAULT '[]',
    "repostOfId" TEXT,
    "quoteText" TEXT NOT NULL DEFAULT '',
    "scheduledFor" DATETIME,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "pollId" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "reviewedAt" DATETIME,
    "reviewDecision" TEXT NOT NULL DEFAULT '',
    "reviewCats" TEXT NOT NULL DEFAULT '[]',
    "hiddenAt" DATETIME,
    CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Post_repostOfId_fkey" FOREIGN KEY ("repostOfId") REFERENCES "Post" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Post_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("authorId", "body", "createdAt", "editedAt", "id", "isDraft", "media", "mediaUrls", "pollId", "quoteText", "repostOfId", "scheduledFor", "viewCount") SELECT "authorId", "body", "createdAt", "editedAt", "id", "isDraft", "media", "mediaUrls", "pollId", "quoteText", "repostOfId", "scheduledFor", "viewCount" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE UNIQUE INDEX "Post_pollId_key" ON "Post"("pollId");
CREATE INDEX "Post_authorId_idx" ON "Post"("authorId");
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Strike_userId_idx" ON "Strike"("userId");
