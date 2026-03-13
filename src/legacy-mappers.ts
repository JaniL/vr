import {
  LegacyStationInfo,
  LegacyTrain,
  LegacyTrainInfo,
  LegacyTrainRow,
  StationMetadata,
  Train,
  TrainLocation,
  TrainTimeTableRow,
} from "./types";

const FALLBACK_STATION_NAME = "Unknown station";

export function parseLegacyGuid(input: string): number | null {
  const normalized = (input || "").trim();
  const match = normalized.match(/(\d+)/);
  if (!match) {
    return null;
  }
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function trainGuid(train: { trainType?: string; trainNumber: number }): string {
  const prefix = (train.trainType || "").toUpperCase();
  return `${prefix}${train.trainNumber}`;
}

function locationByTrainKey(locations: TrainLocation[]): Map<string, TrainLocation> {
  const map = new Map<string, TrainLocation>();
  for (const location of locations) {
    const key = `${location.departureDate}:${location.trainNumber}`;
    map.set(key, location);
  }
  return map;
}

function stationByCode(stations: StationMetadata[]): Map<string, StationMetadata> {
  const map = new Map<string, StationMetadata>();
  for (const station of stations) {
    map.set(station.stationShortCode, station);
  }
  return map;
}

function toGeoPoint(location: TrainLocation | null): [number, number] | null {
  if (!location || !location.location || !Array.isArray(location.location.coordinates)) {
    return null;
  }
  const [lon, lat] = location.location.coordinates;
  if (typeof lat !== "number" || typeof lon !== "number") {
    return null;
  }
  return [lat, lon];
}

function toLegacyTrain(train: Train, location: TrainLocation | null): LegacyTrain {
  return {
    guid: trainGuid(train),
    trainNumber: train.trainNumber,
    departureDate: train.departureDate,
    trainType: train.trainType,
    trainCategory: train.trainCategory,
    commuterLineID: train.commuterLineID || "",
    operatorShortCode: train.operatorShortCode,
    cancelled: train.cancelled,
    runningCurrently: train.runningCurrently,
    speed: location ? location.speed : null,
    timestamp: location ? location.timestamp : null,
    "georss:point": toGeoPoint(location),
  };
}

function toLegacyTrainRow(row: TrainTimeTableRow, stations: Map<string, StationMetadata>): LegacyTrainRow {
  const station = stations.get(row.stationShortCode);
  const geoPoint =
    station && typeof station.latitude === "number" && typeof station.longitude === "number"
      ? ([station.latitude, station.longitude] as [number, number])
      : null;

  return {
    stationShortCode: row.stationShortCode,
    stationUICCode: row.stationUICCode,
    type: row.type,
    trainStopping: row.trainStopping,
    commercialStop: Boolean(row.commercialStop),
    cancelled: row.cancelled,
    scheduledTime: row.scheduledTime,
    actualTime: row.actualTime || null,
    liveEstimateTime: row.liveEstimateTime || null,
    differenceInMinutes: typeof row.differenceInMinutes === "number" ? row.differenceInMinutes : null,
    stopSector: row.stopSector || null,
    commercialTrack: row.commercialTrack || null,
    causes: Array.isArray(row.causes) ? row.causes : [],
    "georss:point": geoPoint,
  };
}

export function mapStationInfoToLegacy(
  stationCode: string,
  trains: Train[],
  stations: StationMetadata[],
  latestLocations: TrainLocation[],
): LegacyStationInfo {
  const stationsMap = stationByCode(stations);
  const station = stationsMap.get(stationCode);
  const stationName = station ? station.stationName : FALLBACK_STATION_NAME;
  const stationPoint =
    station && typeof station.latitude === "number" && typeof station.longitude === "number"
      ? ([station.latitude, station.longitude] as [number, number])
      : null;

  const locations = locationByTrainKey(latestLocations);
  const legacyTrains = trains.map((train) => {
    const key = `${train.departureDate}:${train.trainNumber}`;
    const location = locations.get(key) || null;
    return toLegacyTrain(train, location);
  });

  return {
    station: stationName,
    "georss:point": stationPoint,
    trains: legacyTrains,
  };
}

export function mapTrainsToLegacy(trains: Train[], latestLocations: TrainLocation[]): LegacyTrain[] {
  const trainMap = new Map<string, Train>();
  for (const train of trains) {
    const key = `${train.departureDate}:${train.trainNumber}`;
    trainMap.set(key, train);
  }

  const mapped: LegacyTrain[] = [];
  for (const location of latestLocations) {
    const key = `${location.departureDate}:${location.trainNumber}`;
    const train = trainMap.get(key);
    if (train) {
      mapped.push(toLegacyTrain(train, location));
      continue;
    }

    mapped.push({
      guid: String(location.trainNumber),
      trainNumber: location.trainNumber,
      departureDate: location.departureDate,
      trainType: "",
      trainCategory: "",
      commuterLineID: "",
      operatorShortCode: "",
      cancelled: false,
      runningCurrently: false,
      speed: location.speed,
      timestamp: location.timestamp,
      "georss:point": toGeoPoint(location),
    });
  }

  return mapped;
}

export function mapTrainInfoToLegacy(
  guidInput: string,
  train: Train,
  locations: TrainLocation[],
  stations: StationMetadata[],
): LegacyTrainInfo {
  const location = locations.length > 0 ? locations[0] : null;
  const stationsMap = stationByCode(stations);

  return {
    guid: guidInput.replace(/\s+/g, ""),
    trainNumber: train.trainNumber,
    departureDate: train.departureDate,
    trainType: train.trainType,
    trainCategory: train.trainCategory,
    commuterLineID: train.commuterLineID || "",
    operatorShortCode: train.operatorShortCode,
    cancelled: train.cancelled,
    runningCurrently: train.runningCurrently,
    version: train.version,
    timetableType: train.timetableType,
    timetableAcceptanceDate: train.timetableAcceptanceDate,
    speed: location ? location.speed : null,
    timestamp: location ? location.timestamp : null,
    "georss:point": toGeoPoint(location),
    item: train.timeTableRows.map((row) => toLegacyTrainRow(row, stationsMap)),
  };
}
