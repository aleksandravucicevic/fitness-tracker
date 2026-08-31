import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Goals {
    weeklySteps: number,
    weeklyDistanceKm: number;
    weeklyDurationMins: number;
}

const GOALS_KEY = '@user_fitness_goals';

export const DEFAULT_GOALS: Goals = {
    weeklySteps: 10000,
    weeklyDistanceKm: 20,
    weeklyDurationMins: 150,
};

export const getGoals = async () : Promise<Goals> => {
    try {
        const jsonValue = await AsyncStorage.getItem(GOALS_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : DEFAULT_GOALS;
    } catch (error) {
        console.error('Greška pri učitavanju ciljeva:', error);
        return DEFAULT_GOALS;
    }
};

export const saveGoals = async (goals: Goals): Promise<void> => {
    try {
        const jsonValue = JSON.stringify(goals);
        await AsyncStorage.setItem(GOALS_KEY, jsonValue);
    } catch (error) {
        console.error('Greška pri čuvanju ciljeva:', error);
    }
};