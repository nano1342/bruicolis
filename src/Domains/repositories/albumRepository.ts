import { Album } from "../Models/Album";
import { Song } from "../Models/Song";
import { ErrorType } from "../../Utils/Errors";

export interface AlbumRepository {
    
    selectAll() :Promise<Album[]>
    
    selectPage(skip: number, take: number) :Promise<Album[]>
    
    selectOneById(albumId: number) :Promise<Album | null>
    
    selectSongsAll(albumId: number) :Promise<Song[]>

    insertAlbum(albumToInsert: Album, artistd: number) :Promise<Album | ErrorType | null>
}