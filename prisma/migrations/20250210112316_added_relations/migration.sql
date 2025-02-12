-- CreateTable
CREATE TABLE "ArtistAlbumLink" (
    "id" SERIAL NOT NULL,
    "artistId" INTEGER NOT NULL,
    "albumId" INTEGER NOT NULL,

    CONSTRAINT "ArtistAlbumLink_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SongArtistLink" ADD CONSTRAINT "SongArtistLink_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongArtistLink" ADD CONSTRAINT "SongArtistLink_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongAlbumLink" ADD CONSTRAINT "SongAlbumLink_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongAlbumLink" ADD CONSTRAINT "SongAlbumLink_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistAlbumLink" ADD CONSTRAINT "ArtistAlbumLink_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistAlbumLink" ADD CONSTRAINT "ArtistAlbumLink_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
