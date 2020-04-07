// Import file library
const fs = require('fs');

module.exports = {
    get_random: function(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },
    read: function(filename) {
        'use strict';
        var rawdata = fs.readFileSync(filename);
        return JSON.parse(rawdata);
    },
    write: function(data, filename) {
        'use strict';
        var d = JSON.stringify(data, null, 4);
        fs.writeFileSync(filename, d);
    },
    shuffle: function(array) {
        for (let i = array.length - 1; i > 0; i--) {
          let j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
    },
    remove_val: function(arr, val) {
        for(var i = arr.length - 1; i >= 0; i--) {
            if (arr[i] == val) {
                arr.splice(i, 1);
                i--;
            }
        }
    },
    mode: function(array) {
        if(array.length == 0) {
            return 0;
        }
        var modeMap = {};
        var maxEl = array[0], maxCount = 1;
        for(var i = 0; i < array.length; i++)
        {
            var el = array[i];
            if(modeMap[el] == null)
                modeMap[el] = 1;
            else
                modeMap[el]++;
            if(modeMap[el] >= maxCount)
            {
                maxEl = el;
                maxCount = modeMap[el];
            }
        }
    
        var votes = [];
        for(var el in modeMap) {
            if(modeMap[el] == maxCount) {
                votes.push(el);
            }
        }
    
        if(votes.length == 1) {
            return maxEl;
        }
        return get_random(votes);
    }
}


