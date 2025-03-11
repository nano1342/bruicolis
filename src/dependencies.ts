import { PrismaClient } from "@prisma/client";

import ArtistController from "./Infrastructures/Controllers/artists.controller";
import { PgArtistRepository } from "./Infrastructures/Repositories/pgArtistRepository";
import { GetArtistsService } from "./Services/getArtists.services";

import SongController from "./Infrastructures/Controllers/songs.controller";
import { PgSongRepository } from "./Infrastructures/Repositories/pgSongRepository";
import { GetSongsService } from "./Services/getSongs.services";

const prisma = new PrismaClient();

// Artists
export const artistRepository = new PgArtistRepository(prisma);
export const getArtistsService = new GetArtistsService(artistRepository);
export const artistController = new ArtistController(getArtistsService);

// Songs
export const songRepository = new PgSongRepository(prisma);
export const getSongsService = new GetSongsService(songRepository);
export const songController = new SongController(getSongsService);
