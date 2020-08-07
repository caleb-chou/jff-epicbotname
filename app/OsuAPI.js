const fetch = require('node-fetch');
module.exports = class OsuAPI {
    constructor(key) {
        this.key = key
    }
    getUser(user,m=0) {
        const url = new URL("https://osu.ppy.sh/api/get_user")

        let params = {
            "k" : this.key,
            "u" : user,
            "m" : m
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