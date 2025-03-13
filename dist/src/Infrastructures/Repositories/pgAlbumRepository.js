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
class PgAlbumRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async selectAll() {
        let albums = await this.prisma.album.findMany();
        return albums.map((album) => {
            return {
                id: album.id,
                name: album.name,
                release_date: album.releaseDate
            };
        });
    }
    async selectPage(skip, take) {
        const options = {
            skip: skip,
            take: take
        };
        let albums = await this.prisma.album.findMany(options);
        return albums.map((album) => {
            return {
                id: album.id,
                name: album.name,
                release_date: album.releaseDate
            };
        });
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
