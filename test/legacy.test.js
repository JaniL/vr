const assert = require("assert");
const vr = require("../dist/index.js");

function createMockFetch(fixtures) {
  return async function mockFetch(input) {
    const url = String(input);
    for (const fixture of fixtures) {
      if (url.includes(fixture.match)) {
        return {
          ok: fixture.status >= 200 && fixture.status < 300,
          status: fixture.status,
          statusText: fixture.statusText || "OK",
          text: async () => JSON.stringify(fixture.body),
        };
      }
    }

    return {
      ok: false,
      status: 404,
      statusText: "Not Found",
      text: async () => JSON.stringify({ error: "No fixture" }),
    };
  };
}

const stationsFixture = [
  {
    passengerTraffic: true,
    type: "STATION",
    stationName: "Helsinki",
    stationShortCode: "HKI",
    stationUICCode: 1,
    countryCode: "FI",
    longitude: 24.941,
    latitude: 60.171,
  },
];

const trainFixture = {
  trainNumber: 70,
  departureDate: "2026-03-13",
  operatorUICCode: 10,
  operatorShortCode: "vr",
  trainType: "IC",
  trainCategory: "Long-distance",
  commuterLineID: "",
  runningCurrently: true,
  cancelled: false,
  version: 123,
  timetableType: "REGULAR",
  timetableAcceptanceDate: "2026-01-01T00:00:00.000Z",
  timeTableRows: [
    {
      stationShortCode: "HKI",
      stationUICCode: 1,
      countryCode: "FI",
      type: "DEPARTURE",
      trainStopping: true,
      commercialStop: true,
      cancelled: false,
      scheduledTime: "2026-03-13T10:00:00.000Z",
      actualTime: "2026-03-13T10:01:00.000Z",
      differenceInMinutes: 1,
      causes: [],
      commercialTrack: "5",
    },
  ],
};

const locationsFixture = [
  {
    trainNumber: 70,
    departureDate: "2026-03-13",
    timestamp: "2026-03-13T10:10:00.000Z",
    location: {
      type: "Point",
      coordinates: [24.95, 60.2],
    },
    speed: 120,
    accuracy: 4,
  },
];

describe("vr legacy API", function () {
  let legacy;

  beforeEach(function () {
    const client = vr.createClient({
      fetchImpl: createMockFetch([
        { match: "/metadata/stations", status: 200, body: stationsFixture },
        { match: "/live-trains/station/HKI", status: 200, body: [trainFixture] },
        { match: "/train-locations/latest/70", status: 200, body: locationsFixture },
        { match: "/train-locations/latest", status: 200, body: locationsFixture },
        { match: "/trains/latest/70", status: 200, body: [trainFixture] },
        { match: "/trains/2026-03-13/70", status: 200, body: [trainFixture] },
      ]),
    });

    legacy = vr.createLegacyApi(client);
  });

  it("getStationInfo keeps callback signature and legacy shape", function (done) {
    legacy.getStationInfo("HKI", function (err, result) {
      assert.ifError(err);
      assert.ok(result);
      assert.strictEqual(result.station, "Helsinki");
      assert.deepStrictEqual(result["georss:point"], [60.171, 24.941]);
      assert.ok(Array.isArray(result.trains));
      assert.strictEqual(result.trains[0].guid, "IC70");
      assert.deepStrictEqual(result.trains[0]["georss:point"], [60.2, 24.95]);
      done();
    });
  });

  it("getTrains returns legacy-like mapped items", function (done) {
    legacy.getTrains(function (err, result) {
      assert.ifError(err);
      assert.ok(result);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].trainNumber, 70);
      assert.strictEqual(result[0].trainType, "IC");
      done();
    });
  });

  it("getTrain parses legacy guid and returns item rows", function (done) {
    legacy.getTrain("IC70", function (err, result) {
      assert.ifError(err);
      assert.ok(result);
      assert.strictEqual(result.guid, "IC70");
      assert.strictEqual(result.trainNumber, 70);
      assert.ok(Array.isArray(result.item));
      assert.strictEqual(result.item[0].stationShortCode, "HKI");
      done();
    });
  });
});

describe("vr modern API", function () {
  it("createClient getTrain returns first train", async function () {
    const client = vr.createClient({
      fetchImpl: createMockFetch([{ match: "/trains/latest/70", status: 200, body: [trainFixture] }]),
    });

    const train = await client.getTrain(70);
    assert.ok(train);
    assert.strictEqual(train.trainNumber, 70);
  });
});
