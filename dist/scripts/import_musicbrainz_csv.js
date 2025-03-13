"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const dependencies_1 = require("../src/dependencies");
// import artists csv from file
const csv_parse_1 = require("csv-parse");
const fs = require("fs");
const path = require("path");
let db;
// __dirname is in dist !!!
const root = path.resolve(__dirname, "..", "..", "musicbrainz_csv");
const artistsCsv = path.resolve(root, "out_artist.csv");
const songsCsv = path.resolve(root, "out_recording.csv");
const artistCreditNameCsv = path.resolve(root, "out_artist_credit_name.csv");
const trackCsv = path.resolve(root, "out_track.csv");
const mediumCsv = path.resolve(root, "out_medium.csv");
const releaseCsv = path.resolve(root, "out_release.csv");
const releaseCountryCsv = path.resolve(root, "out_release_country.csv");
// not enough memory, using sqlite
// const artistCreditToArtist = new Map<number, number[]>();
// const recordingToMedium = new Map<number, number[]>();
// const mediumToRelease = new Map<number, number[]>();
// const releaseToReleaseDate = new Map<number, ReleaseDate[]>();
const MAX_ARTISTS = 10_000;
const MAX_SONGS = 10_000;
const MAX_MAPPINGS = 200_000;
function read(path, callbacks) {
    const stream = fs.createReadStream(path);
    let endOrCloseSent = false; // both events are not mutually exclusive
    const sendEndOrClose = () => {
        if (!endOrCloseSent) {
            callbacks.onendorclose();
            endOrCloseSent = true;
        }
    };
    stream
        .on("close", sendEndOrClose)
        .pipe((0, csv_parse_1.parse)({ delimiter: "," }))
        .on("data", (r) => callbacks.ondata(r, stream))
        .on("end", sendEndOrClose);
}
function start() {
    // remove existing database if any
    if (fs.existsSync("musicbrainzMapping.db")) {
        fs.unlinkSync("musicbrainzMapping.db");
    }
    db = new better_sqlite3_1.default("musicbrainzMapping.db");
    db.pragma("journal_mode = WAL");
    // setup maps
    db.exec("CREATE TABLE artist_credit_to_artist (artist_credit INTEGER, artist INTEGER)");
    db.exec("CREATE TABLE recording_to_medium (recording INTEGER, medium INTEGER)");
    db.exec("CREATE TABLE medium_to_release (medium INTEGER, release INTEGER)");
    db.exec("CREATE TABLE release_to_release_date (release INTEGER, year INTEGER, month INTEGER, day INTEGER)");
    importArtists();
}
function importArtists() {
    console.log("=== importing artists...");
    let i = 0;
    read(artistsCsv, {
        ondata: (r, stream) => {
            // log progress
            i++;
            if (i % 10000 === 0 && i <= MAX_ARTISTS) {
                console.log(i);
            }
            if (i > MAX_ARTISTS) {
                stream.destroy();
                return;
            }
            let name = r[2]; // name is the 3rd field in the csv
            if (name.length > 255) {
                name = name.substring(0, 255);
                console.warn("truncated name", r[2], name);
            }
            try {
                dependencies_1.getArtistsService.addArtist({
                    id: 0, // ignored by service,
                    name,
                    musicbrainzId: parseInt(r[0]),
                });
            }
            catch (e) {
                console.error("failed to import artist", r, e);
            }
        },
        onendorclose: () => {
            console.log("artists imported.");
            buildArtistCreditMappings();
        },
    });
}
function buildArtistCreditMappings() {
    console.log("=== building artist credit mappings...");
    let i = 0;
    read(artistCreditNameCsv, {
        ondata: (r, stream) => {
            // log progress
            i++;
            if (i % 50000 === 0 && i <= MAX_MAPPINGS) {
                console.log(i);
            }
            if (i > MAX_MAPPINGS) {
                stream.destroy();
                return;
            }
            // artist credit name : link between [artist credit (array), position] and artist.
            // so we can directly map one artist credti to n artists
            const artistCredit = parseInt(r[0]);
            const artist = parseInt(r[2]);
            // pushToArrayOrInitInMap(artistCreditToArtist, artistCredit, artist);
            db.prepare("INSERT INTO artist_credit_to_artist VALUES (?, ?)").run(artistCredit, artist);
        },
        onendorclose: () => {
            console.log("artist credit mappings done.");
            buildTrackMappings();
        },
    });
}
function buildTrackMappings() {
    console.log("=== building track mappings...");
    let i = 0;
    read(trackCsv, {
        ondata: (r, stream) => {
            // log progress
            i++;
            if (i % 50000 === 0 && i <= MAX_MAPPINGS) {
                console.log(i);
            }
            if (i > MAX_MAPPINGS) {
                stream.destroy();
                return;
            }
            const recording = parseInt(r[2]);
            const medium = parseInt(r[3]);
            // pushToArrayOrInitInMap(recordingToMedium, recording, medium);
            db.prepare("INSERT INTO recording_to_medium VALUES (?, ?)").run(recording, medium);
        },
        onendorclose: () => {
            console.log("recording to medium mappings done.");
            buildMediumToReleaseMappings();
        },
    });
}
function buildMediumToReleaseMappings() {
    console.log("=== building medium to release mappings...");
    let i = 0;
    read(mediumCsv, {
        ondata: (r, stream) => {
            // log progress
            i++;
            if (i % 50000 === 0 && i <= MAX_MAPPINGS) {
                console.log(i);
            }
            if (i > MAX_MAPPINGS) {
                stream.destroy();
                return;
            }
            const medium = parseInt(r[0]);
            const release = parseInt(r[1]);
            // pushToArrayOrInitInMap(mediumToRelease, medium, release);
            db.prepare("INSERT INTO medium_to_release VALUES (?, ?)").run(medium, release);
        },
        onendorclose: () => {
            console.log("medium to release mappings done.");
            buildReleaseToReleaseCountryMappings();
        },
    });
}
function buildReleaseToReleaseCountryMappings() {
    console.log("=== building release to release date mappings...");
    let i = 0;
    read(releaseCountryCsv, {
        ondata: (r, stream) => {
            // log progress
            i++;
            if (i % 50000 === 0 && i <= MAX_MAPPINGS) {
                console.log(i);
            }
            if (i > MAX_MAPPINGS) {
                stream.destroy();
                return;
            }
            const release = parseInt(r[0]);
            const releaseDate = {
                year: parseInt(r[2]),
                month: parseInt(r[3]),
                day: parseInt(r[4]),
            };
            // pushToArrayOrInitInMap(releaseToReleaseDate, release, releaseDate);
            db.prepare("INSERT INTO release_to_release_date VALUES (?, ?, ?, ?)").run(release, releaseDate.year, releaseDate.month, releaseDate.day);
        },
        onendorclose: () => {
            console.log("release to release date mappings done.");
            importSongs();
        },
    });
}
// function pushToArrayOrInitInMap<K, V>(map: Map<K, V[]>, key: K, value: V) {
//     if (!map.has(key)) {
//         map.set(key, []);
//     }
//     let array = map.get(key)!;
//     array.push(value);
//     map.set(key, array);
// }
let songPromises = [];
function importSongs() {
    console.log("=== preparing song imports...");
    let i = 0;
    read(songsCsv, {
        ondata: (r, stream) => {
            // log progress
            i++;
            if (i % 1000 === 0 && i <= MAX_SONGS) {
                console.log(i);
            }
            if (i > MAX_SONGS) {
                stream.destroy();
                return;
            }
            let name = r[2]; // name is the 3rd field in the csv
            if (name.length > 255) {
                name = name.substring(0, 255);
                console.warn(`truncated name${r[2]}\n\t==> ${name}`);
            }
            const artistCredit = parseInt(r[3]);
            const artistIds = mapArtistCreditToArtists(artistCredit);
            if (!artistIds || artistIds.length === 0) {
                // console.warn(
                //     `Cannot import song "${name} because it doesn't have any bound artist in the database."`
                // );
                // TODO uncomment this line
                return;
            }
            songPromises.push(new Promise((resolve, reject) => {
                const f = async () => {
                    // map musicbrainz id to db id
                    let dbArtistIds = [];
                    for (const id of artistIds) {
                        const dbArtistId = await dependencies_1.getArtistsService.findArtistIdByMusicBrainzId(id);
                        if (dbArtistId) {
                            dbArtistIds.push(dbArtistId.id);
                        }
                    }
                    if (dbArtistIds.length === 0) {
                        // console.warn(
                        //     `Cannot import song "${name} because it doesn't have any bound artist (with corresponding musicbrainz id) in the database."`
                        // );
                        // TODO uncomment this line
                        return;
                    }
                    const recordingId = parseInt(r[0]);
                    const releaseDate = getRecordingFirstReleaseDate(recordingId);
                    const date = new Date();
                    if (releaseDate !== null) {
                        date.setUTCFullYear(releaseDate?.year);
                        date.setUTCMonth(releaseDate.month);
                        date.setUTCDate(releaseDate.day);
                    }
                    //  TODO FIXME: https://musicbrainz.org/doc/Medium album
                    try {
                        await dependencies_1.getSongsService.addSongWithMultipleArtists({
                            id: 0, // ignored by service,
                            name,
                            release_date: date,
                        }, dbArtistIds);
                    }
                    catch (e) {
                        console.error("failed to import song", r, e);
                    }
                };
                f().then(resolve).catch(reject);
            }));
        },
        onendorclose: () => {
            console.log("songs imports prepared.");
            importAlbums();
        },
    });
}
function getRecordingFirstReleaseDate(recordingId) {
    const releaseDates = [];
    const stmt = db.prepare("SELECT year,month,day FROM recording_to_medium NATURAL JOIN medium_to_release NATURAL JOIN release_to_release_date WHERE recording = ?");
    for (const row of stmt.iterate(recordingId)) {
        const r = row;
        releaseDates.push({
            year: r.year,
            month: r.month,
            day: r.day,
        });
    }
    if (releaseDates.length === 0) {
        return null;
    }
    else {
        return releaseDates.reduce((acc, current) => {
            // find the earliest date
            if (acc.year < current.year) {
                return acc;
            }
            else if (acc.year > current.year) {
                return current;
            }
            else {
                if (acc.month < current.month) {
                    return acc;
                }
                else if (acc.month > current.month) {
                    return current;
                }
                else {
                    if (acc.day < current.day) {
                        return acc;
                    }
                    else {
                        return current;
                    }
                }
            }
        });
    }
}
function mapArtistCreditToArtists(artistCredit) {
    return db
        .prepare("SELECT artist FROM artist_credit_to_artist WHERE artist_credit = ?")
        .all(artistCredit)
        .map((v) => v.artist);
}
function importAlbums() {
    finish();
}
async function finish() {
    console.log(`${songPromises.length} song promises to process...`);
    // https://stackoverflow.com/questions/42341331/es6-promise-all-progress
    function* settledOrder(promises) {
        let i = 0;
        let next_resolve;
        const callback = (original_index, status, field) => (arg) => {
            next_resolve({
                status,
                [field]: arg,
                original_index,
                index: i++,
            });
        };
        promises.forEach((promise, index) => promise
            .then(callback(index, "fullfiled", "value"))
            .catch(callback(index, "rejected", "reason")));
        while (i < promises.length) {
            yield new Promise((r) => (next_resolve = r));
        }
    }
    let progress = 0;
    const progressMax = songPromises.length;
    for await (const { index, original_index, status, value, reason, } of settledOrder(songPromises)) {
        console.log(index, original_index, status, value, reason);
        progress = index + 1;
        if (progress % 100 === 0) {
            console.log(progress);
        }
    }
    console.log("=== done ===");
}
start();
