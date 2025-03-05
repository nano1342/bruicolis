import ArtistController from "./Infrastructures/Controllers/artists.controller";
import { PrismaClient, Artist } from "@prisma/client";
import { PgArtistRepository } from "./Infrastructures/Repositories/pgArtistRepository";
import { GetArtistsService } from "./Services/getArtists.services";

const prisma = new PrismaClient();

export const artistRepository = new PgArtistRepository(prisma);
export const getArtistsService = new GetArtistsService(artistRepository);
export const artistController = new ArtistController(getArtistsService);
