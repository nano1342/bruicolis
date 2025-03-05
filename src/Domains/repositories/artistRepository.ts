import { Artist } from "../Models/Artist";

export interface ArtistRepository {
    
    selectAll() :Promise<Artist[]>
    //Post...
    //Get unique...
    //a modif dans pgArtistRepo aussi
    
    selectOneById(artistId: number) :Promise<Artist | null>
}