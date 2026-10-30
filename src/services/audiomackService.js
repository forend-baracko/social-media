import { AUDIOMACK_CONFIG } from '../constants/config';

// Curated high-fidelity mock data with working preview audio for fallback & development
export const MOCK_TRACKS = [
    {
       id: 'track-1',
        title: 'Fallin',
        artist: 'December Avenue ft. Clara Benin',
        album: 'Fallin',
        duration: '4:17',
        artwork: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
        audioUrl: 'fallin.mp3',
        plays: '400M',
        genre: 'OPM',
        lyrics: [
            { time: 0, text: '♪ (Intro Instrumental) ♪' },
            { time: 15, text: 'I think I am fallin for you...' },
            { time: 28, text: 'And I do not know what to do...' },
            { time: 42, text: 'Every look in your eyes takes my breath away' },
            { time: 60, text: 'Will you stay with me tonight?' },
            { time: 85, text: '♪ (Guitar Solo) ♪' },
            { time: 120, text: 'Holding on to every single word you said' },
            { time: 150, text: 'Forever standard in my head...' },
        ],
    },
    {
        id: 'track-2',
        title: 'Blinding Lights',
        artist: 'The Weeknd',
        album: 'After Hours',
        duration: '3:20',
        artwork: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
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
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
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
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
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
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
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
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
        plays: '450M',
        genre: 'Afrobeats'
    },
    {
        id: 'track-7',
        title: 'Shape of You',
        artist: 'Ed Sheeran',
        album: '÷ (Divide)',
        duration: '3:53',
        artwork: 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=400&q=80',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
        plays: '3.6B',
        genre: 'Pop'
    },
    {
        id: 'track-8',
        title: 'Bad Guy',
        artist: 'Billie Eilish',
        album: 'WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?',
        duration: '3:14',
        artwork: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&q=80',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
        plays: '2.1B',
        genre: 'Electropop'
    },
    {
        id: 'track-9',
        title: 'Save Your Tears',
        artist: 'The Weeknd & Ariana Grande',
        album: 'After Hours (Remix)',
        duration: '3:11',
        artwork: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
        plays: '1.4B',
        genre: 'Synthpop'
    },
    {
        id: 'track-10',
        title: 'Flowers',
        artist: 'Miley Cyrus',
        album: 'Endless Summer Vacation',
        duration: '3:20',
        artwork: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&q=80',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
        plays: '1.9B',
        genre: 'Pop'
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
