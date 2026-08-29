import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { LocationPoint, ActivityType } from '../models/Activity';

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const f1 = (lat1 * Math.PI) / 180;
    const f2 = (lat2 * Math.PI) / 180;
    const deltaF = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(deltaF / 2) * Math.sin(deltaF / 2) + Math.cos(f1) * Math.cos(f2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
};

export const useTracker = () => {
    const [isTracking, setIsTracking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [activityType, setActivityType] = useState<ActivityType>('RUNNING');
    const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);

    const [duration, setDuration] = useState(0);
    const [distance, setDistance] = useState(0);
    const [currentSpeed, setCurrentSpeed] = useState(0);
    const [route, setRoute] = useState<LocationPoint[]>([]);
    const [currentLocation, setCurrentLocation] = useState<LocationPoint | null>(null);

    const locationSubscription = useRef<Location.LocationSubscription | null>(null);
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

    const startTracking = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        const isGranted = status === 'granted';

        setHasLocationPermission(isGranted);

        setDuration(0);
        setDistance(0);
        setRoute([]);
        setIsTracking(true);
        setIsPaused(false);

        if(isGranted) {
            locationSubscription.current = await Location.watchPositionAsync(
                {
                accuracy: Location.Accuracy.High,
                timeInterval: 2000,
                distanceInterval: 3,
                },
                (location) => {
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
                            if(addedDistance > 1)
                                setDistance((prevDist) => prevDist + addedDistance);
                        }

                        return [...prevRoute, newPoint];
                    });

                    const speedKmh = (location.coords.speed || 0) * 3.6;
                    setCurrentSpeed(speedKmh > 0 ? speedKmh : 0);
                }
            );
        }
    };

    const pauseTracking = () => setIsPaused(true);
    const resumeTracking = () => setIsPaused(false);

    const stopTracking = () => {
        if(locationSubscription.current) {
            locationSubscription.current.remove();
            locationSubscription.current = null;
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
        startTracking,
        pauseTracking,
        resumeTracking,
        stopTracking,
    };
};