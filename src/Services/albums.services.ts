import { Album } from "../Domains/Models/Album";
import { AlbumRepository } from "../Domains/repositories/albumRepository";
import * as Errors from "../Utils/Errors";

export class AlbumsService {

    constructor(private readonly albumRepository:AlbumRepository) {
        
    }

    getAll() {
        return this.albumRepository.selectAll();
    }

    getPage(page: number, limit: number) {
        try {
            if (Number.isNaN(page) || Number.isNaN(limit) || page < 1) {
                return Errors.ErrorType.INCORRECT_PARAMETER;
            }
            return this.albumRepository.selectPage((page-1)*limit, limit)
        } catch (error) {
            return Errors.ErrorType.INCORRECT_PARAMETER;
        }
    }

    //execute ne sera pas le bon nom dans le cas ou on fait des vérifs supplémentaires dans execute
    getOneById(albumId: number) {
        //vérifications préalables avant requête

        return this.albumRepository.selectOneById(albumId);
    }

    //execute ne sera pas le bon nom dans le cas ou on fait des vérifs supplémentaires dans execute
    getSongsAll(albumId: number) {
        //vérifications préalables avant requête

        return this.albumRepository.selectSongsAll(albumId);
    }

    //execute ne sera pas le bon nom dans le cas ou on fait des vérifs supplémentaires dans execute
    addAlbum(albumToInsert: Album, artistId: number) {
        //vérifications préalables avant requête

        return this.albumRepository.insertAlbum(albumToInsert, artistId);
    }
    
}