"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PgArtistRepository = void 0;
class PgArtistRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async selectAll() {
        let artists = await this.prisma.artist.findMany();
        return artists.map((artist) => {
            return {
                id: artist.id,
                name: artist.name,
                musicbrainzId: artist.musicbrainzId,
            };
        });
    }
    async selectPage(skip, take) {
        const options = {
            skip: skip,
            take: take
        };
        let artists = await this.prisma.artist.findMany(options);
        return artists.map((artist) => {
            return {
                id: artist.id,
                name: artist.name,
                musicbrainzId: artist.musicbrainzId,
            };
        });
    }
    async selectOneById(artistId) {
        let artist = await this.prisma.artist.findUnique({ where: {
                id: artistId,
            },
        });
        if (artist == null) {
            return null;
        }
        ;
        return {
            id: artist.id,
            name: artist.name,
            musicbrainzId: artist.musicbrainzId,
        };
    }
    async findArtistByMusicBrainzId(artistId) {
        let artist = await this.prisma.artist.findFirst({ where: {
                musicbrainzId: artistId,
            },
        });
        if (artist == null) {
            return null;
        }
        ;
        return {
            id: artist.id,
            name: artist.name,
            musicbrainzId: artist.musicbrainzId,
        };
    }
    async insertArtist(artistToInsert) {
        let newArtist = await this.prisma.artist.create({
            data: {
                name: artistToInsert.name,
                musicbrainzId: artistToInsert.musicbrainzId ?? undefined,
            }
        });
        return newArtist;
    }
}
exports.PgArtistRepository = PgArtistRepository;
