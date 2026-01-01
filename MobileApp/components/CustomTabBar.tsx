import React from 'react'
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name

          const isFocused = state.index === index
          const isAITab = route.name === 'AIHub'

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            })

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name)
            }
          }

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            })
          }

          // Get icon name
          let iconName: keyof typeof Ionicons.glyphMap = 'help-outline'
          if (route.name === 'Home') {
            iconName = isFocused ? 'home' : 'home-outline'
          } else if (route.name === 'Records') {
            iconName = isFocused ? 'document-text' : 'document-text-outline'
          } else if (route.name === 'AIHub') {
            iconName = 'sparkles'
          } else if (route.name === 'Share') {
            iconName = isFocused ? 'share-social' : 'share-social-outline'
          } else if (route.name === 'Profile') {
            iconName = isFocused ? 'person' : 'person-outline'
          }

          // AI Tab - Special elevated button
          if (isAITab) {
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.aiTabContainer}
              >
                <LinearGradient
                  colors={['#4CAF50', '#2E7D32']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.aiButton}
                >
                  <Ionicons name={iconName} size={28} color="white" />
                </LinearGradient>
                <Text style={styles.aiLabel}>AI</Text>
              </TouchableOpacity>
            )
          }

          // Regular tabs
          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
            >
              <Ionicons
                name={iconName}
                size={24}
                color={isFocused ? '#4CAF50' : '#999'}
              />
              <Text
                style={[
                  styles.label,
                  { color: isFocused ? '#4CAF50' : '#999' }
                ]}
              >
                {label as string}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingBottom: Platform.OS === 'ios' ? 20 : 5,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
  },
  label: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  aiTabContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -30,
  },
  aiButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 4,
    borderColor: 'white',
  },
  aiLabel: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
})
