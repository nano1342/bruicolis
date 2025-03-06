import { Artist } from "../Domains/Models/Artist";
import { ArtistRepository } from "../Domains/repositories/artistRepository";

//potentiellement renommer en service
export class GetArtistsService {

    constructor(private readonly artistRepository:ArtistRepository) {
        
    }

    //execute ne sera pas le bon nom dans le cas ou on fait des vérifs supplémentaires dans execute
    getAll() {
        //vérifications préalables avant requête

        return this.artistRepository.selectAll();
    }

    //execute ne sera pas le bon nom dans le cas ou on fait des vérifs supplémentaires dans execute
    getOneById(artistId: number) {
        //vérifications préalables avant requête

        return this.artistRepository.selectOneById(artistId);
    }

    //execute ne sera pas le bon nom dans le cas ou on fait des vérifs supplémentaires dans execute
    addArtist(artistToInsert: Artist) {
        //vérifications préalables avant requête

        return this.artistRepository.insertArtist(artistToInsert);
    }
    
}