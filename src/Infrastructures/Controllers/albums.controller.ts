
import { Request, Response } from "express";
import { AlbumsService } from "../../Services/albums.services";
import * as Errors from "../../Utils/Errors";
import Joi from "joi";

export default class AlbumController {

    private reqBodyFormatAlbumPost = Joi.object({
        name: Joi.string().required(),
        release_date: Joi.string().required(),
        artist_id: Joi.number().required(),
    });

    constructor(private readonly getAlbumsService:AlbumsService) {

    }

    async getAlbums(req: Request, res: Response) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        let result;
        
        if (req.body.page != null && req.body.limit != null) {
            result = await this.getAlbumsService.getPage(req.body.page, req.body.limit, req.body.filters);
        } else {
            result = await this.getAlbumsService.getAll(req.body.filters);
        }

        if (result == Errors.ErrorType.INCORRECT_PARAMETER) {
            res.status(400).send(Errors.getErrorBodyDefault(Errors.ErrorType.INCORRECT_PARAMETER));
            return;
        }

        res.send(result);
    }

    async addAlbum(req: Request, res: Response) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

        const { error, value } = this.reqBodyFormatAlbumPost.validate(req.body);
        if (error) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.WRONG_BODY);
            res.status(400).send(errorBody);
            return;
        }
        
        
        const albumToInsert = {
            id: -1,
            name: req.body['name'],
            release_date: req.body['release_date']
        };
        
        console.log("pré envoi", req.body);

        const insertedAlbum = await this.getAlbumsService.addAlbum(albumToInsert, req.body['artist_id']);
        
        if (insertedAlbum == Errors.ErrorType.FOREIGN_KEY_NOT_FOUND) {
            res.status(400).send(Errors.getErrorBody(Errors.ErrorType.FOREIGN_KEY_NOT_FOUND, "The specified artist_id is unknown."))
        }
        else {
            res.send(insertedAlbum);
        }
    }

    async getAlbum(req: Request, res: Response) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
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
        
        
        const album = await this.getAlbumsService.getOneById(id);
        if (album == null) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.NOT_FOUND);
            res.status(404).send(errorBody);
            return;
        }
        res.send(album);
    }

    async getAlbumSongs(req: Request, res: Response) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
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
        
        const album = await this.getAlbumsService.getOneById(id);
        if (album == null) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.NOT_FOUND);
            res.status(404).send(errorBody);
            return;
        }
        const songList = await this.getAlbumsService.getSongsAll(id);
        res.send(songList);
    }

    async addAlbumSong(req: Request, res: Response) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
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
        
        if (req.body['song_id'] == null) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.MISSING_BODY_PARAMETER);
            res.status(422).send(errorBody);
            return;
        }

        const songId = Number.parseInt(req.body['song_id']);
        
        if (songId == null || Number.isNaN(songId)) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.INCORRECT_BODY_PARAMETER);
            res.status(406).send(errorBody);
            return;
        }

        const respBody = await this.getAlbumsService.addSong(id, songId);
        if (respBody.error != null) {
            
            let errorObj: { [key: string]: any } = respBody.error;
            if (errorObj.error.type == "Foreign key not found") {
                res.status(404);
            } else if (errorObj.error.type == "Incorrect body parameter") {
                res.status(400);
            }
            else res.status(500);
        }
        res.send(respBody);
    }
    
    
    /**
     * Returns all tags associated to the artist.
     * @param req 
     * @param res 
     */
    async getAlbumTags(req: Request, res: Response) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        if (req.params['id'] == null) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.MISSING_PARAMETER);
            res.status(422).send(errorBody);
            return;
        }
        
        //parsing the parameter
        const albumId = Number.parseInt(req.params['id']);
        if (albumId == null || Number.isNaN(albumId)) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.INCORRECT_PARAMETER);
            res.status(406).send(errorBody);
            return;
        }

        const albumList = await this.getAlbumsService.getTags(albumId);
        res.send(albumList);
    }
    
    /**
     * Returns all tags associated to the artist.
     * @param req 
     * @param res 
     */
    async addAlbumTag(req: Request, res: Response) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
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

        const albumList = await this.getAlbumsService.addTag(artist_id, tagId);
        res.send(albumList);
    }
        
}