/**
 * Discord Webpack Chunk & Module Extractor
 */
let wpRequire = null;

function getWebpackRequire() {
    if (wpRequire) return wpRequire;

    try {
        if (typeof webpackChunkdiscord_app !== "undefined") {
            wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
            webpackChunkdiscord_app.pop();
        }
    } catch (err) {
        console.error("[Webpack] Gagal mengambil webpackChunk:", err);
    }
    return wpRequire;
}

/**
 * Filter pencegah i18n / Translation Proxy Discord.
 * Discord menggunakan Proxy untuk modul bahasa/i18n yang merespons 'truthy'
 * ke sembarang nama properti (misal getQuests, get, dll) sehingga sering salah terdeteksi.
 */
function isExcludedOrProxy(exp) {
    if (!exp || (typeof exp !== "object" && typeof exp !== "function")) return true;
    try {
        // Jika suatu objek merespons nilai untuk key acak yang tidak pernah ada, maka objek ini adalah Proxy i18n!
        if (exp.__test_non_existent_key_xyz987__ !== undefined) return true;
        if (exp.intl && exp.t) return true;
        if (exp.Messages && exp.defaultMessages) return true;
    } catch (e) {
        return true;
    }
    return false;
}

function findModule(filter) {
    const wp = getWebpackRequire();
    if (!wp || !wp.c) return null;

    for (const id in wp.c) {
        const m = wp.c[id];
        if (!m || !m.exports) continue;

        const candidates = [
            m.exports,
            m.exports.default,
            m.exports.Z,
            m.exports.ZP,
            m.exports.Ay,
            m.exports.A,
            m.exports.Bo,
            m.exports.h
        ];

        for (const exp of candidates) {
            if (exp && !isExcludedOrProxy(exp)) {
                try {
                    if (filter(exp)) return exp;
                } catch (err) {}
            }
        }

        // Pencarian mendalam jika di-export dalam sub-key
        if (typeof m.exports === "object" && !isExcludedOrProxy(m.exports)) {
            for (const key of Object.keys(m.exports)) {
                try {
                    const item = m.exports[key];
                    if (item && !isExcludedOrProxy(item) && filter(item)) return item;
                } catch (e) {}
            }
        }
    }
    return null;
}

function findByProps(...props) {
    return findModule(exp => {
        return props.every(p => {
            try {
                return exp[p] !== undefined || (exp.__proto__ && exp.__proto__[p] !== undefined);
            } catch (e) {
                return false;
            }
        });
    });
}

module.exports = {
    getWebpackRequire,
    isExcludedOrProxy,
    findModule,
    findByProps
};
