import { createClient } from "./client";
import { mapStationInfoToLegacy, mapTrainInfoToLegacy, mapTrainsToLegacy, parseLegacyGuid } from "./legacy-mappers";
import {
  ClientOptions,
  LegacyApi,
  LegacyCallback,
  LegacyStationInfo,
  LegacyTrain,
  LegacyTrainInfo,
  VrClient,
} from "./types";

const warnedDeprecations = new Set<string>();

function warnDeprecated(name: string): void {
  if (warnedDeprecations.has(name)) {
    return;
  }

  warnedDeprecations.add(name);
  process.emitWarning(
    `vr.${name}() is deprecated and will be removed in a future release. Please migrate to the Promise-based API exposed by createClient().`,
    "DeprecationWarning",
  );
}

function callbackify<T>(promise: Promise<T>, cb: LegacyCallback<T>): void {
  promise.then(
    (result) => cb(null, result),
    (error) => cb(error as Error, null),
  );
}

function requireCallback<T>(cb: unknown, methodName: string): LegacyCallback<T> {
  if (typeof cb !== "function") {
    throw new TypeError(`Callback is required for ${methodName}`);
  }
  return cb as LegacyCallback<T>;
}

function getStationInfoInternal(client: VrClient, stationCode: string): Promise<LegacyStationInfo> {
  return Promise.all([
    client.getStationLiveTrains(stationCode, {
      arrivedTrains: 10,
      arrivingTrains: 10,
      departedTrains: 10,
      departingTrains: 10,
      includeNonstopping: true,
    }),
    client.getStations(),
    client.getLatestTrainLocations(),
  ]).then(([trains, stations, locations]) => mapStationInfoToLegacy(stationCode, trains, stations, locations));
}

async function getTrainsInternal(client: VrClient): Promise<LegacyTrain[]> {
  const locations = await client.getLatestTrainLocations();

  const unique = new Map<string, { trainNumber: number; departureDate: string }>();
  for (const location of locations) {
    const key = `${location.departureDate}:${location.trainNumber}`;
    if (!unique.has(key)) {
      unique.set(key, { trainNumber: location.trainNumber, departureDate: location.departureDate });
    }
  }

  const trains = await Promise.all(
    Array.from(unique.values()).map(({ trainNumber, departureDate }) => client.getTrain(trainNumber, departureDate)),
  );

  const existingTrains = trains.filter((train) => train !== null);
  return mapTrainsToLegacy(existingTrains, locations);
}

async function getTrainInternal(client: VrClient, guid: string): Promise<LegacyTrainInfo> {
  const trainNumber = parseLegacyGuid(guid);
  if (trainNumber === null) {
    throw new Error(`Unable to parse train number from guid '${guid}'`);
  }

  const [train, locations, stations] = await Promise.all([
    client.getTrain(trainNumber, "latest"),
    client.getTrainLocations(trainNumber, "latest"),
    client.getStations(),
  ]);

  if (!train) {
    throw new Error(`Train not found for guid '${guid}'`);
  }

  return mapTrainInfoToLegacy(guid, train, locations, stations);
}

export function createLegacyApi(clientOrOptions?: VrClient | ClientOptions): LegacyApi {
  const client =
    clientOrOptions && typeof (clientOrOptions as VrClient).getTrain === "function"
      ? (clientOrOptions as VrClient)
      : createClient((clientOrOptions || {}) as ClientOptions);

  return {
    /**
     * @deprecated Use createClient().getStationLiveTrains() instead.
     */
    getStationInfo(stationCode: string, cb: LegacyCallback<LegacyStationInfo>): void {
      warnDeprecated("getStationInfo");
      callbackify(getStationInfoInternal(client, stationCode), requireCallback(cb, "getStationInfo"));
    },

    /**
     * @deprecated Use createClient().getLatestTrainLocations() instead.
     */
    getTrains(cb: LegacyCallback<LegacyTrain[]>): void {
      warnDeprecated("getTrains");
      callbackify(getTrainsInternal(client), requireCallback(cb, "getTrains"));
    },

    /**
     * @deprecated Use createClient().getTrain() and createClient().getTrainLocations() instead.
     */
    getTrain(guid: string, cb: LegacyCallback<LegacyTrainInfo>): void {
      warnDeprecated("getTrain");
      callbackify(getTrainInternal(client, guid), requireCallback(cb, "getTrain"));
    },
  };
}

const defaultClient = createClient();
const legacyApi = createLegacyApi(defaultClient);

export const getStationInfo = legacyApi.getStationInfo;
export const getTrains = legacyApi.getTrains;
export const getTrain = legacyApi.getTrain;

const exportedApi = {
  getStationInfo,
  getTrains,
  getTrain,
  createClient,
  createLegacyApi,
};

module.exports = exportedApi;

export { createClient };
export * from "./types";
