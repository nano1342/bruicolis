
import { Request, Response } from "express";
import { GetArtistsService } from "../../Services/getArtists.services";
import { PrismaClient, Artist } from "@prisma/client";

const prisma = new PrismaClient();

export default class ArtistController {

    constructor(private readonly getArtistsService:GetArtistsService) {

    }

    async getArtists(req: Request, res: Response) {
        const artists = await this.getArtistsService.getAll();
        res.send(artists);
    }

    async getArtist(req: Request, res: Response) {
        if (req.params['id'] == null) {
            res.send("erreur à ecrire");
        }

        const id = Number.parseInt(req.params['id']);
        
        const artist = await this.getArtistsService.getOneById(id);
        // const artist = "bruh";
        res.send(artist);
    }
}