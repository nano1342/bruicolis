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
exports.PgAlbumRepository = void 0;
const Errors = __importStar(require("../../Utils/Errors"));
const ResponseBody_1 = require("../../Utils/ResponseBody");
class PgAlbumRepository {
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
        let albums = await this.prisma.album.findMany(sqlOptions);
        return albums.map((album) => {
            return {
                id: album.id,
                name: album.name,
                release_date: album.releaseDate
            };
        });
    }
    async selectPage(skip, take, filters) {
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
        let albums = await this.prisma.album.findMany(sqlOptions);
        return albums.map((album) => {
            return {
                id: album.id,
                name: album.name,
                release_date: album.releaseDate
            };
        });
    }
    async selectTagsAll(albumId) {
        let tags = await this.prisma.tag.findMany({
            where: {
                TagLink: {
                    some: {
                        idAlbum: albumId
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
    async insertTagLink(albumId, tagId) {
        try {
            let newTagLink = await this.prisma.tagLink.create({
                data: {
                    idTag: tagId,
                    idSong: undefined,
                    idAlbum: albumId,
                    idArtist: undefined,
                }
            });
        }
        catch (error) {
            return ResponseBody_1.ResponseBody.getResponseBodyFail("Something went wrong. Tag not added.", Errors.getErrorBodyDefault(Errors.ErrorType.SERVER_ERROR));
        }
        return ResponseBody_1.ResponseBody.getResponseBodyOk("Tag successfully added to the album.");
    }
    async selectOneById(albumId) {
        let album = await this.prisma.album.findUnique({ where: {
                id: albumId,
            },
        });
        if (album == null) {
            return null;
        }
        ;
        return {
            id: album.id,
            name: album.name,
            release_date: album.releaseDate
        };
    }
    async selectSongsAll(albumId) {
        let songs = await this.prisma.song.findMany({
            where: {
                songAlbumLinks: {
                    some: {
                        albumId: albumId,
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
    async insertSongLink(albumId, songId) {
        let newSongAlbumLink;
        try {
            newSongAlbumLink = await this.prisma.songAlbumLink.create({
                data: {
                    albumId: albumId,
                    songId: songId
                }
            });
        }
        catch (PrismaClientKnownRequestError) {
            return ResponseBody_1.ResponseBody.getResponseBodyFail("Something went wrong.", Errors.getErrorBodyDefault(Errors.ErrorType.FOREIGN_KEY_NOT_FOUND));
        }
        const respBody = ResponseBody_1.ResponseBody.getResponseBodyOkWithObject("Song successfully added to the album.", newSongAlbumLink);
        return respBody;
    }
    async insertAlbum(albumToInsert, artistd) {
        let newAlbum = await this.prisma.album.create({
            data: {
                name: albumToInsert.name,
                releaseDate: new Date(albumToInsert.release_date).toISOString()
            }
        });
        try {
            let newArtistAlbumLink = await this.prisma.artistAlbumLink.create({
                data: {
                    albumId: newAlbum.id,
                    artistId: artistd
                }
            });
        }
        catch (PrismaClientKnownRequestError) {
            return Errors.ErrorType.FOREIGN_KEY_NOT_FOUND;
        }
        let newAlbumToReturn = {
            id: newAlbum.id,
            name: newAlbum.name,
            release_date: newAlbum.releaseDate
        };
        return newAlbumToReturn;
    }
}
exports.PgAlbumRepository = PgAlbumRepository;
