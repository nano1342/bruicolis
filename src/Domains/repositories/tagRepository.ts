import { Tag } from "../Models/Tag";
import { Song } from "../Models/Song";
import { Album } from "../Models/Album";
import { Artist } from "../Models/Artist";
import { ErrorType } from "../../Utils/Errors";

export interface TagRepository {
    
    selectAll() :Promise<Tag[]>
    
    selectPage(skip: number, take: number) :Promise<Tag[]>
    
    selectOneById(tagId: number) :Promise<Tag | null>
    
    selectTagSongs(tagId: number) :Promise<Song[]>
    
    selectTagArtists(tagId: number) :Promise<Artist[]>
    
    selectTagAlbums(tagId: number) :Promise<Album[]>
    
    insertTag(tagToInsert: Tag) :Promise<Tag | ErrorType | null>
}