import { PrismaClient } from "@prisma/client";
import { ArtistRepository } from "../../Domains/repositories/artistRepository";

export class PgArtistRepository implements ArtistRepository {
    
    constructor(private readonly prisma: PrismaClient) {
        
    }

    async getAll() {
        let artists = await this.prisma.artist.findMany();
        console.log("ArtistRepository.getAll() called");
        
        return artists.map((artist) => {
            return {
                id: artist.id,
                name: artist.name
            }
        })
    }
}