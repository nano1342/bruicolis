"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const dependencies_1 = require("../src/dependencies");
// import artists csv from file
const csv_parse_1 = require("csv-parse");
const perf_hooks_1 = require("perf_hooks");
// const {
//     performance,
//     PerformanceObserver,
// }: {
//     performance: Performance;
//     PerformanceObserver: any;
// } = require("node:perf_hooks");
const async_hooks_1 = require("async_hooks");
// const { AsyncLocalStorage } = require("node:async_hooks");
/**
 * needs to be reset for each async operation
 */
let asyncLocalStorage = new async_hooks_1.AsyncLocalStorage();
function perfNow() {
    return { start: perf_hooks_1.performance.now(), end: 0 };
}
function perfEnd(t, name) {
    if (t === undefined) {
        console.error("perfEnd: t is undefined", "i=" + asyncLocalStorage.getStore()?.i);
        return;
    }
    t.end = perf_hooks_1.performance.now();
    console.log(name, "i=" + asyncLocalStorage.getStore()?.i, t.end - t.start);
}
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
const MAX_SONGS = 5_000;
const MAX_MAPPINGS = 200_000;
const MAX_ALBUMS = 5_000;
const MEASURE_PERFORMANCE = true;
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
    db.exec("CREATE TABLE artist_musicbrainz_to_db_id (musicbrainz_id INTEGER, id INTEGER)");
    importArtists();
}
/**
 * @satisfies timerify friendly
 */
let getTruncatedName = (name, maxLength) => {
    let n = name;
    if (n.length > 255) {
        n = n.substring(0, 255);
        console.warn(`truncated name: ${name}\n\t-->${n}`);
    }
    return n;
};
let expectedArtists = 0;
let acknowledgedArtists = 0;
let artistPerfTimings = new Map();
function importArtists() {
    console.log("=== importing artists...");
    asyncLocalStorage = new async_hooks_1.AsyncLocalStorage();
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
            let name = getTruncatedName(r[2], 255); // name is the 3rd field in the csv
            const musicbrainzId = parseInt(r[0]);
            try {
                expectedArtists++;
                asyncLocalStorage.run({ i }, () => {
                    artistPerfTimings.set(name, perfNow());
                    dependencies_1.getArtistsService
                        .addArtist({
                        id: 0, // ignored by service,
                        name,
                        musicbrainzId,
                    })
                        .then((artist) => {
                        if (artist !== null) {
                            db.prepare("INSERT INTO artist_musicbrainz_to_db_id VALUES (?, ?)").run(musicbrainzId, artist.id);
                        }
                        acknowledgedArtists++;
                        perfEnd(artistPerfTimings.get(name), "addArtist");
                        artistPerfTimings.delete(name);
                    });
                });
            }
            catch (e) {
                expectedArtists--;
                console.error("failed to import artist", r, e);
            }
        },
        onendorclose: () => {
            const interval = setInterval(() => {
                console.log(`acknowledged artists: ${acknowledgedArtists}/${expectedArtists}`);
                if (acknowledgedArtists === expectedArtists) {
                    clearInterval(interval);
                    console.log("artists imports prepared.");
                    buildArtistCreditMappings();
                }
            }, 1000);
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
let expectedSongs = 0;
let acknowledgedSongs = 0;
let songPerfTimings = new Map();
function importSongs() {
    console.log("=== importing songs...");
    asyncLocalStorage = new async_hooks_1.AsyncLocalStorage();
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
            let name = getTruncatedName(r[2], 255); // name is the 3rd field in the csv
            const artistCredit = parseInt(r[3]);
            const artistIds = mapArtistCreditToArtists(artistCredit);
            if (!artistIds || artistIds.length === 0) {
                // console.warn(
                //     `Cannot import song "${name} because it doesn't have any bound artist in the database."`
                // );
                // TODO uncomment this line
                return;
            }
            // map musicbrainz id to db id
            let dbArtistIds = artistIdsToDbIds(artistIds);
            if (dbArtistIds.length === 0) {
                // console.warn(
                //     `Cannot import song "${name} because it doesn't have any bound artist (with corresponding musicbrainz id) in the database."`
                // );
                // TODO uncomment this line
                return;
            }
            const recordingId = parseInt(r[0]);
            const releaseDate = getRecordingFirstReleaseDate(recordingId);
            const date = convertToDate(releaseDate);
            try {
                expectedSongs++;
                asyncLocalStorage.run({ i }, () => {
                    songPerfTimings.set(name, perfNow());
                    dependencies_1.getSongsService
                        .addSongWithMultipleArtists({
                        id: 0, // ignored by service,
                        name,
                        release_date: date,
                    }, dbArtistIds)
                        .then(() => {
                        acknowledgedSongs++;
                        perfEnd(songPerfTimings.get(name), "addSong");
                        songPerfTimings.delete(name);
                    });
                });
            }
            catch (e) {
                console.error("failed to import song", r, e);
            }
        },
        onendorclose: () => {
            const interval = setInterval(() => {
                console.log(`acknowledged songs: ${acknowledgedSongs}/${expectedSongs}`);
                if (acknowledgedSongs === expectedSongs) {
                    clearInterval(interval);
                    console.log("songs imported.");
                    importAlbums();
                }
            }, 1000);
        },
    });
}
// function getRecordingFirstReleaseDate(recordingId: number): ReleaseDate | null {
//     const medium = recordingToMedium.get(recordingId);
//     if (medium === undefined || medium.length === 0) {
//         return null;
//     }
//     let releases: number[] = [];
//     for (const m of medium) {
//         const mediumReleases = mediumToRelease.get(m);
//         if (mediumReleases !== undefined) {
//             releases.concat(mediumReleases);
//         }
//     }
//     if (releases.length === 0) {
//         return null;
//     }
//     let releaseDates: ReleaseDate[] = [];
//     for (const r of releases) {
//         const rDates = releaseToReleaseDate.get(r);
//         if (rDates !== undefined) {
//             releaseDates.concat(rDates);
//         }
//     }
//     if (releaseDates.length === 0) {
//         return null;
//     } else {
//         return releaseDates.reduce((acc, current) => {
//             // find the earliest date
//             if (acc.year < current.year) {
//                 return acc;
//             } else if (acc.year > current.year) {
//                 return current;
//             } else {
//                 if (acc.month < current.month) {
//                     return acc;
//                 } else if (acc.month > current.month) {
//                     return current;
//                 } else {
//                     if (acc.day < current.day) {
//                         return acc;
//                     } else {
//                         return current;
//                     }
//                 }
//             }
//         })
//     }
// }
const getRecordingFirstReleaseDateCache = new Map();
const getReleaseFirstReleaseDateCache = new Map();
/**
 * @satisfies timerify friendly
 */
