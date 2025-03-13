
import { Request, Response } from "express";
import { GetSongsService } from "../../Services/getSongs.services";
import * as Errors from "../../Utils/Errors";
import Joi from "joi";

export default class SongController {

    private reqBodyFormatSongPost = Joi.object({
        name: Joi.string().required(),
        release_date: Joi.string().required(),
        artist_id: Joi.number().required(),
    });

    constructor(private readonly getSongsService:GetSongsService) {

    }

    async getSongs(req: Request, res: Response) {
        let result;
        console.log(req.body);
        
        if (req.body.page != null && req.body.limit != null) {
            result = await this.getSongsService.getPage(req.body.page, req.body.limit);
        } else {
            result = await this.getSongsService.getAll();
        }

        if (result == Errors.ErrorType.INCORRECT_PARAMETER) {
            res.status(400).send(Errors.getErrorBodyDefault(Errors.ErrorType.INCORRECT_PARAMETER));
            return;
        }

        res.send(result);
    }

    async addSong(req: Request, res: Response) {

        const { error, value } = this.reqBodyFormatSongPost.validate(req.body);
        if (error) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.WRONG_BODY);
            res.status(400).send(errorBody);
            return;
        }
        
        
        const songToInsert = {
            id: -1,
            name: req.body['name'],
            release_date: req.body['release_date']
        };
        
        console.log("pré envoi", req.body);

        const insertedSong = await this.getSongsService.addSong(songToInsert, req.body['artist_id']);
        
        if (insertedSong == Errors.ErrorType.FOREIGN_KEY_NOT_FOUND) {
            res.status(400).send(Errors.getErrorBody(Errors.ErrorType.FOREIGN_KEY_NOT_FOUND, "The specified artist_id is unknown."))
        }
        else {
            res.send(insertedSong);
        }
    }

    async getSong(req: Request, res: Response) {
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
        
        
        const song = await this.getSongsService.getOneById(id);
        if (song == null) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.NOT_FOUND);
            res.status(404).send(errorBody);
            return;
        }
        res.send(song);
    }

    /**
     * Adds a tag to the specified song.
     * @param req 
     * @param res 
     * @returns 
     */
    async addTag(req: Request, res: Response) {
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

        if (req.body['tag_id'] == null) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.MISSING_BODY_PARAMETER);
            res.status(422).send(errorBody);
            return;
        }

        const tagId = Number.parseInt(req.body['tag_id']);
        console.log(req.body['tag_id'], tagId);
        
        if (tagId == null || Number.isNaN(tagId)) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.INCORRECT_BODY_PARAMETER);
            res.status(406).send(errorBody);
            return;
        }
        
        
        const respBody = await this.getSongsService.addTag(id, tagId);
        // let respBody;
        // if (succeed == null) {
        //     const respBody = Errors.getErrorBodyDefault(Errors.ErrorType.NOT_FOUND);
        //     res.status(404).send(respBody);
        //     return;
        // }

        res.send(respBody);
    }
}