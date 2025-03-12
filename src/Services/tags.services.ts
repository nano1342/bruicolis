import { Tag } from "../Domains/Models/Tag";
import { TagRepository } from "../Domains/repositories/tagRepository";
import * as Errors from "../Utils/Errors";

export class TagsService {

    constructor(private readonly tagRepository:TagRepository) {
        
    }

    getAll() {
        return this.tagRepository.selectAll();
    }

    getPage(page: number, limit: number) {
        try {
            if (Number.isNaN(page) || Number.isNaN(limit) || page < 1) {
                return Errors.ErrorType.INCORRECT_PARAMETER;
            }
            return this.tagRepository.selectPage((page-1)*limit, limit)
        } catch (error) {
            return Errors.ErrorType.INCORRECT_PARAMETER;
        }
    }

    //execute ne sera pas le bon nom dans le cas ou on fait des vérifs supplémentaires dans execute
    getOneById(tagId: number) {
        //vérifications préalables avant requête

        return this.tagRepository.selectOneById(tagId);
    }

    //execute ne sera pas le bon nom dans le cas ou on fait des vérifs supplémentaires dans execute
    addTag(tagToInsert: Tag) {
        //vérifications préalables avant requête

        return this.tagRepository.insertTag(tagToInsert);
    }
}