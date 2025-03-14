import { Artist } from "../Domains/Models/Artist";
import { ArtistRepository } from "../Domains/repositories/artistRepository";
import * as Errors from "../Utils/Errors";

//potentiellement renommer en service
export class GetArtistsService {

    constructor(private readonly artistRepository:ArtistRepository) {
        
    }

    getAll() {
        return this.artistRepository.selectAll();
    }

    getPage(page: number, limit: number) {
        try {
            if (Number.isNaN(page) || Number.isNaN(limit) || page < 1) {
                return Errors.ErrorType.INCORRECT_PARAMETER;
            }
            return this.artistRepository.selectPage((page-1)*limit, limit)
        } catch (error) {
            return Errors.ErrorType.INCORRECT_PARAMETER;
        }
    }

    getSongs(artistId: number) {
        return this.artistRepository.selectSongsAll(artistId);
    }

    getAlbums(artistId: number) {
        return this.artistRepository.selectAlbumsAll(artistId);
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