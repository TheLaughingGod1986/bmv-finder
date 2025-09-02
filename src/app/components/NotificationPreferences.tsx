'use client';

import { useState, useEffect } from 'react';
import { notificationService } from '@/lib/notificationService';
import { 
  BellIcon, 
  BellSlashIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  Cog6ToothIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface NotificationPreferencesProps {
  userId: string;
  className?: string;
}

interface NotificationSettings {
  push: {
    enabled: boolean;
    priceAlerts: boolean;
    marketUpdates: boolean;
    systemAlerts: boolean;
    portfolioUpdates: boolean;
  };
  email: {
    enabled: boolean;
    priceAlerts: boolean;
    marketUpdates: boolean;
    systemAlerts: boolean;
    portfolioUpdates: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
  };
  sms: {
    enabled: boolean;
    urgentAlerts: boolean;
    priceAlerts: boolean;
  };
  inApp: {
    enabled: boolean;
    showBadges: boolean;
    soundEnabled: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
}

export default function NotificationPreferences({ userId, className = "" }: NotificationPreferencesProps) {
  const [settings, setSettings] = useState<NotificationSettings>({
    push: {
      enabled: true,
      priceAlerts: true,
      marketUpdates: true,
      systemAlerts: true,
      portfolioUpdates: true
    },
    email: {
      enabled: true,
      priceAlerts: true,
      marketUpdates: false,
      systemAlerts: true,
      portfolioUpdates: true,
      frequency: 'daily'
    },
    sms: {
      enabled: false,
      urgentAlerts: true,
      priceAlerts: false
    },
    inApp: {
      enabled: true,
      showBadges: true,
      soundEnabled: true
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    loadSettings();
    checkPermissions();
  }, [userId]);

  const loadSettings = () => {
    try {
      const stored = localStorage.getItem(`notification_settings_${userId}`);
      if (stored) {
        const savedSettings = JSON.parse(stored);
        setSettings(prev => ({ ...prev, ...savedSettings }));
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    setIsLoading(true);
    try {
      localStorage.setItem(`notification_settings_${userId}`, JSON.stringify(newSettings));
      setSettings(newSettings);
      
      // Update notification service with new settings
      await notificationService.requestPermission();
      
      console.log('Notification settings saved');
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkPermissions = async () => {
    setIsSupported(notificationService.isSupported());
    
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  };

  const requestPermission = async () => {
    const permission = await notificationService.requestPermission();
    setPermissionStatus(permission);
    return permission;
  };

  const updateSetting = (category: keyof NotificationSettings, key: string, value: any) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value
      }
    };
    saveSettings(newSettings);
  };

  const toggleCategory = (category: keyof NotificationSettings) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        enabled: !settings[category].enabled
      }
    };
    saveSettings(newSettings);
  };

  const testNotification = async () => {
    if (permissionStatus !== 'granted') {
      const permission = await requestPermission();
      if (permission !== 'granted') {
        alert('Please enable notifications in your browser settings');
        return;
      }
    }

    await notificationService.sendNotification({
      type: 'system_alert',
      title: 'Test Notification',
      message: 'This is a test notification to verify your settings are working correctly.',
      priority: 'medium',
      userId,
      channels: [
        { type: 'push', enabled: settings.push.enabled },
        { type: 'in_app', enabled: settings.inApp.enabled }
      ]
    });
  };

  const SettingToggle = ({ 
    category, 
    key, 
    label, 
    description, 
    disabled = false 
  }: {
    category: keyof NotificationSettings;
    key: string;
    label: string;
    description?: string;
    disabled?: boolean;
  }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <label className="text-sm font-medium text-gray-900">{label}</label>
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
      </div>
      <button
        onClick={() => updateSetting(category, key, !(settings[category] as any)[key])}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          (settings[category] as any)[key] ? 'bg-blue-600' : 'bg-gray-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            (settings[category] as any)[key] ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  const CategorySection = ({ 
    title, 
    icon: Icon, 
    category, 
    children 
  }: {
    title: string;
    icon: any;
    category: keyof NotificationSettings;
    children: React.ReactNode;
  }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Icon className="w-6 h-6 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <button
          onClick={() => toggleCategory(category)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            settings[category].enabled ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings[category].enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      
      {settings[category].enabled && (
        <div className="space-y-1">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notification Preferences</h2>
          <p className="text-gray-600">Customize how and when you receive notifications</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {permissionStatus === 'granted' ? (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Notifications Enabled</span>
            </div>
          ) : (
            <button
              onClick={requestPermission}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <BellIcon className="w-5 h-5" />
              <span>Enable Notifications</span>
            </button>
          )}
          
          <button
            onClick={testNotification}
            disabled={permissionStatus !== 'granted'}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Test
          </button>
        </div>
      </div>

      {/* Permission Status */}
      {!isSupported && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <XMarkIcon className="w-5 h-5 text-yellow-600 mr-3" />
            <div>
              <h3 className="font-medium text-yellow-800">Notifications Not Supported</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Your browser doesn't support notifications. Please use a modern browser.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Push Notifications */}
      <CategorySection
        title="Push Notifications"
        icon={DevicePhoneMobileIcon}
        category="push"
      >
        <SettingToggle
          category="push"
          key="priceAlerts"
          label="Price Alerts"
          description="Get notified when property prices change significantly"
        />
        <SettingToggle
          category="push"
          key="marketUpdates"
          label="Market Updates"
          description="Receive market trend notifications"
        />
        <SettingToggle
          category="push"
          key="systemAlerts"
          label="System Alerts"
          description="Important system notifications and maintenance updates"
        />
        <SettingToggle
          category="push"
          key="portfolioUpdates"
          label="Portfolio Updates"
          description="Updates about your property portfolio performance"
        />
      </CategorySection>

      {/* Email Notifications */}
      <CategorySection
        title="Email Notifications"
        icon={EnvelopeIcon}
        category="email"
      >
        <SettingToggle
          category="email"
          key="priceAlerts"
          label="Price Alerts"
          description="Email notifications for price changes"
        />
        <SettingToggle
          category="email"
          key="marketUpdates"
          label="Market Updates"
          description="Weekly market trend summaries"
        />
        <SettingToggle
          category="email"
          key="systemAlerts"
          label="System Alerts"
          description="Important system notifications"
        />
        <SettingToggle
          category="email"
          key="portfolioUpdates"
          label="Portfolio Updates"
          description="Monthly portfolio performance reports"
        />
        
        <div className="pt-3 border-t border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Frequency
          </label>
          <select
            value={settings.email.frequency}
            onChange={(e) => updateSetting('email', 'frequency', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="immediate">Immediate</option>
            <option value="daily">Daily Digest</option>
            <option value="weekly">Weekly Summary</option>
          </select>
        </div>
      </CategorySection>

      {/* SMS Notifications */}
      <CategorySection
        title="SMS Notifications"
        icon={DevicePhoneMobileIcon}
        category="sms"
      >
        <SettingToggle
          category="sms"
          key="urgentAlerts"
          label="Urgent Alerts"
          description="Critical notifications via SMS"
        />
        <SettingToggle
          category="sms"
          key="priceAlerts"
          label="Price Alerts"
          description="SMS notifications for significant price changes"
        />
      </CategorySection>

      {/* In-App Notifications */}
      <CategorySection
        title="In-App Notifications"
        icon={GlobeAltIcon}
        category="inApp"
      >
        <SettingToggle
          category="inApp"
          key="showBadges"
          label="Show Badges"
          description="Display notification badges on the app icon"
        />
        <SettingToggle
          category="inApp"
          key="soundEnabled"
          label="Sound Notifications"
          description="Play sound when notifications arrive"
        />
      </CategorySection>

      {/* Quiet Hours */}
      <CategorySection
        title="Quiet Hours"
        icon={Cog6ToothIcon}
        category="quietHours"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Time
            </label>
            <input
              type="time"
              value={settings.quietHours.start}
              onChange={(e) => updateSetting('quietHours', 'start', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Time
            </label>
            <input
              type="time"
              value={settings.quietHours.end}
              onChange={(e) => updateSetting('quietHours', 'end', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone
          </label>
          <select
            value={settings.quietHours.timezone}
            onChange={(e) => updateSetting('quietHours', 'timezone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Europe/London">Europe/London (GMT)</option>
            <option value="Europe/Dublin">Europe/Dublin (GMT)</option>
            <option value="America/New_York">America/New_York (EST)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
          </select>
        </div>
      </CategorySection>

      {/* Save Status */}
      {isLoading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center space-x-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Saving preferences...</span>
          </div>
        </div>
      )}
    </div>
  );
}
