
import { Request, Response } from "express";
import { TagsService } from "../../Services/tags.services";
import * as Errors from "../../Utils/Errors";
import Joi from "joi";

export default class TagController {

    private reqBodyFormatTagPost = Joi.object({
        label: Joi.string().required(),
    });

    constructor(private readonly getTagsService:TagsService) {

    }

    async getTags(req: Request, res: Response) {
        let result;
        console.log(req.body);
        
        if (req.body.page != null && req.body.limit != null) {
            result = await this.getTagsService.getPage(req.body.page, req.body.limit);
        } else {
            result = await this.getTagsService.getAll();
        }

        if (result == Errors.ErrorType.INCORRECT_PARAMETER) {
            res.status(400).send(Errors.getErrorBodyDefault(Errors.ErrorType.INCORRECT_PARAMETER));
            return;
        }

        res.send(result);
    }

    async addTag(req: Request, res: Response) {

        const { error, value } = this.reqBodyFormatTagPost.validate(req.body);
        if (error) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.WRONG_BODY);
            res.status(400).send(errorBody);
            return;
        }
        
        const tagToInsert = {
            id: -1,
            label: req.body['label']
        };

        const insertedTag = await this.getTagsService.addTag(tagToInsert);
        
        res.send(insertedTag);
    }

    async getTag(req: Request, res: Response) {
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
        
        
        const tag = await this.getTagsService.getOneById(id);
        if (tag == null) {
            const errorBody = Errors.getErrorBodyDefault(Errors.ErrorType.NOT_FOUND);
            res.status(404).send(errorBody);
            return;
        }
        res.send(tag);
    }
}