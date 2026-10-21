import { AUDIOMACK_CONFIG } from '../constants/config';

// Curated high-fidelity mock data for fallback & development
const MOCK_TRACKS = [
    {
        id: 'track-1',
        title: 'Starboy',
        artist: 'The Weeknd ft. Daft Punk',
        album: 'Starboy',
        duration: '3:50',
        artwork: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
        plays: '1.2B',
        genre: 'Pop / R&B'
    },
    {
        id: 'track-2',
        title: 'Blinding Lights',
        artist: 'The Weeknd',
        album: 'After Hours',
        duration: '3:20',
        artwork: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
        plays: '2.4B',
        genre: 'Synthwave'
    },
    {
        id: 'track-3',
        title: 'God\'s Plan',
        artist: 'Drake',
        album: 'Scorpion',
        duration: '3:18',
        artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80',
        plays: '1.8B',
        genre: 'Hip-Hop'
    },
    {
        id: 'track-4',
        title: 'As It Was',
        artist: 'Harry Styles',
        album: 'Harry\'s House',
        duration: '2:47',
        artwork: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&q=80',
        plays: '1.5B',
        genre: 'Indie Pop'
    },
    {
        id: 'track-5',
        title: 'Levitating',
        artist: 'Dua Lipa',
        album: 'Future Nostalgia',
        duration: '3:23',
        artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80',
        plays: '980M',
        genre: 'Dance-Pop'
    },
    {
        id: 'track-6',
        title: 'Last Last',
        artist: 'Burna Boy',
        album: 'Love, Damini',
        duration: '2:52',
        artwork: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&q=80',
        plays: '450M',
        genre: 'Afrobeats'
    }
];

/**
 * Helper to build secure request headers
 */
const getAuthHeaders = () => {
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    };

    if (AUDIOMACK_CONFIG.apiKey) {
        headers.Authorization = `Bearer ${AUDIOMACK_CONFIG.apiKey}`;
    }

    return headers;
};

/**
 * Fetch trending music from Audiomack API or mock fallback
 */
export const getTrendingMusic = async (genre = 'all') => {
    if (AUDIOMACK_CONFIG.useMockData || !AUDIOMACK_CONFIG.apiKey) {
        // Return mock data after simulated network latency
        await new Promise((resolve) => setTimeout(resolve, 350));
        return MOCK_TRACKS;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const url = `${AUDIOMACK_CONFIG.baseUrl}/trending${genre !== 'all' ? `?genre=${genre}` : ''}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders(),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(`Audiomack API error: ${response.status}. Falling back to mock data.`);
            return MOCK_TRACKS;
        }

        const data = await response.json();
        // Normalize response
        if (Array.isArray(data?.results)) {
            return data.results.map((item) => ({
                id: item.id || String(Math.random()),
                title: item.title || 'Untitled',
                artist: item.artist || item.uploader_name || 'Unknown Artist',
                album: item.album || '',
                duration: item.duration || '3:00',
                artwork: item.image || item.raw_image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
                plays: item.plays || '0',
                genre: item.genre || 'Music'
            }));
        }

        return MOCK_TRACKS;
    } catch (error) {
        console.warn('Audiomack API network failure, using fallback data:', error.message);
        return MOCK_TRACKS;
    }
};

/**
 * Search Audiomack catalog for songs, artists, or albums
 */
export const searchMusic = async (query, show = 'songs') => {
    if (!query || !query.trim()) {
        return [];
    }

    const cleanQuery = query.trim().toLowerCase();

    if (AUDIOMACK_CONFIG.useMockData || !AUDIOMACK_CONFIG.apiKey) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        return MOCK_TRACKS.filter(
            (track) =>
                track.title.toLowerCase().includes(cleanQuery) ||
                track.artist.toLowerCase().includes(cleanQuery) ||
                track.album.toLowerCase().includes(cleanQuery) ||
                track.genre.toLowerCase().includes(cleanQuery)
        );
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const encodedQuery = encodeURIComponent(cleanQuery);
        const url = `${AUDIOMACK_CONFIG.baseUrl}/search?q=${encodedQuery}&show=${show}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders(),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(`Audiomack search error: ${response.status}`);
            return MOCK_TRACKS.filter(
                (track) =>
                    track.title.toLowerCase().includes(cleanQuery) ||
                    track.artist.toLowerCase().includes(cleanQuery)
            );
        }

        const data = await response.json();
        if (Array.isArray(data?.results)) {
            return data.results.map((item) => ({
                id: item.id || String(Math.random()),
                title: item.title || 'Untitled',
                artist: item.artist || item.uploader_name || 'Unknown Artist',
                album: item.album || '',
                duration: item.duration || '3:00',
                artwork: item.image || item.raw_image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
                plays: item.plays || '0',
                genre: item.genre || 'Music'
            }));
        }

        return [];
    } catch (error) {
        console.warn('Audiomack search network error, filtering fallback data:', error.message);
        return MOCK_TRACKS.filter(
            (track) =>
                track.title.toLowerCase().includes(cleanQuery) ||
                track.artist.toLowerCase().includes(cleanQuery)
        );
    }
};

/**
 * Fetch detailed metadata for a single song
 */
export const getSongDetails = async (songId) => {
    if (AUDIOMACK_CONFIG.useMockData || !AUDIOMACK_CONFIG.apiKey) {
        return MOCK_TRACKS.find((t) => t.id === songId) || MOCK_TRACKS[0];
    }

    try {
        const response = await fetch(`${AUDIOMACK_CONFIG.baseUrl}/songs/${songId}`, {
            headers: getAuthHeaders(),
        });
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.warn('Failed to fetch song details:', error);
    }

    return MOCK_TRACKS[0];
};
