var assert = require("assert")
  , vr     = require('../lib/vr.js');

describe('vr', function() {
	describe('#getStationInfo()', function() {
		it('should not return an error', function (done) {
			vr.getStationInfo('HKI', function(err,res) {
				if (err) throw err;
				done();
			});
		});
	});

	describe('#getTrains()', function() {
		it('should not return an error', function (done) {
			vr.getTrains(function(err,res) {
				if (err) throw err;
				done();
			});
		});
	});
});