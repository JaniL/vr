var request = require('request')
  , util = require('util')
  , _ = require('underscore')
  , parseString  = require('xml2js').parseString;

function geoToFloats(geo) {
  var splitted = geo.split(' ');
  return [parseFloat(splitted[0]), parseFloat(splitted[1])];
}

function takeOffBraces(list) {
  if (typeof(list[0]) == 'string') {
    return list[0];
  } else {
    return list;
  }
}

function stringtoInteger(string) {
  if (isNaN(string) === false) {
    return +string;
  } else {
    return string;
  }
}

function cleanupTrain(train) {
  delete train['guid'];
  train = _.object(_.map(train,function(value,key) { return [key,takeOffBraces(value)]; }));
  train['georss:point'] = geoToFloats(train['georss:point']);
  train = _.object(_.map(train,function(value,key) { return [key,stringtoInteger(value)]; }));
  return train;
}

function cleanupInfo(info) {
  delete info['$'];
  info = _.object(_.map(info,function(value,key) { return [key,takeOffBraces(value)]; }));
  info['georss:point'] = geoToFloats(info['georss:point']);
  info = _.object(_.map(info,function(value,key) { return [key,stringtoInteger(value)]; }));
  return info;
}

module.exports.getStationInfo = function (stationcode, cb) {
  request('http://188.117.35.14/TrainRSS/TrainService.svc/stationInfo?station=' + stationcode, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      parseString(body, function(err, result) {
        result = result['rss']['channel'][0];
        return cb(null, {
          station: result['title'],
          'georss:point': geoToFloats(result['georss:point'][0]),
          trains: _.map(result['item'],function(value) { return cleanupTrain(value); })
        });
      });
    } else {
      return cb(error,null);
    }
  });
};

 
module.exports.getTrains = function (cb) {
  request('http://188.117.35.14/TrainRSS/TrainService.svc/AllTrains', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      parseString(body, function(err, result) {
        result = result['rss']['channel'][0];
        return cb(null,_.map(result['item'],function(value) { return cleanupTrain(value); }));
      });
    } else {
      return cb(error,null);
    }
  });
};


module.exports.getTrain = function (guid, cb) {
  guid = guid.replace(' ','');
  request('http://188.117.35.14/TrainRSS/TrainService.svc/trainInfo?train=' + guid, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      parseString(body, function(err, result) {
        result = cleanupInfo(result['rss']['channel'][0]);
        result['item'] = _.map(result['item'],function(value) { return cleanupTrain(value); });
        return cb(null,result);
      });
    } else {
      return cb(error,null);
    }
  });
};