import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle, Platform } from 'react-native';

interface RippleTouchableProps extends Omit<PressableProps, 'style'> {
    style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
    rippleColor?: string;
}

export const RippleTouchable: React.FC<RippleTouchableProps> = ({
    style,
    rippleColor = 'rgba(255, 255, 255, 0.15)',
    children,
    ...rest
}) => {
    return (
        <Pressable
        android_ripple={{ color: rippleColor, foreground: true }}
        style={(state) => [
            typeof style === 'function' ? style(state) : style,
            Platform.OS === 'ios' && state.pressed ? { opacity: 0.7 } : null,
            Platform.OS === 'android' ? { overflow: 'hidden' as const } : null,
        ]}
        {...rest}>
            {children}
        </Pressable>
    );
};