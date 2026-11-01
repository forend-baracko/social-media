import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACE, RADIUS } from '../../constants/theme';
import { MOCK_TRACKS } from '../../services/audiomackService';
import { getArtworkSource } from '../../utils/artworkHelper';

const FRIENDS_ONLINE = [
    {
        id: 'f1',
        name: 'Marcus',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
        listeningTo: 'Blinding Lights • The Weeknd',
        isLive: true,
        lastActive: 'Listening now',
    },
    {
        id: 'f2',
        name: 'Sarah',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
        listeningTo: 'Levitating • Dua Lipa',
        isLive: true,
        lastActive: 'Listening now',
    },
    {
        id: 'f3',
        name: 'David',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&q=80',
        listeningTo: "God's Plan • Drake",
        isLive: false,
        lastActive: '18m ago',
    },
    {
        id: 'f4',
        name: 'Elena',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
        listeningTo: 'Fallin • December Avenue',
        isLive: false,
        lastActive: '1h ago',
    },
];

const INITIAL_CONVERSATIONS = [
    {
        id: 'conv-1',
        friendId: 'f1',
        friendName: 'Marcus',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
        lastMessage: 'You HAVE to listen to this track on repeat 🔥',
        time: '10:42 AM',
        unread: 1,
        sharedTrack: MOCK_TRACKS[1],
        messages: [
            { id: 'm1', sender: 'them', text: 'Hey, did you catch the new album drop?', time: '10:35 AM' },
            { id: 'm2', sender: 'you', text: 'Yeah! It is so good.', time: '10:38 AM' },
            { id: 'm3', sender: 'them', text: 'You HAVE to listen to this track on repeat 🔥', time: '10:42 AM', track: MOCK_TRACKS[1] },
        ],
    },
    {
        id: 'conv-2',
        friendId: 'f2',
        friendName: 'Sarah',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
        lastMessage: 'Added your recommendations to our roadtrip playlist!',
        time: 'Yesterday',
        unread: 0,
        messages: [
            { id: 'm21', sender: 'them', text: 'Added your recommendations to our roadtrip playlist!', time: 'Yesterday' },
        ],
    },
    {
        id: 'conv-3',
        friendId: 'f4',
        friendName: 'Elena',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
        lastMessage: 'Can you invite me to the Spotify Jam session?',
        time: 'Sunday',
        unread: 0,
        messages: [
            { id: 'm31', sender: 'them', text: 'Can you invite me to the Spotify Jam session?', time: 'Sunday' },
        ],
    },
];

