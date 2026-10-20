import React from "react";
import { SafeAreaView, View, Text } from 'react-native';
import { COLORS, SPACE, RADIUS } from './contants/theme.js';

const LoginScreen = ({ navigation }) => {
    <SafeAreaView style={styles.safe}> 
        <View>
            <Text>Hello Test</Text>
        </View>
    </SafeAreaView>
}

const styles = StyleSheet.create({
    safe: {
        backgroundColor: COLORS.primary
    }
})

export default LoginScreen;