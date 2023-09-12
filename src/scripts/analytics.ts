/*
 * Copyright (c) 2023. Arkin Solomon.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied limitations under the License.
 */

/**
 * Data to display on a chart using time.
 * 
 * @typedef {Object} TimeChartData
 * @property {Object[]} datasets The datasets of the chart, since we're only displaying downloads, this will always have a size of one.
 * @property {string} datasets.borderColor The border color of the dataset.
 * @property {string} datasets.borderColor The background color color of the dataset.
 * @property {string} label The label of the data
 * @property {boolean} fill True if the chart should be filled.
 * @property {Object[]} datasets.data The x, y coordinates of the data.
 * @property {number} datasets.data.x The timestamp of the analytics data.
 * @property {number} datasets.data.y The number of downloads for the data.
 */
export type TimeChartData = {
  //   datasets: [{
  //   //   borderColor?: string;
  //   //   backgroundColor?: string;
  //   //   label?: string;
  //   //   fill?: boolean;

  //   // }];
  //   data: {
  //     x: DateTime;
  //     y: number;
  //   }[];
  // }
  
  x: DateTime;
  y: number;
};


/**
 * The analytics data for a single hour.
 * 
 * @typedef {Object} AnalyticsData
 * @property {DateTime} timestamp The timestamp of the hour which the analytics data was taken in.
 * @property {number} downloads The number of downloads in the hour.
 */
export type AnalyticsData = {
  timestamp: DateTime;
  downloads: number;
};

import RegistryError from './registryError';
import * as tokenStorage from './tokenStorage';
import * as http from './http';
import HTTPMethod from 'http-method-enum';
import { DateTime, Duration } from 'luxon';

/**
 * Get the analytics data for the specified time using the current credentials.
 * 
 * @param {string} packageId The id of the package to get the analytics of 
 * @param {string} packageVersion The version string of the package to get the analytics of.
 * @param {Date} after The date after which to get the analytics.
 * @param {Date} [before] The date before which to get the analytics. Defaults to now.
 * @returns {Promise<AnalyticsData[]>} The analytics data for the specified time.
 * @throws {RegistryError} Error thrown if there was a response error.
 */
export async function getAnalytics(packageId: string, packageVersion: string, after: DateTime, before = DateTime.now().startOf('day')): Promise<AnalyticsData[]> {
  const token = tokenStorage.checkAuth();
  if (!token)
    throw new RegistryError(401, 'Unauthorized');
  
  const response = await http.httpRequest(`${window.REGISTRY_URL}/analytics/${packageId}/${packageVersion.toString()}?after=${after.valueOf()}&before=${before.valueOf()}`, HTTPMethod.GET, token, {});
  if (response.status !== 200)
    throw new RegistryError(response.status, response.responseText ?? response.statusText);
  
  const data = JSON.parse(response.responseText) as (Omit<AnalyticsData, 'timestamp'> & { timestamp: DateTime | string; })[];
  data.forEach(d => d.timestamp = DateTime.fromISO(d.timestamp as string));
  return data as AnalyticsData[];
}

/**
 * Format analytics data from {@code minDate} to {@code maxDate}. Ignores any data that is outside of this range. Formatting involves setting any dates without values to zero.
 * 
 * @param {AnalyticsData[]} analyticsData The data to format.
 * @param {DateTime} minDate The starting date to format the data.
 * @param {DateTime} maxDate The ending date up to which to format the data.
 * @returns {TimeChartData[]} The formatted data.
 */
export function formatAnalyticsDataToDays(analyticsData: AnalyticsData[], minDate: DateTime, maxDate: DateTime): TimeChartData[] {
  analyticsData = [...analyticsData];
  let currDate = minDate;
  const dMap = new Map<string, number>();
  while (currDate.toISODate() !== maxDate.plus(Duration.fromObject({ days: 1 })).toISODate()) {
    const key = currDate.toISODate()!;
    let totalDailyDownloads = dMap.get(key) ?? 0;

    // Remove the analytics that we already used
    analyticsData = analyticsData.filter(({ timestamp, downloads }) => {
      if (timestamp.toISODate() === key) {
        totalDailyDownloads += downloads;
        return false;
      }

      return true;
    });

    dMap.set(key, totalDailyDownloads);
    currDate = currDate.plus(Duration.fromObject({ days: 1 }));
  }
  const data: TimeChartData[] = [];
  for (const [key, downloads] of dMap.entries()) {

    const date = DateTime.fromISO(key);
    data.push({
      x: date,
      y: downloads
    });
  }

  return data;
}