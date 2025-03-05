
import { Request, Response } from "express";
import { GetArtistsService } from "../../Services/getArtists.services";
import { PrismaClient, Artist } from "@prisma/client";

const prisma = new PrismaClient();

export default class ArtistController {

    constructor(private readonly getArtistService:GetArtistsService) {

    }

    async getArtists(req: Request, res: Response) {
        const artists = await this.getArtistService.execute();
        res.send(artists);
    }
}