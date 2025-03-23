import { Song } from "../Domains/Models/Song";
import { SongRepository } from "../Domains/repositories/songRepository";
import { TagRepository } from "../Domains/repositories/tagRepository";
import * as Errors from "../Utils/Errors";
import { ResponseBody } from "../Utils/ResponseBody";

//potentiellement renommer en service
export class GetSongsService {

    constructor(private readonly songRepository:SongRepository, private readonly tagRepository:TagRepository) {
        
    }

    getAll(filters: object) {
        return this.songRepository.selectAll(filters);
    }

    getPage(page: number, limit: number, filters: object) {
        try {
            if (Number.isNaN(page) || Number.isNaN(limit) || page < 1) {
                return Errors.ErrorType.INCORRECT_PARAMETER;
            }
            return this.songRepository.selectPage((page-1)*limit, limit, filters)
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

    async addSongWithMultipleArtists(songToInsert: Song, artistIds: number[]) {
        if (artistIds.length < 1) {
            throw new Errors.IncorrectParameterError("at least one artist ID is required.");
        }
        let songs: (Song | Errors.ErrorType | null)[] = [];
        for (const id of artistIds) {
            //FIXME imports the same song multiple times
            songs.push(await this.addSong(songToInsert, id));
        }
        return songs;
    }

    async addTag(songId: number, tagId: number) {
        
        //checking if the tag ID is correct
        const tag = await this.tagRepository.selectOneById(tagId);
        if (tag == null) {
            return ResponseBody.getResponseBodyFail(
                "The provided tag ID doesn't exist.",
                Errors.getErrorBodyDefault(Errors.ErrorType.INCORRECT_BODY_PARAMETER)
            );
        }
    
        //checking if the song already has that tag
        const checkResp = await this.songRepository.selectTags(songId);
        if (checkResp.returnObject == null) {
            return ResponseBody.getResponseBodyFailDefault();
        } else {
            const tags = checkResp.returnObject as Array<{ id: number }>;
            const existingTag = tags.find(tag => tag.id === tagId);
            
            if (existingTag) {
                return ResponseBody.getResponseBodyOk("Tag was already attributed to this song. Nothing was modified.");
            }
        }
        
        //adding the tag
        return this.songRepository.insertTagLink(songId, tagId);
    }
    

    async getTags(songId: number) {
        //vérifications préalables avant requête

        const song = await this.songRepository.selectOneById(songId);
        
        if (song == null) {
            return ResponseBody.getResponseBodyFail("The provided ID doesn't correspond to any song.", Errors.getErrorBodyDefault(Errors.ErrorType.NOT_FOUND));
        }

        return this.songRepository.selectTags(songId);
    }
    
}