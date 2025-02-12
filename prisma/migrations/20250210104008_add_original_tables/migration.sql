-- CreateTable
CREATE TABLE "Album" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artist" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SongArtistLink" (
    "id" SERIAL NOT NULL,
    "song_id" INTEGER NOT NULL,
    "artist_id" INTEGER NOT NULL,

    CONSTRAINT "SongArtistLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SongAlbumLink" (
    "id" SERIAL NOT NULL,
    "song_id" INTEGER NOT NULL,
    "album_id" INTEGER NOT NULL,

    CONSTRAINT "SongAlbumLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "label" VARCHAR(50) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagLink" (
    "id" SERIAL NOT NULL,
    "id_tag" INTEGER NOT NULL,
    "id_song" INTEGER NOT NULL,
    "id_album" INTEGER NOT NULL,
    "id_artist" INTEGER NOT NULL,

    CONSTRAINT "TagLink_pkey" PRIMARY KEY ("id")
);
