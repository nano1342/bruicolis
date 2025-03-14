import { Album } from "../Models/Album";
import { Song } from "../Models/Song";
import { ErrorType } from "../../Utils/Errors";
import { ResponseBody } from "../../Utils/ResponseBody";
import { Tag } from "../Models/Tag";

export interface AlbumRepository {
    
    selectAll() :Promise<Album[]>
    
    selectPage(skip: number, take: number) :Promise<Album[]>
    
    selectOneById(albumId: number) :Promise<Album | null>
    
    selectSongsAll(albumId: number) :Promise<Song[]>
    
    insertSongLink(albumId: number, songId: number) :Promise<ResponseBody>

    insertAlbum(albumToInsert: Album, artistd: number) :Promise<Album | ErrorType | null>
    
    selectTagsAll(albumId: number) :Promise<Tag[]>

    insertTagLink(albumId: number, tagId: number) :Promise<ResponseBody>
}