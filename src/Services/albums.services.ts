import { Song } from "@prisma/client";
import { Album } from "../Domains/Models/Album";
import { AlbumRepository } from "../Domains/repositories/albumRepository";
import * as Errors from "../Utils/Errors";
import { ResponseBody } from "../Utils/ResponseBody";

export class AlbumsService {

    constructor(private readonly albumRepository:AlbumRepository) {
        
    }

    getAll() {
        return this.albumRepository.selectAll();
    }

    getPage(page: number, limit: number) {
        try {
            if (Number.isNaN(page) || Number.isNaN(limit) || page < 1) {
                return Errors.ErrorType.INCORRECT_BODY_PARAMETER;
            }
            return this.albumRepository.selectPage((page-1)*limit, limit)
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
    
}