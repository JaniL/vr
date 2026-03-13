# vr.js

Node.js wrapper for Finnish railway traffic data from Digitraffic.

This package now uses the modern Digitraffic API:

- `https://www.digitraffic.fi/rautatieliikenne/`
- `https://rata.digitraffic.fi/swagger/`

## Install

```bash
npm install vr
```

## Node support

`>=16`

## Deprecation notice

The old callback API is still available for compatibility, but deprecated:

- `getStationInfo(stationCode, cb)`
- `getTrains(cb)`
- `getTrain(guid, cb)`

These methods keep the legacy response shape on a best-effort basis.

## Modern API (recommended)

```js
const vr = require("vr");

const client = vr.createClient();

async function main() {
  const trainsAtHelsinki = await client.getStationLiveTrains("HKI", {
    arrivedTrains: 5,
    arrivingTrains: 5,
    departedTrains: 5,
    departingTrains: 5,
    includeNonstopping: true,
  });

  const train = await client.getTrain(70, "latest");
  const locations = await client.getLatestTrainLocations();

  console.log(trainsAtHelsinki.length, train && train.trainNumber, locations.length);
}

main().catch(console.error);
```

## Legacy API (deprecated)

```js
const vr = require("vr");

vr.getStationInfo("HKI", function (err, info) {
  if (err) {
    throw err;
  }

  console.log(info.station);
  console.log(info["georss:point"]);
  console.log(info.trains.length);
});
```

## Old -> new API mapping

- `getStationInfo(stationCode, cb)` -> `client.getStationLiveTrains(stationCode, options)` + `client.getStations()`
- `getTrains(cb)` -> `client.getLatestTrainLocations()`
- `getTrain(guid, cb)` -> `client.getTrain(trainNumber, departureDate?)` + `client.getTrainLocations(trainNumber, departureDate?)`

## Notes on best-effort compatibility

- Legacy `guid` parsing in `getTrain(guid, cb)` extracts the numeric train number from the string (for example, `"IC70" -> 70`, `"S79" -> 79`).
- Some XML-era fields do not exist in Digitraffic anymore and are returned as `null`, empty string, or sensible fallback values.

## Live integration test

Run against real Digitraffic endpoints:

```bash
RUN_LIVE_TESTS=1 npm test
```

Without `RUN_LIVE_TESTS=1`, live tests are skipped.
