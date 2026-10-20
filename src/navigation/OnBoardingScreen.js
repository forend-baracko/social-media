import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { COLORS, RADIUS, SPACE } from '../constants/theme';
import PageOne from '../components/onboarding/PageOne';
import PageTwo from '../components/onboarding/PageTwo';
import PageThree from '../components/onboarding/PageThree';

export default function OnBoardingScreen({ navigation }) {
    const [currentPage, setCurrentPage] = useState(1);

    const handleNext = () => {
        if (currentPage < 3) {
            setCurrentPage(currentPage + 1); // Goes Page 1 -> Page 2 -> Page 3
        }
        else {
            navigation.replace('Login'); // Finishes onboarding on Page 3
        }
    }

    const handleBack = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity onPress={handleNext}>
                <Text style={styles.font}>Continue</Text>
            </TouchableOpacity>

            {currentPage === 1 && <PageOne />}
            {currentPage === 2 && <PageTwo />}
            {currentPage === 3 && <PageThree />}

            <TouchableOpacity onPress={handleBack}>
                <Text style={styles.font}>Back</Text>
            </TouchableOpacity>
        </SafeAreaView>

    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    font: {
        color: COLORS.text_primary,
        fontSize: 20,
    }
})