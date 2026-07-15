/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Calculator` will be added. If there are existing duplicate values, this will fail.

*/
-- добавить столбцы (nullable + дефолт для robots)
ALTER TABLE "Calculator" ADD COLUMN "slug" TEXT;
ALTER TABLE "Calculator" ADD COLUMN "seoRobots" TEXT DEFAULT 'index,follow';

-- проставить значения для существующих строк (используем id как slug)
UPDATE "Calculator" SET "slug" = "id" WHERE "slug" IS NULL;

-- уникальный индекс
CREATE UNIQUE INDEX "Calculator_slug_key" ON "Calculator"("slug");