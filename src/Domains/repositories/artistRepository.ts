import { Artist } from "../Models/Artist";

export interface ArtistRepository {
    
    getAll() :Promise<Artist[]>
    //Post...
    //Get unique...
    //a modif dans pgArtistRepo aussi
}