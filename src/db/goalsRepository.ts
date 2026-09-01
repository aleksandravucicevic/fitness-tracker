import AsyncStorage from "@react-native-async-storage/async-storage";

export type GoalPeriod = 'daily' | 'weekly';

export interface SingleGoalSet {
    stepsGoal?: number,
    distanceGoalKm?: number;
    durationGoalMins?: number;
}

export interface GoalsData {
  daily: SingleGoalSet;
  weekly: SingleGoalSet;
}

const GOALS_KEY = '@user_fitness_goals';

export const DEFAULT_GOALS: GoalsData = {
    daily: {
        stepsGoal: 10000,
        distanceGoalKm: 5,
        durationGoalMins: 30,
    },
    weekly: {
        stepsGoal: 70000,
        distanceGoalKm: 30,
        durationGoalMins: 210,
    },
};

export const getGoals = async () : Promise<GoalsData> => {
    try {
        const jsonValue = await AsyncStorage.getItem(GOALS_KEY);
        if(!jsonValue)
            return DEFAULT_GOALS;

        const parsed = JSON.parse(jsonValue);

        if(!parsed.daily || !parsed.weekly){
            console.log('Detektovan stari format ciljeva...');
            await saveGoals(DEFAULT_GOALS);
            return DEFAULT_GOALS;
        }

        return parsed;
    } catch (error) {
        console.error('Greška pri učitavanju ciljeva:', error);
        return DEFAULT_GOALS;
    }
};

export const saveGoals = async (goals: GoalsData): Promise<void> => {
    try {
        const jsonValue = JSON.stringify(goals);
        await AsyncStorage.setItem(GOALS_KEY, jsonValue);
    } catch (error) {
        console.error('Greška pri čuvanju ciljeva:', error);
    }
};