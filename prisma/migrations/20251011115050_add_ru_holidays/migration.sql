-- CreateTable
CREATE TABLE "RuHoliday" (
    "date" TIMESTAMP(3) NOT NULL,
    "year" INTEGER NOT NULL,
    "isWorking" BOOLEAN NOT NULL,
    "source" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RuHoliday_pkey" PRIMARY KEY ("date")
);
