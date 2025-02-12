/*
  Warnings:

  - You are about to drop the column `album_id` on the `SongAlbumLink` table. All the data in the column will be lost.
  - You are about to drop the column `song_id` on the `SongAlbumLink` table. All the data in the column will be lost.
  - You are about to drop the column `artist_id` on the `SongArtistLink` table. All the data in the column will be lost.
  - You are about to drop the column `song_id` on the `SongArtistLink` table. All the data in the column will be lost.
  - You are about to drop the column `id_album` on the `TagLink` table. All the data in the column will be lost.
  - You are about to drop the column `id_artist` on the `TagLink` table. All the data in the column will be lost.
  - You are about to drop the column `id_song` on the `TagLink` table. All the data in the column will be lost.
  - You are about to drop the column `id_tag` on the `TagLink` table. All the data in the column will be lost.
  - Added the required column `albumId` to the `SongAlbumLink` table without a default value. This is not possible if the table is not empty.
  - Added the required column `songId` to the `SongAlbumLink` table without a default value. This is not possible if the table is not empty.
  - Added the required column `artistId` to the `SongArtistLink` table without a default value. This is not possible if the table is not empty.
  - Added the required column `songId` to the `SongArtistLink` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idAlbum` to the `TagLink` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idArtist` to the `TagLink` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idSong` to the `TagLink` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idTag` to the `TagLink` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SongAlbumLink" DROP COLUMN "album_id",
DROP COLUMN "song_id",
ADD COLUMN     "albumId" INTEGER NOT NULL,
ADD COLUMN     "songId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "SongArtistLink" DROP COLUMN "artist_id",
DROP COLUMN "song_id",
ADD COLUMN     "artistId" INTEGER NOT NULL,
ADD COLUMN     "songId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "TagLink" DROP COLUMN "id_album",
DROP COLUMN "id_artist",
DROP COLUMN "id_song",
DROP COLUMN "id_tag",
ADD COLUMN     "idAlbum" INTEGER NOT NULL,
ADD COLUMN     "idArtist" INTEGER NOT NULL,
ADD COLUMN     "idSong" INTEGER NOT NULL,
ADD COLUMN     "idTag" INTEGER NOT NULL;
