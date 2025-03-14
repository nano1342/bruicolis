import { Song } from "@prisma/client";
import { Album } from "../Domains/Models/Album";
import { AlbumRepository } from "../Domains/repositories/albumRepository";
import * as Errors from "../Utils/Errors";
import { ResponseBody } from "../Utils/ResponseBody";
import { TagRepository } from "../Domains/repositories/tagRepository";

export class AlbumsService {

    constructor(private readonly albumRepository:AlbumRepository, private readonly tagRepository:TagRepository) {
        
    }

    getAll(filters: object) {
        return this.albumRepository.selectAll(filters);
    }

    getPage(page: number, limit: number, filters: object) {
        try {
            if (Number.isNaN(page) || Number.isNaN(limit) || page < 1) {
                return Errors.ErrorType.INCORRECT_BODY_PARAMETER;
            }
            return this.albumRepository.selectPage((page-1)*limit, limit, filters)
        } catch (error) {
            return Errors.ErrorType.INCORRECT_PARAMETER;
        }
    }

    getOneById(albumId: number) {
        //vérifications préalables avant requête

        return this.albumRepository.selectOneById(albumId);
    }

    getSongsAll(albumId: number) {
        //vérifications préalables avant requête

        return this.albumRepository.selectSongsAll(albumId);
    }

    async addSong(albumId: number, songId: number) {
        //vérifications préalables avant requête

        const albumSongs = await this.albumRepository.selectSongsAll(albumId);
        for (const song of albumSongs) {
            if (song.id == songId) {
                return ResponseBody.getResponseBodyFail("Song already in album.", Errors.getErrorBodyDefault(Errors.ErrorType.INCORRECT_BODY_PARAMETER))
            }
        }

        return this.albumRepository.insertSongLink(albumId, songId);
    }

    addAlbum(albumToInsert: Album, artistId: number) {
        //vérifications préalables avant requête

        return this.albumRepository.insertAlbum(albumToInsert, artistId);
    }

    async addAlbumWithMultipleArtists(albumToInsert: Album, artistIds: number[]) {
        if (artistIds.length < 1) {
            throw new Errors.IncorrectParameterError("at least one artist ID is required.");
        }
        let albums: (Album | Errors.ErrorType | null)[] = [];
        for (const id of artistIds) {
            albums.push(await this.addAlbum(albumToInsert, id));
        }
        return albums;
    }

    getTags(albumId: number) {
        return this.albumRepository.selectTagsAll(albumId);
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
        const tags = await this.albumRepository.selectTagsAll(artistId);
        if (tags == null) {
            return ResponseBody.getResponseBodyFailDefault();
        } else {
            const existingTag = tags.find(tag => tag.id === tagId);
            
            if (existingTag) {
                return ResponseBody.getResponseBodyOk("Tag was already attributed to this album. Nothing was modified.");
            }
        }
        return this.albumRepository.insertTagLink(artistId, tagId);
    }
}