const assert = require("assert");
const vr = require("../dist/index.js");

describe("live Digitraffic integration", function () {
  this.timeout(30000);

  before(function () {
    if (process.env.RUN_LIVE_TESTS !== "1") {
      this.skip();
    }
  });

  it("modern client fetches station trains and a train", async function () {
    const client = vr.createClient();

    const trains = await client.getStationLiveTrains("HKI", {
      arrivedTrains: 2,
      arrivingTrains: 2,
      departedTrains: 2,
      departingTrains: 2,
      includeNonstopping: true,
    });

    assert.ok(Array.isArray(trains));
    assert.ok(trains.length > 0);

    const first = trains[0];
    assert.strictEqual(typeof first.trainNumber, "number");

    const train = await client.getTrain(first.trainNumber, "latest");
    assert.ok(train);
    assert.strictEqual(train.trainNumber, first.trainNumber);
  });

  it("legacy API callback methods work against live data", function (done) {
    vr.getStationInfo("HKI", function (stationErr, stationInfo) {
      if (stationErr) {
        done(stationErr);
        return;
      }

      try {
        assert.ok(stationInfo);
        assert.strictEqual(typeof stationInfo.station, "string");
        assert.ok(Array.isArray(stationInfo.trains));
        assert.ok(stationInfo.trains.length > 0);
      } catch (err) {
        done(err);
        return;
      }

      const guid = stationInfo.trains[0].guid;

      vr.getTrain(guid, function (trainErr, trainInfo) {
        if (trainErr) {
          done(trainErr);
          return;
        }

        try {
          assert.ok(trainInfo);
          assert.strictEqual(typeof trainInfo.trainNumber, "number");
          assert.ok(Array.isArray(trainInfo.item));
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });
});
