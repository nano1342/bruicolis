import { Song } from "../Models/Song";
import { ErrorType } from "../../Utils/Errors";
import { ResponseBody } from "../../Utils/ResponseBody";

export interface SongRepository {
    
    selectAll(filters: object) :Promise<ResponseBody>
    
    selectPage(skip: number, take: number, filters: object) :Promise<Song[]>
    
    selectOneById(songId: number) :Promise<Song | null>
    
    insertSong(songToInsertbis: Song, artistd: number) :Promise<Song | ErrorType | null>
    
    insertTagLink(songId: number, tagId: number) :Promise<ResponseBody>
    
    selectTags(songId: number) :Promise<ResponseBody>
}