"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PgArtistRepository = void 0;
const Errors = __importStar(require("../../Utils/Errors"));
const ResponseBody_1 = require("../../Utils/ResponseBody");
class PgArtistRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async selectAll(filters) {
        let sqlOptions = {
            where: {
                AND: []
            }
        };
        if (filters != null) {
            if ('tagsOR' in filters && filters['tagsOR'].length > 0) {
                const tags = filters['tagsOR'];
                sqlOptions.where.AND.push({ TagLink: { some: { idTag: { in: tags } } } });
            }
            if ('tagsAND' in filters && filters['tagsAND'].length > 0) {
                const tags = filters['tagsAND'];
                let obj = { AND: [] };
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
        const artists = await this.prisma.artist.findMany(sqlOptions);
        return artists.map((artist) => {
            return {
                id: artist.id,
                name: artist.name,
                musicbrainzId: artist.musicbrainzId,
            };
        });
    }
    async selectPage(skip, take, filters) {
        let sqlOptions = {
            skip: skip,
            take: take,
            where: {
                AND: []
            }
        };
        if (filters != null) {
            if ('tagsOR' in filters && filters['tagsOR'].length > 0) {
                const tags = filters['tagsOR'];
                sqlOptions.where.AND.push({ TagLink: { some: { idTag: { in: tags } } } });
            }
            if ('tagsAND' in filters && filters['tagsAND'].length > 0) {
                const tags = filters['tagsAND'];
                let obj = { AND: [] };
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
        let artists = await this.prisma.artist.findMany(sqlOptions);
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
    async selectTagsAll(artistId) {
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
                label: tag.label,
                musicbrainzId: tag.musicbrainzId,
            };
        });
    }
    async insertTagLink(artistId, tagId) {
        try {
            let newTagLink = await this.prisma.tagLink.create({
                data: {
                    idTag: tagId,
                    idSong: undefined,
                    idAlbum: undefined,
                    idArtist: artistId,
                }
            });
        }
        catch (error) {
            return ResponseBody_1.ResponseBody.getResponseBodyFail("Something went wrong. Tag not added.", Errors.getErrorBodyDefault(Errors.ErrorType.SERVER_ERROR));
        }
        return ResponseBody_1.ResponseBody.getResponseBodyOk("Tag successfully added to the artist.");
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