let getRecordingFirstReleaseDate = (recordingId) => {
    if (getRecordingFirstReleaseDateCache.has(recordingId)) {
        return getRecordingFirstReleaseDateCache.get(recordingId);
    }
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
    let date = null;
    if (releaseDates.length === 0) {
        date = null;
    }
    else {
        date = getMinimumDate(releaseDates);
    }
    getRecordingFirstReleaseDateCache.set(recordingId, date);
    return date;
};
/**
 * @satisfies timerify friendly
 */
let getReleaseFirstReleaseDate = (releaseId) => {
    if (getReleaseFirstReleaseDateCache.has(releaseId)) {
        return getReleaseFirstReleaseDateCache.get(releaseId);
    }
    const releaseDates = [];
    const stmt = db.prepare("SELECT year,month,day FROM release_to_release_date WHERE release = ?");
    for (const row of stmt.iterate(releaseId)) {
        const r = row;
        releaseDates.push({
            year: r.year,
            month: r.month,
            day: r.day,
        });
    }
    let date = null;
    if (releaseDates.length === 0) {
        date = null;
    }
    else {
        date = getMinimumDate(releaseDates);
    }
    getReleaseFirstReleaseDateCache.set(releaseId, date);
    return date;
};
function getMinimumDate(releaseDates) {
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
function findArtistIdByMusicBrainzId(id) {
    return db
        .prepare("SELECT id FROM artist_musicbrainz_to_db_id WHERE musicbrainz_id = ?")
        .get(id);
}
function mapArtistCreditToArtists(artistCredit) {
    return db
        .prepare("SELECT artist FROM artist_credit_to_artist WHERE artist_credit = ?")
        .all(artistCredit)
        .map((v) => v.artist);
}
let expectedAlbums = 0;
let acknowledgedAlbums = 0;
let albumPerfTimings = new Map();
/**
 * @see https://musicbrainz.org/doc/Medium
 */
function importAlbums() {
    console.log("=== importing albums...");
    asyncLocalStorage = new async_hooks_1.AsyncLocalStorage();
    let i = 0;
    read(releaseCsv, {
        ondata: (r, stream) => {
            // log progress
            i++;
            if (i % 1000 === 0 && i <= MAX_ALBUMS) {
                console.log(i);
            }
            if (i > MAX_ALBUMS) {
                stream.destroy();
                return;
            }
            let name = getTruncatedName(r[2], 255); // name is the 3rd field in the csv
            const artistCredit = parseInt(r[3]);
            const artistIds = mapArtistCreditToArtists(artistCredit);
            if (!artistIds || artistIds.length === 0) {
                // console.warn(
                //     `Cannot import album "${name} because it doesn't have any bound artist in the database."`
                // );
                // TODO uncomment this line
                return;
            }
            // map musicbrainz id to db id
            let dbArtistIds = artistIdsToDbIds(artistIds);
            if (dbArtistIds.length === 0) {
                // console.warn(
                //     `Cannot import album "${name} because it doesn't have any bound artist (with corresponding musicbrainz id) in the database."`
                // );
                // TODO uncomment this line
                return;
            }
            const recordingId = parseInt(r[0]);
            const releaseDate = getReleaseFirstReleaseDate(recordingId);
            const date = convertToDate(releaseDate);
            try {
                expectedAlbums++;
                asyncLocalStorage.run({ i }, () => {
                    albumPerfTimings.set(name, perfNow());
                    dependencies_1.albumsService
                        .addAlbumWithMultipleArtists({
                        id: 0, // ignored by service,
                        name,
                        release_date: date,
                    }, dbArtistIds)
                        .then(() => {
                        acknowledgedAlbums++;
                        const perf = albumPerfTimings.get(name);
                        perfEnd(albumPerfTimings.get(name), "addAlbum");
                        albumPerfTimings.delete(name);
                    });
                });
            }
            catch (e) {
                console.error("failed to import album", r, e);
            }
        },
        onendorclose: () => {
            const interval = setInterval(() => {
                console.log(`acknowledged albums: ${acknowledgedAlbums}/${expectedAlbums}`);
                if (acknowledgedAlbums === expectedAlbums) {
                    clearInterval(interval);
                    console.log("albums imported.");
                    finish();
                }
            }, 1000);
        },
    });
    // // import album ===
    // let name = getTruncatedName(r[2], 255); // name is the 3rd field in the csv
    // const artistCredit = parseInt(r[3]);
}
/**
 * @satisfies timerify friendly
 */
let convertToDate = (releaseDate) => {
    const date = new Date();
    if (releaseDate !== null) {
        date.setUTCFullYear(Math.max(1970, releaseDate.year));
        date.setUTCMonth(releaseDate.month);
        date.setUTCDate(releaseDate.day);
    }
    return date;
};
const artistIdsToDbIdsCache = new Map();
/**
 * @satisfies timerify friendly
 */
let artistIdsToDbIds = (artistIds) => {
    let dbArtistIds = [];
    for (const id of artistIds) {
        let dbArtistId;
        if (artistIdsToDbIdsCache.has(id)) {
            dbArtistId = artistIdsToDbIdsCache.get(id);
            continue;
        }
        else {
            dbArtistId = findArtistIdByMusicBrainzId(id)?.id;
            artistIdsToDbIdsCache.set(id, dbArtistId);
        }
        if (dbArtistId !== undefined) {
            dbArtistIds.push(dbArtistId);
        }
    }
    return dbArtistIds;
};
async function finish() {
    disconnectPerfIfAny();
    db.close();
    console.log("=== done ===");
}
// https://nodejs.org/api/perf_hooks.html#measuring-the-duration-of-async-operations
let disconnectPerfIfAny = () => { };
if (MEASURE_PERFORMANCE) {
    // artistIdsToDbIds = performance.timerify(artistIdsToDbIds);
    getRecordingFirstReleaseDate = perf_hooks_1.performance.timerify(getRecordingFirstReleaseDate);
    getReleaseFirstReleaseDate = perf_hooks_1.performance.timerify(getReleaseFirstReleaseDate);
    // convertToDate = performance.timerify(convertToDate);
    perf_hooks_1.performance.mark("start");
    // Activate the observer
    const obs = new perf_hooks_1.PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
            console.log(`${entry.name}()`, entry.duration);
        });
        perf_hooks_1.performance.clearMarks();
        perf_hooks_1.performance.clearMeasures();
    });
    obs.observe({ entryTypes: ["function", "measure"] });
}
start();
