import { Artist, PrismaClient } from "@prisma/client";
import { ArtistRepository } from "../../Domains/repositories/artistRepository";

export class PgArtistRepository implements ArtistRepository {
    
    constructor(private readonly prisma: PrismaClient) {
        
    }

    async selectAll(): Promise<Artist[]> {
        let artists = await this.prisma.artist.findMany();
        
        return artists.map((artist) => {
            return {
                id: artist.id,
                name: artist.name,
                musicbrainzId: artist.musicbrainzId,
            }
        })
    }

    async selectPage(skip: number, take: number): Promise<Artist[]> {
        const options = {
            skip: skip,
            take: take
        }

        let artists = await this.prisma.artist.findMany(options);

        return artists.map((artist) => {
            return {
                id: artist.id,
                name: artist.name,
                musicbrainzId: artist.musicbrainzId,
            }
        })
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