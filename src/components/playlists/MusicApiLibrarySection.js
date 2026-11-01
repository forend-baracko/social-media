import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, RADIUS, SPACE } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import {
  connectMusicApiUser,
  createMusicApiSignInUrl,
  getMusicApiConfig,
  getMusicApiPlaylistItems,
  getMusicApiPlaylists,
} from '../../services/musicApiService';

const storageKey = (uid) => `@musicapi_connection_${uid}`;

const MusicApiLibrarySection = () => {
  const { user } = useAuth();
  const [connection, setConnection] = useState(null);
  const handledCallbacks = useRef(new Set());
  const [config, setConfig] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [nextPlaylistsParam, setNextPlaylistsParam] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [nextTracksParam, setNextTracksParam] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [isLoadingMoreTracks, setIsLoadingMoreTracks] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [trackError, setTrackError] = useState('');

  useEffect(() => {
    const uid = user?.uid;
    if (!uid) {
      setConnection(null);
      return undefined;
    }

    let active = true;
    setConnection(null);
    AsyncStorage.getItem(storageKey(uid))
      .then((storedConnection) => {
        if (!active || !storedConnection) return;
        const parsedConnection = JSON.parse(storedConnection);
        if (typeof parsedConnection?.sessionToken === 'string') {
          setConnection(parsedConnection);
        }
      })
      .catch((requestError) => {
        console.warn('Could not load the saved MusicAPI connection:', requestError);
        if (active) {
          Alert.alert(
            'Music library unavailable',
            'Could not load your saved music-service connection.'
          );
        }
      });

    const handleCallback = async (url) => {
      if (!url || handledCallbacks.current.has(url)) return;
      const callback = Linking.parse(url);
      if (
        callback.scheme !== 'spotibai' ||
        callback.hostname !== 'musicapi' ||
        !['callback', '/callback'].includes(callback.path)
      ) {
        return;
      }

      handledCallbacks.current.add(url);
      const data64 = callback.queryParams?.data64;
      if (typeof data64 !== 'string' || !data64) {
        Alert.alert(
          'Music service connection failed',
          'MusicAPI did not return a sign-in result. Please try connecting again.'
        );
        return;
      }

      try {
        const result = await connectMusicApiUser(user, data64);
        await AsyncStorage.setItem(storageKey(uid), JSON.stringify(result));
        if (active) {
          setConnection(result);
          Alert.alert(
            'Music service connected',
            'Your source playlists are now available in Your Library.'
          );
        }
      } catch (requestError) {
        Alert.alert('Music service connection failed', requestError.message);
      }
    };

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleCallback(url);
    });
    Linking.getInitialURL()
      .then(handleCallback)
      .catch((requestError) => {
        console.warn('Could not read the MusicAPI callback URL:', requestError);
      });

    return () => {
      active = false;
      subscription.remove();
    };
  }, [user]);

  useEffect(() => {
    let active = true;
    getMusicApiConfig()
      .then((result) => {
        if (active) setConfig(result);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });
    return () => {
      active = false;
    };
  }, []);

  const loadPlaylists = useCallback(
    async (sessionToken, nextParam = null) => {
      if (!user?.uid || !sessionToken) return;
      const isNextPage = Boolean(nextParam);
      if (isNextPage) setIsLoadingMore(true);
      else setIsLoading(true);
      setError('');

      try {
        const page = await getMusicApiPlaylists(user, sessionToken, nextParam);
        setPlaylists((current) =>
          isNextPage ? [...current, ...(page.results || [])] : page.results || []
        );
        setNextPlaylistsParam(page.nextParam || null);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [user]
  );

  useEffect(() => {
    setPlaylists([]);
    setNextPlaylistsParam(null);
    setError('');
    if (connection?.sessionToken) {
      loadPlaylists(connection.sessionToken);
    }
  }, [connection?.sessionToken, loadPlaylists, user?.uid]);

  const loadPlaylistItems = useCallback(
    async (playlist, nextParam = null) => {
      if (!connection?.sessionToken) return;
      const isNextPage = Boolean(nextParam);
      if (isNextPage) setIsLoadingMoreTracks(true);
      else setIsLoadingTracks(true);
      setTrackError('');

      try {
        const page = await getMusicApiPlaylistItems(
          user,
          connection.sessionToken,
          playlist.id,
          nextParam
        );
        setTracks((current) =>
          isNextPage ? [...current, ...(page.results || [])] : page.results || []
        );
        setNextTracksParam(page.nextParam || null);
      } catch (requestError) {
        setTrackError(requestError.message);
      } finally {
        setIsLoadingTracks(false);
        setIsLoadingMoreTracks(false);
      }
    },
    [connection?.sessionToken, user]
  );

  const openPlaylist = (playlist) => {
    setSelectedPlaylist(playlist);
    setTracks([]);
    setNextTracksParam(null);
    loadPlaylistItems(playlist);
  };

  const handleConnect = async () => {
    if (!user?.uid) {
      throw new Error('Sign in to your Spotibai account before connecting a service.');
    }
    setIsConnecting(true);
    setError('');
    try {
      const currentConfig = config || (await getMusicApiConfig());
      const url = createMusicApiSignInUrl(currentConfig, user.uid);
      await Linking.openURL(url);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user?.uid) return;
    try {
      await AsyncStorage.removeItem(storageKey(user.uid));
      setConnection(null);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const renderLoadMore = (loading, onPress, label) => (
    <TouchableOpacity
      style={styles.loadMoreButton}
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={COLORS.primary} />
      ) : (
        <Text style={styles.loadMoreText}>{label}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.heading}>Connected music library</Text>
          <Text style={styles.subtitle}>
            Browse playlists from a supported music service.
          </Text>
        </View>
        {connection?.sessionToken ? (
          <TouchableOpacity
            onPress={handleDisconnect}
            accessibilityRole="button"
            accessibilityLabel="Disconnect music service"
          >
            <Text style={styles.disconnectText}>Disconnect</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.noteCard}>
        <Text style={styles.noteText}>
          MusicAPI provides library details, not full audio streams. Connected
          tracks appear here as references and will not be added to Spotibai
          playback.
        </Text>
      </View>

      {!connection?.sessionToken ? (
        <>
          <TouchableOpacity
            style={[
              styles.connectButton,
              (!config?.configured || !user?.uid || isConnecting) &&
                styles.disabledButton,
            ]}
            onPress={handleConnect}
            disabled={!config?.configured || !user?.uid || isConnecting}
            accessibilityRole="button"
          >
            {isConnecting ? (
              <ActivityIndicator color={COLORS.black} />
            ) : (
              <Text style={styles.connectButtonText}>
                {config?.configured
                  ? user?.uid
                    ? 'Connect a music service'
                    : 'Sign in to connect'
                  : 'MusicAPI setup required'}
              </Text>
            )}
          </TouchableOpacity>
          {!config?.configured ? (
            <Text style={styles.setupText}>
              Configure the MusicAPI backend values in your server .env and
              register the return URL in the MusicAPI dashboard.
            </Text>
          ) : null}
        </>
      ) : (
        <>
          <View style={styles.connectedRow}>
            <Text style={styles.connectedText}>
              Connected: {connection.integrationType || 'music service'}
            </Text>
            <TouchableOpacity
              onPress={() => loadPlaylists(connection.sessionToken)}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Refresh connected playlists"
            >
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {isLoading && playlists.length === 0 ? (
            <ActivityIndicator
              style={styles.loading}
              color={COLORS.primary}
            />
          ) : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {!isLoading && !error && playlists.length === 0 ? (
            <Text style={styles.emptyText}>No playlists found.</Text>
          ) : null}
          {playlists.map((playlist) => (
            <TouchableOpacity
              key={playlist.id}
              style={styles.playlistRow}
              onPress={() => openPlaylist(playlist)}
              accessibilityRole="button"
              accessibilityLabel={`View ${playlist.name}`}
            >
              {playlist.imageUrl ? (
                <Image source={{ uri: playlist.imageUrl }} style={styles.artwork} />
              ) : (
                <View style={[styles.artwork, styles.artworkPlaceholder]}>
                  <Text style={styles.artworkIcon}>♫</Text>
                </View>
              )}
              <View style={styles.playlistCopy}>
                <Text style={styles.playlistName} numberOfLines={1}>
                  {playlist.name}
                </Text>
                <Text style={styles.playlistMeta}>
                  {playlist.totalItems ?? '—'} tracks · source library
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
          {nextPlaylistsParam
            ? renderLoadMore(
                isLoadingMore,
                () => loadPlaylists(connection.sessionToken, nextPlaylistsParam),
                'Load more playlists'
              )
            : null}
        </>
      )}

      {error && !connection?.sessionToken ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

      <Modal
        visible={Boolean(selectedPlaylist)}
        animationType="slide"
        onRequestClose={() => setSelectedPlaylist(null)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setSelectedPlaylist(null)}
              accessibilityRole="button"
              accessibilityLabel="Close playlist"
            >
              <Text style={styles.backText}>‹ Library</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {selectedPlaylist?.name || 'Playlist'}
            </Text>
            <View style={styles.headerSpacer} />
          </View>
          <Text style={styles.modalNotice}>
            Track information from the connected service; playback is not
            available through MusicAPI.
          </Text>
          <ScrollView contentContainerStyle={styles.trackList}>
            {isLoadingTracks && tracks.length === 0 ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : null}
            {trackError ? <Text style={styles.errorText}>{trackError}</Text> : null}
            {!isLoadingTracks && !trackError && tracks.length === 0 ? (
              <Text style={styles.emptyText}>No tracks found in this playlist.</Text>
            ) : null}
            {tracks.map((track, index) => {
              const artist = (track.artists || [])
                .map((item) => item?.name)
                .filter(Boolean)
                .join(', ');
              return (
                <View
                  key={`${track.id || track.name}-${index}`}
                  style={styles.trackRow}
                >
                  {track.imageUrl ? (
                    <Image source={{ uri: track.imageUrl }} style={styles.trackArtwork} />
                  ) : (
                    <View style={[styles.trackArtwork, styles.artworkPlaceholder]}>
                      <Text style={styles.artworkIcon}>♪</Text>
                    </View>
                  )}
                  <View style={styles.playlistCopy}>
                    <Text style={styles.trackName} numberOfLines={1}>
                      {track.name || 'Unknown track'}
                    </Text>
                    <Text style={styles.playlistMeta} numberOfLines={1}>
                      {artist || track.album?.name || 'Unknown artist'}
                    </Text>
                  </View>
                </View>
              );
            })}
            {nextTracksParam
              ? renderLoadMore(
                  isLoadingMoreTracks,
                  () => loadPlaylistItems(selectedPlaylist, nextTracksParam),
                  'Load more tracks'
                )
              : null}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: SPACE.lg,
    paddingTop: SPACE.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACE.md,
  },
  headerCopy: {
    flex: 1,
    marginRight: SPACE.sm,
  },
  heading: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  noteCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: RADIUS.sm,
    padding: SPACE.sm,
    marginBottom: SPACE.md,
  },
  noteText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  connectButton: {
    minHeight: 44,
    borderRadius: RADIUS.circle,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACE.md,
  },
  disabledButton: {
    opacity: 0.55,
  },
  connectButtonText: {
    color: COLORS.black,
    fontSize: 14,
    fontWeight: '700',
  },
  setupText: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: SPACE.sm,
  },
  connectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACE.sm,
  },
  connectedText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  refreshText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  disconnectText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  loading: {
    marginVertical: SPACE.md,
  },
  errorText: {
    color: '#FF7070',
    fontSize: 12,
    lineHeight: 18,
    marginVertical: SPACE.sm,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    paddingVertical: SPACE.md,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACE.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  artwork: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.xs,
  },
  artworkPlaceholder: {
    backgroundColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkIcon: {
    color: COLORS.textSecondary,
    fontSize: 20,
  },
  playlistCopy: {
    flex: 1,
    marginLeft: SPACE.sm,
  },
  playlistName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  playlistMeta: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
  chevron: {
    color: COLORS.textMuted,
    fontSize: 22,
    marginLeft: SPACE.sm,
  },
  loadMoreButton: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACE.sm,
  },
  loadMoreText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  modal: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  modalTitle: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: SPACE.sm,
  },
  headerSpacer: {
    width: 54,
  },
  modalNotice: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
  },
  trackList: {
    paddingHorizontal: SPACE.md,
    paddingBottom: SPACE.lg,
  },
  trackRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  trackArtwork: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.xs,
  },
  trackName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default MusicApiLibrarySection;
