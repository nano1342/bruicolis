import { Song } from "../Domains/Models/Song";
import { SongRepository } from "../Domains/repositories/songRepository";
import * as Errors from "../Utils/Errors";

//potentiellement renommer en service
export class GetSongsService {

    constructor(private readonly songRepository:SongRepository) {
        
    }

    getAll() {
        return this.songRepository.selectAll();
    }

    getPage(page: number, limit: number) {
        try {
            if (Number.isNaN(page) || Number.isNaN(limit) || page < 1) {
                return Errors.ErrorType.INCORRECT_PARAMETER;
            }
            return this.songRepository.selectPage((page-1)*limit, limit)
        } catch (error) {
            return Errors.ErrorType.INCORRECT_PARAMETER;
        }
    }

    getOneById(songId: number) {
        //vérifications préalables avant requête

        return this.songRepository.selectOneById(songId);
    }

    addSong(songToInsert: Song, artistd: number) {
        //vérifications préalables avant requête

        return this.songRepository.insertSong(songToInsert, artistd);
    }

    addTag(songId: number, tagId: number) {
        //vérifications préalables avant requête

        return this.songRepository.insertTag(songId, tagId);
    }
    
}