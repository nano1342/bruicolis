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

    //execute ne sera pas le bon nom dans le cas ou on fait des vérifs supplémentaires dans execute
    getOneById(songId: number) {
        //vérifications préalables avant requête

        return this.songRepository.selectOneById(songId);
    }

    //execute ne sera pas le bon nom dans le cas ou on fait des vérifs supplémentaires dans execute
    addSong(songToInsert: Song, artistd: number) {
        //vérifications préalables avant requête

        return this.songRepository.insertSong(songToInsert, artistd);
    }

    async addSongWithMultipleArtists(songToInsert: Song, artistIds: number[]) {
        if (artistIds.length < 1) {
            throw new Errors.IncorrectParameterError("at least one artist ID is required.");
        }
        let songs: (Song | Errors.ErrorType | null)[] = [];
        for (const id of artistIds) {
            songs.push(await this.addSong(songToInsert, id));
        }
        return songs;
    }
    
}