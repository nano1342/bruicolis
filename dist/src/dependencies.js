"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.albumController = exports.albumsService = exports.albumRepository = exports.songController = exports.getSongsService = exports.songRepository = exports.artistController = exports.getArtistsService = exports.artistRepository = void 0;
const client_1 = require("@prisma/client");
const artists_controller_1 = __importDefault(require("./Infrastructures/Controllers/artists.controller"));
const pgArtistRepository_1 = require("./Infrastructures/Repositories/pgArtistRepository");
const getArtists_services_1 = require("./Services/getArtists.services");
const songs_controller_1 = __importDefault(require("./Infrastructures/Controllers/songs.controller"));
const pgSongRepository_1 = require("./Infrastructures/Repositories/pgSongRepository");
const getSongs_services_1 = require("./Services/getSongs.services");
const albums_controller_1 = __importDefault(require("./Infrastructures/Controllers/albums.controller"));
const pgAlbumRepository_1 = require("./Infrastructures/Repositories/pgAlbumRepository");
const albums_services_1 = require("./Services/albums.services");
const prisma = new client_1.PrismaClient();
// Artists
exports.artistRepository = new pgArtistRepository_1.PgArtistRepository(prisma);
exports.getArtistsService = new getArtists_services_1.GetArtistsService(exports.artistRepository);
exports.artistController = new artists_controller_1.default(exports.getArtistsService);
// Songs
exports.songRepository = new pgSongRepository_1.PgSongRepository(prisma);
exports.getSongsService = new getSongs_services_1.GetSongsService(exports.songRepository);
exports.songController = new songs_controller_1.default(exports.getSongsService);
// Albums
exports.albumRepository = new pgAlbumRepository_1.PgAlbumRepository(prisma);
exports.albumsService = new albums_services_1.AlbumsService(exports.albumRepository);
exports.albumController = new albums_controller_1.default(exports.albumsService);
