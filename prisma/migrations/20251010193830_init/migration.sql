-- CreateTable
CREATE TABLE "Calculator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "seoTitle" TEXT NOT NULL,
    "seoDescription" TEXT NOT NULL,
    "seoKeywords" TEXT NOT NULL,
    "contentBefore" TEXT,
    "contentAfter" TEXT,
    "faq" TEXT,
    "adsTopEnabled" BOOLEAN NOT NULL DEFAULT false,
    "adsTopCode" TEXT,
    "adsSidebarEnabled" BOOLEAN NOT NULL DEFAULT false,
    "adsSidebarCode" TEXT,
    "adsBottomEnabled" BOOLEAN NOT NULL DEFAULT false,
    "adsBottomCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Calculator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
