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
    async selectSongsAll(artistId) {
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
            };
        });
    }
    async selectAlbumsAll(artistId) {
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
