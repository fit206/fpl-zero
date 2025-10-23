import { Bootstrap, Fixture, PicksResponse } from './types';

const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';

const fetchWithHeaders = async (url: string) => {
  console.log('FPL API: Fetching URL:', url);
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });

  console.log('FPL API: Response status:', response.status);
  if (!response.ok) {
    const errorText = await response.text();
    console.error('FPL API: Error response:', errorText);
    throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
  }

  return response.json();
};

export const getBootstrap = async (): Promise<Bootstrap> => {
  const url = `${FPL_BASE_URL}/bootstrap-static/`;
  return fetchWithHeaders(url);
};

export const getFixtures = async (eventId: number): Promise<Fixture[]> => {
  const url = `${FPL_BASE_URL}/fixtures/?event=${eventId}`;
  return fetchWithHeaders(url);
};

export const getPicks = async (entryId: number, eventId: number): Promise<PicksResponse> => {
  const url = `${FPL_BASE_URL}/entry/${entryId}/event/${eventId}/picks/`;
  try {
    return await fetchWithHeaders(url);
  } catch (error: any) {
    console.error('getPicks error:', error);
    if (error.message?.includes('404')) {
      const notFoundError = new Error('Team ID tiada data picks untuk GW ini');
      (notFoundError as any).code = 'NOT_FOUND';
      throw notFoundError;
    }
    throw error;
  }
};

export const getEntry = async (entryId: number): Promise<{player_name: string, name: string}> => {
  const url = `${FPL_BASE_URL}/entry/${entryId}/`;
  return fetchWithHeaders(url);
};
