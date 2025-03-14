"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PgTagRepository = void 0;
class PgTagRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async selectAll() {
        let tags = await this.prisma.tag.findMany();
        return tags.map((tag) => {
            return {
                id: tag.id,
                label: tag.label,
                musicbrainzId: tag.musicbrainzId
            };
        });
    }
    async selectPage(skip, take) {
        const options = {
            skip: skip,
            take: take
        };
        let tags = await this.prisma.tag.findMany(options);
        return tags.map((tag) => {
            return {
                id: tag.id,
                label: tag.label,
                musicbrainzId: tag.musicbrainzId,
            };
        });
    }
    async selectOneById(tagId) {
        let tag = await this.prisma.tag.findUnique({ where: {
                id: tagId,
            },
        });
        if (tag == null) {
            return null;
        }
        ;
        return {
            id: tag.id,
            label: tag.label,
            musicbrainzId: tag.musicbrainzId,
        };
    }
    async selectTagSongs(tagId) {
        let songs = await this.prisma.song.findMany({
            where: {
                TagLink: {
                    some: {
                        idTag: tagId,
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
    async selectTagArtists(tagId) {
        let artists = await this.prisma.artist.findMany({
            where: {
                TagLink: {
                    some: {
                        idTag: tagId,
                    },
                },
            },
        });
        return artists.map((artist) => {
            return {
                id: artist.id,
                name: artist.name,
                musicbrainzId: artist.musicbrainzId,
            };
        });
    }
    async selectTagAlbums(tagId) {
        let albums = await this.prisma.album.findMany({
            where: {
                TagLink: {
                    some: {
                        idTag: tagId,
                    },
                },
            },
        });
        return albums.map((album) => {
            return {
                id: album.id,
                name: album.name,
                release_date: album.releaseDate,
            };
        });
    }
    async insertTag(tagToInsert) {
        let newTag = await this.prisma.tag.create({
            data: {
                label: tagToInsert.label,
                musicbrainzId: tagToInsert.musicbrainzId
            }
        });
        let newTagToReturn = {
            id: newTag.id,
            label: newTag.label,
            musicbrainzId: newTag.musicbrainzId,
        };
        return newTagToReturn;
    }
}
exports.PgTagRepository = PgTagRepository;
