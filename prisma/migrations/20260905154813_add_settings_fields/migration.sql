-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "fontSize" TEXT NOT NULL DEFAULT 'medium',
    "compactView" BOOLEAN NOT NULL DEFAULT false,
    "streamResponses" BOOLEAN NOT NULL DEFAULT true,
    "autoTitle" BOOLEAN NOT NULL DEFAULT true,
    "contextLimit" INTEGER NOT NULL DEFAULT 20,
    "usageWarningThreshold" INTEGER NOT NULL DEFAULT 80,
    "language" TEXT NOT NULL DEFAULT 'en',
    "customSystemPrompt" TEXT,
    "defaultDeckId" TEXT,
    "defaultAgentId" TEXT,
    "temperature" REAL NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 1000,
    "accentColor" TEXT NOT NULL DEFAULT '#6366f1',
    "dailyStudyGoal" INTEGER NOT NULL DEFAULT 20,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserSettings" ("autoTitle", "compactView", "contextLimit", "createdAt", "customSystemPrompt", "defaultDeckId", "fontSize", "id", "language", "streamResponses", "theme", "updatedAt", "usageWarningThreshold", "userId") SELECT "autoTitle", "compactView", "contextLimit", "createdAt", "customSystemPrompt", "defaultDeckId", "fontSize", "id", "language", "streamResponses", "theme", "updatedAt", "usageWarningThreshold", "userId" FROM "UserSettings";
DROP TABLE "UserSettings";
ALTER TABLE "new_UserSettings" RENAME TO "UserSettings";
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
