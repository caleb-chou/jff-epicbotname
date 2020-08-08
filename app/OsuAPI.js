const fetch = require('node-fetch');
const { mode } = require('./dlz_utils');
module.exports = class OsuAPI {
    constructor(key) {
        this.key = key
    }
    getUser(user,mode=0) {
        const url = new URL("https://osu.ppy.sh/api/get_user")

        let params = {
            "k" : this.key,
            "u" : user,
            "m" : mode
        }
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

        let headers = {
            "Authorization" : `Bearer ${this.key}`,
            "Accept"        : "application/json",
            "Content-Type"  : "application/json",
        }
        const data = fetch(url, {
            method: "GET",
            headers: headers,
        })
        .then(response => response.json())
        .then(json => {
            return json
        }).catch(console.log.bind(console));
        return data;
    }
    getScores(beatmap, user, mode, mods, limit) {
        const url = new URL("https://osu.ppy.sh/api/get_scores")

        let params = {
            "k" : this.key,
            "b" : beatmap,
            "u" : user,
            "m" : mode,
            "mods": mods,
            "limit": limit
        }
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

        let headers = {
            "Authorization" : `Bearer ${this.key}`,
            "Accept"        : "application/json",
            "Content-Type"  : "application/json",
        }
        const data = fetch(url, {
            method: "GET",
            headers: headers,
        })
        .then(response => response.json())
        .then(json => {
            return json
        }).catch(console.log.bind(console));
        return data;
    }
    getUserBest(user, mode=0, limit=5) {
        const url = new URL("https://osu.ppy.sh/api/get_user_best")

        let params = {
            "k" : this.key,
            "u" : user,
            "m" : mode,
            "limit" : limit
        }
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

        let headers = {
            "Authorization" : `Bearer ${this.key}`,
            "Accept"        : "application/json",
            "Content-Type"  : "application/json",
        }
        const data = fetch(url, {
            method: "GET",
            headers: headers,
        })
        .then(response => response.json())
        .then(json => {
            return json
        }).catch(console.log.bind(console));
        return data;
    }


    getUserImageURL(user) {
        return `https://a.ppy.sh/${user}`;
    }
}