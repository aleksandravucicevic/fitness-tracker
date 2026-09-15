import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { Pedometer } from 'expo-sensors';
import { LocationPoint, ActivityType } from '../models/Activity';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

const MAX_ACCEPTABLE_ACCURACY = 20;
const MIN_DISTANCE_TO_COUNT = 0.5;
const MAX_REALISTIC_SPEED_MS = 12;

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const f1 = (lat1 * Math.PI) / 180;
    const f2 = (lat2 * Math.PI) / 180;
    const deltaF = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(deltaF / 2) * Math.sin(deltaF / 2) + Math.cos(f1) * Math.cos(f2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
};

export const useTracker = () => {
    const {t, i18n} = useTranslation();
    const navigation = useNavigation<any>();
    const [isTracking, setIsTracking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [activityType, setActivityType] = useState<ActivityType>('RUNNING');
    const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);

    const [duration, setDuration] = useState(0);
    const [distance, setDistance] = useState(0);
    const [currentSpeed, setCurrentSpeed] = useState(0);
    const [route, setRoute] = useState<LocationPoint[]>([]);
    const [currentLocation, setCurrentLocation] = useState<LocationPoint | null>(null);
    const [steps, setSteps] = useState(0);
    const [isPedometerAvailable, setIsPedometerAvailable] = useState(false);

    const locationSubscription = useRef<Location.LocationSubscription | null>(null);
    const pedometerSubscription = useRef<{ remove: () => void } | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if(isTracking && !isPaused) {
            timerRef.current = setInterval(() => {
                setDuration((prev) => prev + 1);
            }, 1000);
        } else if(timerRef.current){
            clearInterval(timerRef.current);
        }

        return () => {
            if(timerRef.current)
                clearInterval(timerRef.current);
        };
    }, [isTracking, isPaused]);

    const startTracking = async (): Promise<boolean> => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        const isGranted = status === 'granted';
        setHasLocationPermission(isGranted);
        if(!isGranted) {
            Alert.alert(t('tracking.permissionDeniedTitle'), t('tracking.permissionDeniedMessage'), [
                { text: t('tracking.enterManually'), onPress: () => navigation.navigate('ManualActivity') },
                { text: t('tracking.cancel'), style: 'cancel' },
            ]);
        }
      
        let servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
            try {
                await Location.enableNetworkProviderAsync();
                await new Promise((resolve) => setTimeout(resolve, 600));
                servicesEnabled = await Location.hasServicesEnabledAsync();
            } catch (error) {
                servicesEnabled = false;
            }
        }

        if (!servicesEnabled) {
            Alert.alert(
                t('tracking.gpsDisabledTitle'),
                t('tracking.gpsDisabledMessage'),
                [
                    { text: t('tracking.enterManually'), onPress: () => navigation.navigate('ManualActivity') },
                    { text: t('tracking.cancel'), style: 'cancel' },
                ]
            );
            return false;
        }
        
        setDuration(0);
        setDistance(0);
        setRoute([]);
        setIsTracking(true);
        setIsPaused(false);

        // ako je pedometar dostupan na uređaju i korisnik da dozvolu da se koristi
        // koristiće se tokom treninga
        try {
            const available = await Pedometer.isAvailableAsync();
            setIsPedometerAvailable(available);

            if(available) {
                try {
                    await Pedometer.requestPermissionsAsync();
                } catch(permError) {
                    console.warn('Dozvola za pedometar nije tražena! Postoji mogućnost da nije podržano na uređaju... ', permError);
                }

                pedometerSubscription.current = Pedometer.watchStepCount((result) => {
                    setSteps(result.steps);
                });
            }
        } catch(error) {
            console.warn('Pedometar nije dostupan na uređaju: ', error);
            setIsPedometerAvailable(false);
        }

        try {
            const initial = await Location.getCurrentPositionAsync({accuracy: Location.Accuracy.High});
            
            if (!initial.coords.accuracy || initial.coords.accuracy <= MAX_ACCEPTABLE_ACCURACY) {
                const initialPoint: LocationPoint = {
                    latitude: initial.coords.latitude,
                    longitude: initial.coords.longitude,
                    altitude: initial.coords.altitude,
                    speed: initial.coords.speed,
                    timestamp: initial.timestamp,
                };
                setCurrentLocation(initialPoint);
                setRoute([initialPoint]);
            }
        } catch (error) {
            console.warn('Nije moguće dobiti početnu lokaciju odmah:', error);
        }

        locationSubscription.current = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.High,
                timeInterval: 1000,
                distanceInterval: 1,
            },
            (location) => {
                if (isPaused) return;

                if (location.coords.accuracy != null && location.coords.accuracy > MAX_ACCEPTABLE_ACCURACY)
                    return;

                const newPoint: LocationPoint = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    altitude: location.coords.altitude,
                    speed: location.coords.speed,
                    timestamp: location.timestamp,
                };

                setCurrentLocation(newPoint);

                setRoute((prevRoute) => {
                    if(prevRoute.length > 0) {
                        const lastPoint = prevRoute[prevRoute.length - 1];
                        const addedDistance = calculateDistance(lastPoint.latitude, lastPoint.longitude, newPoint.latitude, newPoint.longitude);

                        const timeDeltaSec = (newPoint.timestamp - lastPoint.timestamp) / 1000;
                        const impliedSpeed = timeDeltaSec > 0 ? addedDistance / timeDeltaSec : 0;

                        if(addedDistance > MIN_DISTANCE_TO_COUNT && impliedSpeed > MAX_REALISTIC_SPEED_MS) 
                            return prevRoute;

                        if(addedDistance > MIN_DISTANCE_TO_COUNT)
                            setDistance((prevDist) => prevDist + addedDistance);
                    }

                    return [...prevRoute, newPoint];
                });

                const speedKmh = (location.coords.speed || 0) * 3.6;
                setCurrentSpeed(speedKmh > 0 ? speedKmh : 0);
            }
        );

        return true;
    };

    const pauseTracking = () => setIsPaused(true);
    const resumeTracking = () => setIsPaused(false);

    const stopTracking = () => {
        if(locationSubscription.current) {
            locationSubscription.current.remove();
            locationSubscription.current = null;
        }

        if(pedometerSubscription.current) {
            pedometerSubscription.current.remove();
            pedometerSubscription.current = null;
        }

        if(timerRef.current)
            clearInterval(timerRef.current);
        
        setIsTracking(false);
        setIsPaused(true);
    };

    return {
        isTracking,
        isPaused,
        activityType,
        setActivityType,
        duration,
        distance,
        setDistance,
        currentSpeed,
        route,
        currentLocation,
        hasLocationPermission,
        steps,
        isPedometerAvailable,
        startTracking,
        pauseTracking,
        resumeTracking,
        stopTracking,
    };
};