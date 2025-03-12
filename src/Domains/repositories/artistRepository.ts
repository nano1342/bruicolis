import { Artist } from "../Models/Artist";

export interface ArtistRepository {
    
    selectAll() :Promise<Artist[]>
    
    selectPage(skip: number, take: number) :Promise<Artist[]>
    
    selectOneById(artistId: number) :Promise<Artist | null>
    
    insertArtist(artistToInsert: Artist) :Promise<Artist | null>
}