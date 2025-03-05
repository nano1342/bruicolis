
import { Request, Response } from "express";
import { GetArtistsUseCase } from "../../useCases/getArtists.useCases";
import { PrismaClient, Artist } from "@prisma/client";

const prisma = new PrismaClient();

export default class ArtistController {

    constructor(private readonly getArtistUseCase:GetArtistsUseCase) {

    }

    async getArtists(req: Request, res: Response) {
        const artists = await this.getArtistUseCase.execute();
        res.send(artists);
    }
}