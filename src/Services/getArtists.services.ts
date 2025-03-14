import { Artist } from "../Domains/Models/Artist";
import { ArtistRepository } from "../Domains/repositories/artistRepository";
import { TagRepository } from "../Domains/repositories/tagRepository";
import * as Errors from "../Utils/Errors";
import { ResponseBody } from "../Utils/ResponseBody";

//potentiellement renommer en service
export class GetArtistsService {

    constructor(private readonly artistRepository:ArtistRepository, private readonly tagRepository:TagRepository) {
        
    }

    getAll(filters: object) {
        return this.artistRepository.selectAll(filters);
    }

    getPage(page: number, limit: number, filters: object) {
        try {
            if (Number.isNaN(page) || Number.isNaN(limit) || page < 1) {
                return Errors.ErrorType.INCORRECT_PARAMETER;
            }
            return this.artistRepository.selectPage((page-1)*limit, limit, filters)
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

    getTags(artistId: number) {
        return this.artistRepository.selectTagsAll(artistId);
    }

    async addTag(artistId: number, tagId: number) {
            
        //checking if the tag ID is correct
        const tag = await this.tagRepository.selectOneById(tagId);
        if (tag == null) {
            return ResponseBody.getResponseBodyFail(
                "The provided tag ID doesn't exist.",
                Errors.getErrorBodyDefault(Errors.ErrorType.INCORRECT_BODY_PARAMETER)
            );
        }
    
        //checking if the song already has that tag
        const tags = await this.artistRepository.selectTagsAll(artistId);
        if (tags == null) {
            return ResponseBody.getResponseBodyFailDefault();
        } else {
            const existingTag = tags.find(tag => tag.id === tagId);
            
            if (existingTag) {
                return ResponseBody.getResponseBodyOk("Tag was already attributed to this artist. Nothing was modified.");
            }
        }
        return this.artistRepository.insertTagLink(artistId, tagId);
    }

    //execute ne sera pas le bon nom dans le cas ou on fait des vérifs supplémentaires dans execute
    getOneById(artistId: number) {
        //vérifications préalables avant requête

        return this.artistRepository.selectOneById(artistId);
    }

    findArtistIdByMusicBrainzId(artistId: number) {
        return this.artistRepository.findArtistByMusicBrainzId(artistId);
    }

    //execute ne sera pas le bon nom dans le cas ou on fait des vérifs supplémentaires dans execute
    addArtist(artistToInsert: Artist) {
        //vérifications préalables avant requête

        return this.artistRepository.insertArtist(artistToInsert);
    }
    
}