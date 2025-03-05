import ArtistController from "./Infrastructures/Controllers/artists.controller";
import { PrismaClient, Artist } from "@prisma/client";
import { PgArtistRepository } from "./Infrastructures/Repositories/pgArtistRepository";
import { GetArtistsUseCase } from "./useCases/getArtists.useCases";

const prisma = new PrismaClient();

export const artistRepository = new PgArtistRepository(prisma);
export const getArtistsUseCase = new GetArtistsUseCase(artistRepository);
export const artistController = new ArtistController(getArtistsUseCase);
