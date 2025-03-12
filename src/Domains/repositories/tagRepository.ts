import { Tag } from "../Models/Tag";
import { ErrorType } from "../../Utils/Errors";

export interface TagRepository {
    
    selectAll() :Promise<Tag[]>
    
    selectPage(skip: number, take: number) :Promise<Tag[]>
    
    selectOneById(tagId: number) :Promise<Tag | null>
    
    insertTag(tagToInsert: Tag) :Promise<Tag | ErrorType | null>
}