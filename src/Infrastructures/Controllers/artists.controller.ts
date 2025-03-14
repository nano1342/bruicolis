
import { Request, Response } from "express";
import { GetArtistsService } from "../../Services/getArtists.services";
import { PrismaClient } from "@prisma/client";
import * as Errors from "../../Utils/Errors";
import Joi from "joi";
import { Artist } from "../../Domains/Models/Artist";

export default class ArtistController {

    private reqBodyFormatArtistPost = Joi.object({
        name: Joi.string().required(),
    });

    constructor(private readonly getArtistsService:GetArtistsService) {

    }

    async getArtists(req: Request, res: Response) {
        let result;
        
        if (req.body.page != null && req.body.limit != null) {
            result = await this.getArtistsService.getPage(req.body.page, req.body.limit, req.body.filters);
        } else {
            result = await this.getArtistsService.getAll(req.body.filters);
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
        
        
        const artistToInsert: Artist = {
            id: -1,
            name: req.body['name'],
            musicbrainzId: null,
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

    /**
     * Returns all the songs released by the given artist
     * @param req 
     * @param res 
     */
    async getArtistSongs(req: Request, res: Response) {
        if (req.params['id'] == null) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.MISSING_PARAMETER);
            res.status(422).send(errorBody);
            return;
        }

        //parsing the parameter
        const artist_id = Number.parseInt(req.params['id']);
        if (artist_id == null || Number.isNaN(artist_id)) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.INCORRECT_PARAMETER);
            res.status(406).send(errorBody);
            return;
        }
        
        const songList = await this.getArtistsService.getSongs(artist_id);
        res.send(songList);
    }


    /**
     * Returns all albums released by the given artist
     * @param req 
     * @param res 
     */
    async getArtistAlbums(req: Request, res: Response) {
        if (req.params['id'] == null) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.MISSING_PARAMETER);
            res.status(422).send(errorBody);
            return;
        }
        
        //parsing the parameter
        const artist_id = Number.parseInt(req.params['id']);
        if (artist_id == null || Number.isNaN(artist_id)) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.INCORRECT_PARAMETER);
            res.status(406).send(errorBody);
            return;
        }

        const albumList = await this.getArtistsService.getAlbums(artist_id);
        res.send(albumList);
    }


    /**
     * Returns all tags associated to the artist.
     * @param req 
     * @param res 
     */
    async getArtistTags(req: Request, res: Response) {
        if (req.params['id'] == null) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.MISSING_PARAMETER);
            res.status(422).send(errorBody);
            return;
        }
        
        //parsing the parameter
        const artist_id = Number.parseInt(req.params['id']);
        if (artist_id == null || Number.isNaN(artist_id)) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.INCORRECT_PARAMETER);
            res.status(406).send(errorBody);
            return;
        }

        const albumList = await this.getArtistsService.getTags(artist_id);
        res.send(albumList);
    }


    /**
     * Returns all tags associated to the artist.
     * @param req 
     * @param res 
     */
    async addArtistTag(req: Request, res: Response) {
        if (req.params['id'] == null) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.MISSING_PARAMETER);
            res.status(422).send(errorBody);
            return;
        }
        
        const artist_id = Number.parseInt(req.params['id']);
        if (artist_id == null || Number.isNaN(artist_id)) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.INCORRECT_PARAMETER);
            res.status(406).send(errorBody);
            return;
        }
        
        if (req.body['tag_id'] == null) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.MISSING_BODY_PARAMETER);
            res.status(422).send(errorBody);
            return;
        }

        const tagId = Number.parseInt(req.body['tag_id']);
        
        if (tagId == null || Number.isNaN(tagId)) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.INCORRECT_BODY_PARAMETER);
            res.status(406).send(errorBody);
            return;
        }

        const albumList = await this.getArtistsService.addTag(artist_id, tagId);
        res.send(albumList);
    }
}