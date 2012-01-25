var request = require('request')
  , xmlson  = require('xmlson');

module.exports.getStationInfo = function (stationcode, cb) {
  request('http://188.117.35.14/TrainRSS/TrainService.svc/stationInfo?station=' + stationcode, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var trains = [];
      var bodyjson = xmlson.toJSON(body);
      bodyjson.rss.channel.item.forEach(function (item) {
        if (typeof(item.reasonCode) === 'object') {
          var reasonCode = null;
        } else {
          var reasonCode = item.reasonCode;
        }
        if (item.completed === '0') {
          var completed = false;
        } else {
          var completed = true;
        }
        trains.push({ guid: item.guid.text, train: item.title, updated: item.pubDate, eta: item.eta, etd: item.etd, status: parseInt(item.status, 10), scheduledTime: item.scheduledTime, scheduledDepartTime: item.scheduledDepartTime, fromStation: item.fromStation, toStation: item.toStation, reasonCode: reasonCode, lateness: parseInt(item.lateness, 10), completed: completed, geo: item['georss:point'] });
      });
      return cb({ station: bodyjson.rss.channel.title, geo: bodyjson.rss.channel['georss:point'], trains: trains });
    } else {
      return null;
    }
  });
}

module.exports.getTrains = function (cb) {
  request('http://188.117.35.14/TrainRSS/TrainService.svc/AllTrains', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var trains = [];
      var bodyjson = xmlson.toJSON(body);
      bodyjson.rss.channel.item.forEach(function (item) {
        trains.push({ guid: item.guid.text, train: item.title, updated: item.pubDate, geo: item['georss:point'], from: item.from, to: item.to, status: parseInt(item.status, 10), dir: parseInt(item.dir, 10) });
      });
      return cb(trains);
    } else {
      return null;
    }
  });
}

module.exports.getTrain = function (guid, cb) {
  request('http://188.117.35.14/TrainRSS/TrainService.svc/trainInfo?train=' + guid, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var stations = [];
      var bodyjson = xmlson.toJSON(body);
      bodyjson.rss.channel.item.forEach(function (item) {
        if (typeof(item.scheduledTime) === 'object') {
          var scheduledTime = null;
        } else {
          var scheduledTime = item.scheduledTime;
        }
        if (typeof(item.eta) === 'object') {
          var eta = null;
        } else {
          var eta = item.eta;
        }
        if (typeof(item.etd) === 'object') {
          var etd = null;
        } else {
          var etd = item.etd;
        }
        if (typeof(item.scheduledDepartTime) === 'object') {
          var scheduledDepartTime = null;
        } else {
          var scheduledDepartTime = item.scheduledDepartTime;
        }
        if (item.completed === '1') {
          var completed = true;
        } else {
          var completed = false;
        }
        stations.push({ guid: item.guid.text, scheduledTime: scheduledTime, scheduledDepartTime: scheduledDepartTime, eta: eta, etd: etd, completed: completed, status: parseInt(item.status, 10), geo: item['georss:point']  });
      });
      return cb({ train: bodyjson.rss.channel.title, geo: bodyjson.rss.channel['georss:point'], speed: parseInt(bodyjson.rss.channel.speed, 10), heading: parseInt(bodyjson.rss.channel.heading, 10), startStation: bodyjson.rss.channel.startStation, endStation: bodyjson.rss.channel.endStation, status: parseInt(bodyjson.rss.channel.status, 10), lateness: parseInt(bodyjson.rss.channel.lateness, 10), stations: stations });
    } else {
      return null;
    }
  });
}
