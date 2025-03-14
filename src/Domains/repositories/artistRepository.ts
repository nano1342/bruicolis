import { Artist } from "../Models/Artist";
import { Song } from "../Models/Song";
import { Album } from "../Models/Album";

export interface ArtistRepository {
    
    selectAll() :Promise<Artist[]>
    
    selectPage(skip: number, take: number) :Promise<Artist[]>
    
    selectSongsAll(artistId: number) :Promise<Song[]>

    selectAlbumsAll(artistId: number) :Promise<Album[]>
    
    selectOneById(artistId: number) :Promise<Artist | null>

    findArtistByMusicBrainzId(artistId: number) :Promise<Artist | null>
    
    insertArtist(artistToInsert: Artist) :Promise<Artist | null>
}