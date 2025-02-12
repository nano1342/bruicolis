-- CreateTable
CREATE TABLE "Song" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);
