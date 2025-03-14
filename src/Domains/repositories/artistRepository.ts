import { Artist } from "../Models/Artist";
import { Song } from "../Models/Song";
import { Album } from "../Models/Album";
import { Tag } from "../Models/Tag";
import { ResponseBody } from "../../Utils/ResponseBody";

export interface ArtistRepository {
    
    selectAll(filters: object) :Promise<Artist[]>
    
    selectPage(skip: number, take: number, filters: object) :Promise<Artist[]>
    
    selectSongsAll(artistId: number) :Promise<Song[]>

    selectAlbumsAll(artistId: number) :Promise<Album[]>

    selectTagsAll(artistId: number) :Promise<Tag[]>

    insertTagLink(artistId: number, tagId: number) :Promise<ResponseBody>
    
    selectOneById(artistId: number) :Promise<Artist | null>

    findArtistByMusicBrainzId(artistId: number) :Promise<Artist | null>
    
    insertArtist(artistToInsert: Artist) :Promise<Artist | null>
}