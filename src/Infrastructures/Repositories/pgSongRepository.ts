import { Song, PrismaClient, SongArtistLink, TagLink } from "@prisma/client";
import { Song as SongModel } from "../../Domains/Models/Song";
import { SongRepository } from "../../Domains/repositories/songRepository";
import * as Errors from "../../Utils/Errors";
import { ResponseBody } from "../../Utils/ResponseBody";
import * as util from "util"

//TODO ajouter objet de lien SongArtistLink
export class PgSongRepository implements SongRepository {
    
    constructor(private readonly prisma: PrismaClient) {
        
    }

    async selectAll(filters: object) {
        let songs;
        let sqlOptions: { [key: string]: any } = {
            where: {
                AND: []
            }
        };
        if (filters != null) {
            if ('tagsOR' in filters && (filters['tagsOR'] as []).length > 0) {
                const tags = filters['tagsOR'] as [];
                sqlOptions.where.AND.push(
                    {
                        TagLink: {
                            some: {
                                idTag: { in: tags }
                            }
                        }
                    }
                );
            }

            if ('tagsAND' in filters && (filters['tagsAND'] as []).length > 0) {
                const tags = filters['tagsAND'] as [];
                let obj: { [key: string]: any } = { AND: [] };
                for (let tag of tags) {
                    obj.AND.push({ TagLink: { some: { idTag: tag } } })
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

        songs = await this.prisma.song.findMany(sqlOptions as object);
        
        return songs.map((song) => {
            return {
                id: song.id,
                name: song.name,
                release_date: song.releaseDate
            }
        })
    }

    async selectPage(skip: number, take: number, filters: object) {
        let songs;
        const sqlOptions: { [key: string]: any } = {
            skip: skip,
            take: take
        }

        if (filters != null) {
            sqlOptions.where = { AND: [] }

            if ('tagsOR' in filters && (filters['tagsOR'] as []).length > 0) {
                const tags = filters['tagsOR'] as [];
                sqlOptions.where.AND.push(
                    {
                        TagLink: {
                            some: {
                                idTag: { in: tags }
                            }
                        }
                    }
                );
            }

            if ('tagsAND' in filters && (filters['tagsAND'] as []).length > 0) {
                const tags = filters['tagsAND'] as [];
                let obj: { [key: string]: any } = { AND: [] };
                for (let tag of tags) {
                    obj.AND.push({ TagLink: { some: { idTag: tag } } })
                }

                sqlOptions.where.AND.push(obj);
            }

            if ('text_query' in filters) {
                sqlOptions.where.AND.push({ name: { contains: filters['text_query'] } });
            }

            console.log(util.inspect(sqlOptions, {showHidden: false, depth: null, colors: true}))
            songs = await this.prisma.song.findMany(sqlOptions as object);

        }

        songs = await this.prisma.song.findMany(sqlOptions as object);

        return songs.map((song) => {
            return {
                id: song.id,
                name: song.name,
                release_date: song.releaseDate
            }
        })
    }

    async selectOneById(songId: number) {
        let song = await this.prisma.song.findUnique({where: {
            id: songId,
          },
        });
        
        if (song == null) {
            return null;
        };

        return {
            id: song.id,
            name: song.name,
            release_date: song.releaseDate
        }
    }

    async insertSong(songToInsert: SongModel, artistd: number) {
        let date :Date;
        if (typeof songToInsert.release_date == 'string') {
            date = new Date(songToInsert.release_date);
        } else {
            date = songToInsert.release_date;
        }
        
        let newSong: Song = await this.prisma.song.create({
            data: {
              name: songToInsert.name,
              releaseDate: date.toISOString()
            }
        });

        try {
            let newSongArtistLink: SongArtistLink = await this.prisma.songArtistLink.create({
                data: {
                    songId: newSong.id,
                    artistId: artistd
                }
            });
        } catch (PrismaClientKnownRequestError) {
            return Errors.ErrorType.FOREIGN_KEY_NOT_FOUND;
        }

        let newSongToReturn: SongModel = {
            id: newSong.id,
            name: newSong.name,
            release_date: newSong.releaseDate
        }

        return newSongToReturn;
    }

    /**
     * Adds a tag to the song.
     * @param songId 
     * @param tagId 
     * @returns {ResponseBody}
     */
    async insertTagLink(songId: number, tagId: number) {
        try {
            let newTagLink: TagLink = await this.prisma.tagLink.create({
                data: {
                    idTag: tagId,
                    idSong: songId,
                    idAlbum: undefined,
                    idArtist: undefined,
                }
            });
        } catch (error) {
            return ResponseBody.getResponseBodyFail("Something went wrong. Tag not added.", Errors.getErrorBodyDefault(Errors.ErrorType.SERVER_ERROR));
        }

        return ResponseBody.getResponseBodyOk("Tag successfully added to the song.");
    }
    
    
    async selectTags(songId: number) {
        let results = await this.prisma.tag.findMany({
            where: {
                TagLink: {
                    some: {
                        idSong: songId
                    },
                },
            },
        });

        const foundTags = results.map((tag) => {
            return {
                id: tag.id,
                label: tag.label,
            }
        })

        return ResponseBody.getResponseBodyOkWithObject(foundTags.length + " tags found.", foundTags);
    }

}