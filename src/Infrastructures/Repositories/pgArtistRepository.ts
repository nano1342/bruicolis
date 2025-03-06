import { Artist, PrismaClient } from "@prisma/client";
import { ArtistRepository } from "../../Domains/repositories/artistRepository";

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
        console.log("post envoi", artistToInsert);
        let newArtist: Artist = await this.prisma.artist.create({
            data: {
              name: artistToInsert.name
            }
          });

        return newArtist;
    }

    
}