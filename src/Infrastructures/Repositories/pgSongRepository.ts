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

                const existingTags = await this.prisma.tag.findMany({
                    where: {
                        id: { in: tags }
                    },
                    select: { id: true } // On récupère juste l'ID
                });

                const existingTagIds = existingTags.map(tag => tag.id);
                const missingTags = tags.filter(tagId => !existingTagIds.includes(tagId));

                if (missingTags.length > 0) {
                    return ResponseBody.getResponseBodyFail("", Errors.getErrorBodyDefault(Errors.ErrorType.FOREIGN_KEY_NOT_FOUND));
                }
                
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
        
        const songsReturn = songs.map((song) => {
            return {
                id: song.id,
                name: song.name,
                release_date: song.releaseDate
            }
        })

        return ResponseBody.getResponseBodyOkWithObject(songsReturn.length + " songs found", songsReturn);
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
                    { TagLink: {
                        some: { idTag: { in: tags } } }
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
        let date: Date;

        // On récupère la date sous forme de string si besoin
        let dateStr: string;
        if (typeof songToInsert.release_date === 'string') {
            dateStr = songToInsert.release_date;
        } else if (songToInsert.release_date instanceof Date) {
            // On génère une string au format YYYY-MM-DD à partir de l'objet Date
            dateStr = songToInsert.release_date.toISOString().split('T')[0];
        } else {
            return Errors.ErrorType.INCORRECT_BODY_PARAMETER;
        }
    
        // Vérification du format : YYYY-MM-DD
        const parts = dateStr.split('-');
        if (parts.length !== 3) {
            return Errors.ErrorType.INCORRECT_BODY_PARAMETER;
        }
    
        const [year, month, day] = parts.map(Number);
    
        // Vérification des composants numériques de la date
        if (
            isNaN(year) || isNaN(month) || isNaN(day) ||
            month < 1 || month > 12 || day < 1 || day > 31
        ) {
            return Errors.ErrorType.INCORRECT_BODY_PARAMETER;
        }
    
        // Création de l'objet Date et validation finale
        date = new Date(dateStr);
    
        if (isNaN(date.getTime())) {
            return Errors.ErrorType.INCORRECT_BODY_PARAMETER;
        }
    
        // Double check que la date correspond à la string d'entrée
        const isoDatePart = date.toISOString().split('T')[0];
        if (isoDatePart !== dateStr) {
            return Errors.ErrorType.INCORRECT_BODY_PARAMETER;
        }
    
        console.log(date.toISOString());
    
        // Insère la chanson dans la BDD
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