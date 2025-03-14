import { PrismaClient } from "@prisma/client";

import ArtistController from "./Infrastructures/Controllers/artists.controller";
import { PgArtistRepository } from "./Infrastructures/Repositories/pgArtistRepository";
import { GetArtistsService } from "./Services/getArtists.services";

import SongController from "./Infrastructures/Controllers/songs.controller";
import { PgSongRepository } from "./Infrastructures/Repositories/pgSongRepository";
import { GetSongsService } from "./Services/getSongs.services";

import AlbumController from "./Infrastructures/Controllers/albums.controller";
import { PgAlbumRepository } from "./Infrastructures/Repositories/pgAlbumRepository";
import { AlbumsService } from "./Services/albums.services";

import TagController from "./Infrastructures/Controllers/tags.controller";
import { PgTagRepository } from "./Infrastructures/Repositories/pgTagRepository";
import { TagsService } from "./Services/tags.services";

const prisma = new PrismaClient();

// Albums
export const albumRepository = new PgAlbumRepository(prisma);
export const albumsService = new AlbumsService(albumRepository);
export const albumController = new AlbumController(albumsService);

// Tags
export const tagRepository = new PgTagRepository(prisma);
export const tagService = new TagsService(tagRepository);
export const tagController = new TagController(tagService);

// Songs
export const songRepository = new PgSongRepository(prisma);
export const getSongsService = new GetSongsService(songRepository, tagRepository);
export const songController = new SongController(getSongsService);

// Artists
export const artistRepository = new PgArtistRepository(prisma);
export const getArtistsService = new GetArtistsService(artistRepository, tagRepository);
export const artistController = new ArtistController(getArtistsService);