import { Album, PrismaClient, ArtistAlbumLink, SongAlbumLink, TagLink } from "@prisma/client";
import { Album as AlbumModel } from "../../Domains/Models/Album";
import { AlbumRepository } from "../../Domains/repositories/albumRepository";
import * as Errors from "../../Utils/Errors";
import { ResponseBody } from "../../Utils/ResponseBody";
import * as util from 'util';

export class PgAlbumRepository implements AlbumRepository {
    
    constructor(private readonly prisma: PrismaClient) {
        
    }

    async selectAll(filters: object) {
        let sqlOptions: { [key: string]: any } = {
            where: {
                AND: []
            }
        };
        if (filters != null) {
            if ('tagsOR' in filters && (filters['tagsOR'] as []).length > 0) {
                const tags = filters['tagsOR'] as [];
                sqlOptions.where.AND.push({ TagLink: { some: { idTag: { in: tags } } } });
            }

            if ('tagsAND' in filters && (filters['tagsAND'] as []).length > 0) {
                const tags = filters['tagsAND'] as [];
                let obj: { [key: string]: any } = { AND: [] };
                for (let tag of tags) {
                    obj.AND.push({ TagLink: { some: { idTag: tag } } });
                }

                sqlOptions.where.AND.push(obj);
            }

            if ('text_query' in filters) {
                sqlOptions.where.AND.push({ name: { 
                    contains: filters['text_query'],
                    mode: 'insensitive'
                } });
            }
        }

        let albums = await this.prisma.album.findMany(sqlOptions as object);
        
        return albums.map((album) => {
            return {
                id: album.id,
                name: album.name,
                release_date: album.releaseDate
            }
        })
    }

    async selectPage(skip: number, take: number, filters: object) {
        let sqlOptions: { [key: string]: any } = {
            where: {
                AND: []
            }
        };
        if (filters != null) {
            if ('tagsOR' in filters && (filters['tagsOR'] as []).length > 0) {
                const tags = filters['tagsOR'] as [];
                sqlOptions.where.AND.push({ TagLink: { some: { idTag: { in: tags } } } });
            }

            if ('tagsAND' in filters && (filters['tagsAND'] as []).length > 0) {
                const tags = filters['tagsAND'] as [];
                let obj: { [key: string]: any } = { AND: [] };
                for (let tag of tags) {
                    obj.AND.push({ TagLink: { some: { idTag: tag } } });
                }

                sqlOptions.where.AND.push(obj);
            }

            if ('text_query' in filters) {
                sqlOptions.where.AND.push({ name: { 
                    contains: filters['text_query'],
                    mode: 'insensitive'
                } });
            }
        }

        let albums = await this.prisma.album.findMany(sqlOptions as object);

        return albums.map((album) => {
            return {
                id: album.id,
                name: album.name,
                release_date: album.releaseDate
            }
        })
    }

    async selectTagsAll(albumId: number) {
        let tags = await this.prisma.tag.findMany({
            where: {
                TagLink: {
                    some: {
                        idAlbum: albumId
                    },
                },
            },
        });

        return tags.map((tag) => {
            return {
                id: tag.id,
                label: tag.label
            }
        })
    }
    
        async insertTagLink(albumId: number, tagId: number) {
                try {
                    let newTagLink: TagLink = await this.prisma.tagLink.create({
                        data: {
                            idTag: tagId,
                            idSong: undefined,
                            idAlbum: albumId,
                            idArtist: undefined,
                        }
                    });
                } catch (error) {
                    return ResponseBody.getResponseBodyFail("Something went wrong. Tag not added.", Errors.getErrorBodyDefault(Errors.ErrorType.SERVER_ERROR));
                }
        
                return ResponseBody.getResponseBodyOk("Tag successfully added to the album.");
        }

    async selectOneById(albumId: number) {
        let album = await this.prisma.album.findUnique({where: {
            id: albumId,
          },
        });
        
        if (album == null) {
            return null;
        };

        return {
            id: album.id,
            name: album.name,
            release_date: album.releaseDate
        }
    }

    async selectSongsAll(albumId: number) {
        let songs = await this.prisma.song.findMany({
            where: {
              songAlbumLinks: {
                some: {
                  albumId: albumId,
                },
              },
            },
          });

        return songs.map((song) => {
            return {
                id: song.id,
                name: song.name,
                release_date: song.releaseDate
            }
        })
    }

    async insertSongLink(albumId: number, songId: number) {

        let newSongAlbumLink: SongAlbumLink;

        try {
            newSongAlbumLink = await this.prisma.songAlbumLink.create({
                data: {
                    albumId: albumId,
                    songId: songId
                }
            });
        } catch (PrismaClientKnownRequestError) {
            return ResponseBody.getResponseBodyFail("Something went wrong.", Errors.getErrorBodyDefault(Errors.ErrorType.FOREIGN_KEY_NOT_FOUND));
        }
  
          const respBody = ResponseBody.getResponseBodyOkWithObject("Song successfully added to the album.", newSongAlbumLink);
          return respBody;
    }

    async insertAlbum(albumToInsert: AlbumModel, artistd: number) {
        let newAlbum: Album = await this.prisma.album.create({
            data: {
              name: albumToInsert.name,
              releaseDate: new Date(albumToInsert.release_date).toISOString()
            }
        });

        try {
            let newArtistAlbumLink: ArtistAlbumLink = await this.prisma.artistAlbumLink.create({
                data: {
                    albumId: newAlbum.id,
                    artistId: artistd
                }
            });
        } catch (PrismaClientKnownRequestError) {
            return Errors.ErrorType.FOREIGN_KEY_NOT_FOUND;
        }

        let newAlbumToReturn: AlbumModel = {
            id: newAlbum.id,
            name: newAlbum.name,
            release_date: newAlbum.releaseDate
        }

        return newAlbumToReturn;
    }
}