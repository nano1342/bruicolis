
import { Request, Response } from "express";
import { GetArtistsService } from "../../Services/getArtists.services";
import { PrismaClient, Artist } from "@prisma/client";
import * as Errors from "../../Utils/Errors";
import Joi from "joi";

const prisma = new PrismaClient();

export default class ArtistController {

    private reqBodyFormatArtistPost = Joi.object({
        name: Joi.string().required(),
    });

    constructor(private readonly getArtistsService:GetArtistsService) {

    }

    async getArtists(req: Request, res: Response) {
        let result;
        console.log(req.body);
        
        if (req.body.page != null && req.body.limit != null) {
            result = await this.getArtistsService.getPage(req.body.page, req.body.limit);
        } else {
            result = await this.getArtistsService.getAll();
        }

        if (result == Errors.ErrorType.INCORRECT_PARAMETER) {
            res.status(400).send(Errors.getErrorBodyDefault(Errors.ErrorType.INCORRECT_PARAMETER));
            return;
        }

        res.send(result);
    }

    async addArtist(req: Request, res: Response) {

        const { error, value } = this.reqBodyFormatArtistPost.validate(req.body);
        if (error) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.WRONG_BODY);
            res.status(400).send(errorBody);
            return;
        }
        
        
        const artistToInsert = {
            id: -1,
            name: req.body['name'],
        };
        
        console.log("pré envoi", req.body);

        const artist = await this.getArtistsService.addArtist(artistToInsert);
        res.send(artist);
    }

    async getArtist(req: Request, res: Response) {
        if (req.params['id'] == null) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.MISSING_PARAMETER);
            res.status(422).send(errorBody);
            return;
        }

        //parsing the parameter
        const id = Number.parseInt(req.params['id']);
        if (id == null || Number.isNaN(id)) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.INCORRECT_PARAMETER);
            res.status(406).send(errorBody);
            return;
        }
        
        
        const artist = await this.getArtistsService.getOneById(id);
        if (artist == null) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.NOT_FOUND);
            res.status(404).send(errorBody);
            return;
        }
        res.send(artist);
    }
}