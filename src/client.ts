import { fetch as undiciFetch } from "undici";
import {
  ClientOptions,
  FetchLike,
  StationLiveTrainOptions,
  StationMetadata,
  Train,
  TrainLocation,
  VrClient,
} from "./types";

const DEFAULT_BASE_URL = "https://rata.digitraffic.fi/api/v1";

function createError(status: number, statusText: string, url: string, body: string): Error {
  const message = `Request failed (${status} ${statusText}) for ${url}${body ? `: ${body}` : ""}`;
  return new Error(message);
}

function buildQueryString(options: StationLiveTrainOptions): string {
  const params = new URLSearchParams();

  if (typeof options.arrivedTrains === "number") {
    params.set("arrived_trains", String(options.arrivedTrains));
  }
  if (typeof options.arrivingTrains === "number") {
    params.set("arriving_trains", String(options.arrivingTrains));
  }
  if (typeof options.departedTrains === "number") {
    params.set("departed_trains", String(options.departedTrains));
  }
  if (typeof options.departingTrains === "number") {
    params.set("departing_trains", String(options.departingTrains));
  }
  if (typeof options.includeNonstopping === "boolean") {
    params.set("include_nonstopping", String(options.includeNonstopping));
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function createClient(options: ClientOptions = {}): VrClient {
  const baseUrl = options.baseUrl || DEFAULT_BASE_URL;
  const fetchImpl: FetchLike = options.fetchImpl || (undiciFetch as unknown as FetchLike);

  async function getJson<T>(path: string): Promise<T> {
    const url = `${baseUrl}${path}`;
    const response = await fetchImpl(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    const body = await response.text();
    if (!response.ok) {
      throw createError(response.status, response.statusText, url, body);
    }

    return JSON.parse(body) as T;
  }

  async function getStations(): Promise<StationMetadata[]> {
    return getJson<StationMetadata[]>("/metadata/stations");
  }

  async function getStationLiveTrains(stationCode: string, stationOptions: StationLiveTrainOptions = {}): Promise<Train[]> {
    const query = buildQueryString(stationOptions);
    return getJson<Train[]>(`/live-trains/station/${encodeURIComponent(stationCode)}${query}`);
  }

  async function getTrain(trainNumber: number, departureDate = "latest"): Promise<Train | null> {
    const trains = await getJson<Train[]>(`/trains/${encodeURIComponent(departureDate)}/${trainNumber}`);
    if (!Array.isArray(trains) || trains.length === 0) {
      return null;
    }
    return trains[0];
  }

  async function getLatestTrainLocations(): Promise<TrainLocation[]> {
    return getJson<TrainLocation[]>("/train-locations/latest");
  }

  async function getTrainLocations(trainNumber: number, departureDate = "latest"): Promise<TrainLocation[]> {
    return getJson<TrainLocation[]>(`/train-locations/${encodeURIComponent(departureDate)}/${trainNumber}`);
  }

  return {
    getStations,
    getStationLiveTrains,
    getTrain,
    getLatestTrainLocations,
    getTrainLocations,
  };
}
