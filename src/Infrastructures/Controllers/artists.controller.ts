
import { Request, Response } from "express";
import { GetArtistsService } from "../../Services/getArtists.services";
import { PrismaClient, Artist } from "@prisma/client";
import * as Errors from "../../Utils/Errors";

const prisma = new PrismaClient();

export default class ArtistController {

    constructor(private readonly getArtistsService:GetArtistsService) {

    }

    async getArtists(req: Request, res: Response) {
        const artists = await this.getArtistsService.getAll();
        res.send(artists);
    }

    async addArtist(req: Request, res: Response) {
        const artists = "à coder";
        res.send(artists);
    }

    async getArtist(req: Request, res: Response) {
        //verifying presence of the 'id' parameter in the request
        console.log("AAAAAH", req.params['id']);
        
        if (req.params['id'] == null) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.MISSING_PARAMETER);
            res.status(400).send(errorBody);
        }

        //parsing the parameter
        const id = Number.parseInt(req.params['id']);
        if (id == null || Number.isNaN(id)) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.INCORRECT_PARAMETER);
            res.status(406).send(errorBody);
            return;
        }
        
        
        const artist = await this.getArtistsService.getOneById(id);
        res.send(artist);
    }
}