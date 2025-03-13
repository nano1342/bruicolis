import { Song } from "../Models/Song";
import { ErrorType } from "../../Utils/Errors";
import { ResponseBody } from "../../Utils/ResponseBody";

export interface SongRepository {
    
    selectAll() :Promise<Song[]>
    
    selectPage(skip: number, take: number) :Promise<Song[]>
    
    selectOneById(songId: number) :Promise<Song | null>
    
    insertSong(songToInsertbis: Song, artistd: number) :Promise<Song | ErrorType | null>
    
    insertTag(songId: number, tagId: number) :Promise<ResponseBody>
}