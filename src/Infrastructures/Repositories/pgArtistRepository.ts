import { Album, Artist, PrismaClient, TagLink } from "@prisma/client";
import { ArtistRepository } from "../../Domains/repositories/artistRepository";
import * as Errors from "../../Utils/Errors";
import { ResponseBody } from "../../Utils/ResponseBody";

export class PgArtistRepository implements ArtistRepository {
    
    constructor(private readonly prisma: PrismaClient) {
        
    }

    async selectAll(filters: object): Promise<Artist[]> {
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

        
        const artists = await this.prisma.artist.findMany(sqlOptions as object);
        
        return artists.map((artist) => {
            return {
                id: artist.id,
                name: artist.name,
                musicbrainzId: artist.musicbrainzId,
            }
        })
    }

    async selectPage(skip: number, take: number, filters: object): Promise<Artist[]> {
        let sqlOptions: { [key: string]: any } = {
            skip: skip,
            take: take,
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

        let artists = await this.prisma.artist.findMany(sqlOptions as object);

        return artists.map((artist) => {
            return {
                id: artist.id,
                name: artist.name,
                musicbrainzId: artist.musicbrainzId,
            }
        })
    }

    async selectSongsAll(artistId: number) {
        let songs = await this.prisma.song.findMany({
            where: {
                songArtistLinks: {
                    some: {
                        artistId: artistId
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

    async selectAlbumsAll(artistId: number) {
        let albums = await this.prisma.album.findMany({
            where: {
                artistAlbumLinks: {
                    some: {
                        artistId: artistId
                    },
                },
            },
        });

        return albums.map((album) => {
            return {
                id: album.id,
                name: album.name,
                release_date: album.releaseDate
            }
        })
    }

    async selectTagsAll(artistId: number) {
        let tags = await this.prisma.tag.findMany({
            where: {
                TagLink: {
                    some: {
                        idArtist: artistId
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

    async insertTagLink(artistId: number, tagId: number) {
            try {
                let newTagLink: TagLink = await this.prisma.tagLink.create({
                    data: {
                        idTag: tagId,
                        idSong: undefined,
                        idAlbum: undefined,
                        idArtist: artistId,
                    }
                });
            } catch (error) {
                return ResponseBody.getResponseBodyFail("Something went wrong. Tag not added.", Errors.getErrorBodyDefault(Errors.ErrorType.SERVER_ERROR));
            }
    
            return ResponseBody.getResponseBodyOk("Tag successfully added to the artist.");
    }
    

    async selectOneById(artistId: number): Promise<Artist | null> {
        let artist = await this.prisma.artist.findUnique({where: {
            id: artistId,
          },
        });
        
        if (artist == null) {
            return null;
        };

        return {
            id: artist.id,
            name: artist.name,
            musicbrainzId: artist.musicbrainzId,
        };
    }

    async findArtistByMusicBrainzId(artistId: number): Promise<Artist | null> {
        let artist = await this.prisma.artist.findFirst({where: {
            musicbrainzId: artistId,
          },
        });
        
        if (artist == null) {
            return null;
        };

        return {
            id: artist.id,
            name: artist.name,
            musicbrainzId: artist.musicbrainzId,
        };
    }

    async insertArtist(artistToInsert: Artist) {
        let newArtist: Artist = await this.prisma.artist.create({
            data: {
              name: artistToInsert.name,
              musicbrainzId: artistToInsert.musicbrainzId ?? undefined,
            }
          });

        return newArtist;
    }

    
}