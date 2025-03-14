import { Album, Artist, PrismaClient } from "@prisma/client";
import { ArtistRepository } from "../../Domains/repositories/artistRepository";
import { Song } from "../../Domains/Models/Song";

export class PgArtistRepository implements ArtistRepository {
    
    constructor(private readonly prisma: PrismaClient) {
        
    }

    async selectAll() {
        let artists = await this.prisma.artist.findMany();
        
        return artists.map((artist) => {
            return {
                id: artist.id,
                name: artist.name
            }
        })
    }

    async selectPage(skip: number, take: number) {
        const options = {
            skip: skip,
            take: take
        }

        let artists = await this.prisma.artist.findMany(options);

        return artists.map((artist) => {
            return {
                id: artist.id,
                name: artist.name
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
    

    async selectOneById(artistId: number) {
        let artist = await this.prisma.artist.findUnique({where: {
            id: artistId,
          },
        });
        
        if (artist == null) {
            return null;
        };

        return {
            id: artist.id,
            name: artist.name
        }
    }

    async insertArtist(artistToInsert: Artist) {
        let newArtist: Artist = await this.prisma.artist.create({
            data: {
              name: artistToInsert.name
            }
          });

        return newArtist;
    }

    
}