const MessagesModal = ({
    visible,
    onClose,
    onPlayTrack,
}) => {
    const insets = useSafeAreaInsets();
    const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
    const [activeChat, setActiveChat] = useState(null);
    const [inputText, setInputText] = useState('');

    const handleSendMessage = () => {
        if (!inputText.trim() || !activeChat) return;
        const newMsg = {
            id: `msg-${Date.now()}`,
            sender: 'you',
            text: inputText.trim(),
            time: 'Just now',
        };

        const updatedChat = {
            ...activeChat,
            lastMessage: newMsg.text,
            time: 'Just now',
            messages: [...activeChat.messages, newMsg],
        };

        setActiveChat(updatedChat);
        setConversations(prev => prev.map(c => c.id === updatedChat.id ? updatedChat : c));
        setInputText('');
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={() => {
                if (activeChat) setActiveChat(null);
                else onClose();
            }}
        >
            <View style={[styles.container, { paddingTop: insets.top }]}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => {
                            if (activeChat) setActiveChat(null);
                            else onClose();
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Text style={styles.backIcon}>‹</Text>
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>
                        {activeChat ? activeChat.friendName : 'Messages & Friends'}
                    </Text>

                    <TouchableOpacity
                        style={styles.jamBtn}
                        onPress={() => Alert.alert('Spotify Jam', 'Start a live listening session with nearby friends!')}
                    >
                        <Text style={styles.jamText}>Jam 📻</Text>
                    </TouchableOpacity>
                </View>

                {activeChat ? (
                    /* Detailed Chat Screen */
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={styles.chatContainer}
                    >
                        <ScrollView
                            style={styles.messagesScroll}
                            contentContainerStyle={{ padding: SPACE.md }}
                        >
                            {activeChat.messages.map((m) => {
                                const isYou = m.sender === 'you';
                                return (
                                    <View
                                        key={m.id}
                                        style={[
                                            styles.messageBubble,
                                            isYou ? styles.messageYou : styles.messageThem,
                                        ]}
                                    >
                                        <Text style={[styles.messageText, isYou ? styles.textYou : styles.textThem]}>
                                            {m.text}
                                        </Text>

                                        {/* Shared Song Attachment in chat */}
                                        {m.track && (
                                            <TouchableOpacity
                                                style={styles.chatTrackCard}
                                                activeOpacity={0.8}
                                                onPress={() => onPlayTrack && onPlayTrack(m.track)}
                                            >
                                                <Image source={getArtworkSource(m.track.artwork)} style={styles.chatTrackArt} />
                                                <View style={styles.chatTrackMeta}>
                                                    <Text style={styles.chatTrackTitle} numberOfLines={1}>{m.track.title}</Text>
                                                    <Text style={styles.chatTrackArtist} numberOfLines={1}>{m.track.artist}</Text>
                                                </View>
                                                <Text style={styles.chatPlayIcon}>▶</Text>
                                            </TouchableOpacity>
                                        )}

                                        <Text style={styles.messageTime}>{m.time}</Text>
                                    </View>
                                );
                            })}
                        </ScrollView>

                        {/* Input bar */}
                        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
                            <TextInput
                                style={styles.chatInput}
                                placeholder={`Message ${activeChat.friendName}...`}
                                placeholderTextColor="#777"
                                value={inputText}
                                onChangeText={setInputText}
                            />
                            <TouchableOpacity
                                style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                                onPress={handleSendMessage}
                                disabled={!inputText.trim()}
                            >
                                <Text style={styles.sendIcon}>↑</Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                ) : (
                    /* Conversations List + Live Friends Carousel */
                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={{ paddingBottom: 60 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Live Friend Activity */}
                        <Text style={styles.sectionTitle}>Friend Activity</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.friendsHorizontal}
                        >
                            {FRIENDS_ONLINE.map((friend) => (
                                <TouchableOpacity
                                    key={friend.id}
                                    style={styles.friendCard}
                                    activeOpacity={0.8}
                                    onPress={() => {
                                        Alert.alert(
                                            `${friend.name} is listening`,
                                            friend.listeningTo,
                                            [
                                                { text: 'Close', style: 'cancel' },
                                                { text: 'Listen Together', onPress: () => Alert.alert('Listening in sync with ' + friend.name) },
                                            ]
                                        );
                                    }}
                                >
                                    <View style={styles.avatarBox}>
                                        <Image source={{ uri: friend.avatar }} style={styles.friendAvatar} />
                                        {friend.isLive && (
                                            <View style={styles.liveIndicator}>
                                                <Text style={styles.liveDot}>●</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.friendName}>{friend.name}</Text>
                                    <Text style={styles.friendListening} numberOfLines={2}>
                                        {friend.listeningTo}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Messages / Shared Tracks */}
                        <Text style={styles.sectionTitle}>Conversations</Text>
                        {conversations.map((conv) => (
                            <TouchableOpacity
                                key={conv.id}
                                style={styles.conversationRow}
                                activeOpacity={0.7}
                                onPress={() => setActiveChat(conv)}
                            >
                                <Image source={{ uri: conv.avatar }} style={styles.convAvatar} />
                                <View style={styles.convInfo}>
                                    <View style={styles.convHeader}>
                                        <Text style={styles.convName}>{conv.friendName}</Text>
                                        <Text style={styles.convTime}>{conv.time}</Text>
                                    </View>
                                    <Text style={styles.convLastMessage} numberOfLines={1}>
                                        {conv.lastMessage}
                                    </Text>
                                </View>
                                {conv.unread > 0 && (
                                    <View style={styles.unreadBadge}>
                                        <Text style={styles.unreadText}>{conv.unread}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACE.md,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#222',
    },
    backBtn: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backIcon: {
        color: COLORS.textPrimary,
        fontSize: 34,
        fontWeight: '300',
        lineHeight: 36,
    },
    headerTitle: {
        color: COLORS.textPrimary,
        fontSize: 17,
        fontWeight: 'bold',
    },
    jamBtn: {
        backgroundColor: '#262626',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: RADIUS.circle,
        borderWidth: 1,
        borderColor: '#333',
    },
    jamText: {
        color: COLORS.primary,
        fontSize: 13,
        fontWeight: 'bold',
    },
    scroll: {
        flex: 1,
    },
    sectionTitle: {
        color: COLORS.textPrimary,
        fontSize: 18,
        fontWeight: 'bold',
        paddingHorizontal: SPACE.md,
        paddingTop: SPACE.md,
        paddingBottom: SPACE.sm,
    },
    friendsHorizontal: {
        paddingHorizontal: SPACE.md,
        paddingBottom: SPACE.md,
        gap: 12,
    },
    friendCard: {
        width: 110,
        backgroundColor: '#1C1C1C',
        borderRadius: RADIUS.md,
        padding: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#262626',
    },
    avatarBox: {
        position: 'relative',
        marginBottom: 6,
    },
    friendAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
    },
    liveIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#121212',
        borderRadius: 10,
        paddingHorizontal: 3,
    },
    liveDot: {
        color: COLORS.primary,
        fontSize: 12,
    },
    friendName: {
        color: COLORS.textPrimary,
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: 3,
    },
    friendListening: {
        color: COLORS.textSecondary,
        fontSize: 10,
        textAlign: 'center',
    },
    conversationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACE.md,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#202020',
    },
    convAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: SPACE.md,
    },
    convInfo: {
        flex: 1,
    },
    convHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    convName: {
        color: COLORS.textPrimary,
        fontSize: 15,
        fontWeight: 'bold',
    },
    convTime: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
    convLastMessage: {
        color: COLORS.textSecondary,
        fontSize: 13,
    },
    unreadBadge: {
        backgroundColor: COLORS.primary,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    unreadText: {
        color: COLORS.black,
        fontSize: 11,
        fontWeight: 'bold',
    },
    // Detailed Chat
    chatContainer: {
        flex: 1,
    },
    messagesScroll: {
        flex: 1,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 10,
    },
    messageYou: {
        alignSelf: 'flex-end',
        backgroundColor: COLORS.primary,
        borderBottomRightRadius: 2,
    },
    messageThem: {
        alignSelf: 'flex-start',
        backgroundColor: '#262626',
        borderBottomLeftRadius: 2,
    },
    messageText: {
        fontSize: 14,
        lineHeight: 19,
    },
    textYou: {
        color: COLORS.black,
        fontWeight: '500',
    },
    textThem: {
        color: COLORS.textPrimary,
    },
    messageTime: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    chatTrackCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: 8,
        borderRadius: 8,
        marginTop: 8,
    },
    chatTrackArt: {
        width: 36,
        height: 36,
        borderRadius: 4,
        marginRight: 8,
    },
    chatTrackMeta: {
        flex: 1,
    },
    chatTrackTitle: {
        color: COLORS.black,
        fontWeight: 'bold',
        fontSize: 12,
    },
    chatTrackArtist: {
        color: '#222',
        fontSize: 10,
    },
    chatPlayIcon: {
        fontSize: 16,
        color: COLORS.black,
        paddingHorizontal: 4,
    },
    inputBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACE.md,
        paddingTop: 10,
        backgroundColor: '#181818',
        borderTopWidth: 1,
        borderTopColor: '#262626',
    },
    chatInput: {
        flex: 1,
        backgroundColor: '#262626',
        borderRadius: RADIUS.circle,
        paddingHorizontal: SPACE.md,
        paddingVertical: 10,
        color: COLORS.textPrimary,
        fontSize: 14,
        marginRight: 8,
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendBtnDisabled: {
        backgroundColor: '#333',
    },
    sendIcon: {
        color: COLORS.black,
        fontSize: 20,
        fontWeight: 'bold',
    },
});

export default MessagesModal;
