-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL DEFAULT '',
    "ip" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "handle" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT NOT NULL DEFAULT '',
    "twoFactorBackupCodes" TEXT NOT NULL DEFAULT '[]',
    "verifiedTier" TEXT NOT NULL DEFAULT '',
    "staffRole" TEXT NOT NULL DEFAULT '',
    "settings" TEXT NOT NULL DEFAULT '{}',
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "suspendedReason" TEXT NOT NULL DEFAULT '',
    "suspendedAt" DATETIME,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifyHash" TEXT NOT NULL DEFAULT '',
    "emailVerifyExp" DATETIME,
    "emailVerifySentAt" DATETIME,
    "bio" TEXT NOT NULL DEFAULT '',
    "avatar" TEXT NOT NULL DEFAULT '',
    "cover" TEXT NOT NULL DEFAULT '',
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLoginAt" DATETIME,
    "lastLoginIp" TEXT NOT NULL DEFAULT '',
    "profileViewCount" INTEGER NOT NULL DEFAULT 0,
    "adminNotesJson" TEXT NOT NULL DEFAULT '[]',
    "passwordResetHash" TEXT NOT NULL DEFAULT '',
    "passwordResetExp" DATETIME,
    "passwordResetSentAt" DATETIME
);
INSERT INTO "new_User" ("adminNotesJson", "avatar", "bio", "cover", "createdAt", "displayName", "email", "emailVerified", "emailVerifyExp", "emailVerifyHash", "emailVerifySentAt", "handle", "id", "isPrivate", "lastLoginAt", "lastLoginIp", "passwordHash", "profileViewCount", "role", "settings", "staffRole", "suspended", "suspendedAt", "suspendedReason", "twoFactorBackupCodes", "twoFactorEnabled", "twoFactorSecret", "updatedAt", "verifiedTier") SELECT "adminNotesJson", "avatar", "bio", "cover", "createdAt", "displayName", "email", "emailVerified", "emailVerifyExp", "emailVerifyHash", "emailVerifySentAt", "handle", "id", "isPrivate", "lastLoginAt", "lastLoginIp", "passwordHash", "profileViewCount", "role", "settings", "staffRole", "suspended", "suspendedAt", "suspendedReason", "twoFactorBackupCodes", "twoFactorEnabled", "twoFactorSecret", "updatedAt", "verifiedTier" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_handle_key" ON "User"("handle");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
