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
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifyHash" TEXT NOT NULL DEFAULT '',
    "emailVerifyExp" DATETIME,
    "emailVerifySentAt" DATETIME,
    "bio" TEXT NOT NULL DEFAULT '',
    "avatar" TEXT NOT NULL DEFAULT '',
    "cover" TEXT NOT NULL DEFAULT '',
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("avatar", "bio", "cover", "createdAt", "displayName", "email", "emailVerified", "emailVerifyExp", "emailVerifyHash", "emailVerifySentAt", "handle", "id", "isPrivate", "passwordHash", "role", "twoFactorBackupCodes", "twoFactorEnabled", "twoFactorSecret", "updatedAt") SELECT "avatar", "bio", "cover", "createdAt", "displayName", "email", "emailVerified", "emailVerifyExp", "emailVerifyHash", "emailVerifySentAt", "handle", "id", "isPrivate", "passwordHash", "role", "twoFactorBackupCodes", "twoFactorEnabled", "twoFactorSecret", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_handle_key" ON "User"("handle");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
