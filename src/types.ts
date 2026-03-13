export type LegacyCallback<T> = (error: Error | null, result: T | null) => void;

export interface StationMetadata {
  passengerTraffic: boolean;
  type: string;
  stationName: string;
  stationShortCode: string;
  stationUICCode: number;
  countryCode: string;
  longitude: number;
  latitude: number;
}

export interface TrainLocation {
  trainNumber: number;
  departureDate: string;
  timestamp: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  speed: number;
  accuracy: number;
}

export interface TrainTimeTableRow {
  stationShortCode: string;
  stationUICCode: number;
  countryCode: string;
  type: string;
  trainStopping: boolean;
  commercialStop?: boolean;
  cancelled: boolean;
  scheduledTime: string;
  liveEstimateTime?: string;
  estimateSource?: string;
  actualTime?: string;
  differenceInMinutes?: number;
  causes?: unknown[];
  stopSector?: string;
  commercialTrack?: string;
}

export interface Train {
  trainNumber: number;
  departureDate: string;
  operatorUICCode: number;
  operatorShortCode: string;
  trainType: string;
  trainCategory: string;
  commuterLineID: string;
  runningCurrently: boolean;
  cancelled: boolean;
  version: number;
  timetableType: string;
  timetableAcceptanceDate: string;
  timeTableRows: TrainTimeTableRow[];
}

export interface StationLiveTrainOptions {
  arrivedTrains?: number;
  arrivingTrains?: number;
  departedTrains?: number;
  departingTrains?: number;
  includeNonstopping?: boolean;
}

export interface ClientOptions {
  baseUrl?: string;
  fetchImpl?: FetchLike;
}

export interface FetchLike {
  (input: string, init?: { method?: string; headers?: Record<string, string> }): Promise<{
    ok: boolean;
    status: number;
    statusText: string;
    text(): Promise<string>;
  }>;
}

export interface VrClient {
  getStations(): Promise<StationMetadata[]>;
  getStationLiveTrains(stationCode: string, options?: StationLiveTrainOptions): Promise<Train[]>;
  getTrain(trainNumber: number, departureDate?: string): Promise<Train | null>;
  getLatestTrainLocations(): Promise<TrainLocation[]>;
  getTrainLocations(trainNumber: number, departureDate?: string): Promise<TrainLocation[]>;
}

export interface LegacyTrain {
  guid: string;
  trainNumber: number;
  departureDate: string;
  trainType: string;
  trainCategory: string;
  commuterLineID: string;
  operatorShortCode: string;
  cancelled: boolean;
  runningCurrently: boolean;
  speed: number | null;
  timestamp: string | null;
  "georss:point": [number, number] | null;
}

export interface LegacyStationInfo {
  station: string;
  "georss:point": [number, number] | null;
  trains: LegacyTrain[];
}

export interface LegacyTrainRow {
  stationShortCode: string;
  stationUICCode: number;
  type: string;
  trainStopping: boolean;
  commercialStop: boolean;
  cancelled: boolean;
  scheduledTime: string;
  actualTime: string | null;
  liveEstimateTime: string | null;
  differenceInMinutes: number | null;
  stopSector: string | null;
  commercialTrack: string | null;
  causes: unknown[];
  "georss:point": [number, number] | null;
}

export interface LegacyTrainInfo {
  guid: string;
  trainNumber: number;
  departureDate: string;
  trainType: string;
  trainCategory: string;
  commuterLineID: string;
  operatorShortCode: string;
  cancelled: boolean;
  runningCurrently: boolean;
  version: number;
  timetableType: string;
  timetableAcceptanceDate: string;
  speed: number | null;
  timestamp: string | null;
  "georss:point": [number, number] | null;
  item: LegacyTrainRow[];
}

export interface LegacyApi {
  getStationInfo(stationCode: string, cb: LegacyCallback<LegacyStationInfo>): void;
  getTrains(cb: LegacyCallback<LegacyTrain[]>): void;
  getTrain(guid: string, cb: LegacyCallback<LegacyTrainInfo>): void;
}
