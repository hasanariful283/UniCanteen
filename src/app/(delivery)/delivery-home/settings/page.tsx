"use client";
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
    User, 
    Phone, 
    Mail, 
    MapPin, 
    Bell, 
    Shield,
    Eye,
    EyeOff,
    Globe,
    Moon,
    Sun,
    Smartphone,
    Save,
    Truck,
    Clock
} from 'lucide-react';

type DeliveryProfile = {
    phone?: string;
    address?: string;
    vehicleType?: string;
    isAvailable: boolean;
    orderNotifications: boolean;
    messageNotifications: boolean;
    earningsNotifications: boolean;
    promotionNotifications: boolean;
    soundEnabled: boolean;
    showPhoneToCustomers: boolean;
    showLocationWhenOnline: boolean;
    allowCustomerRatings: boolean;
    language: string;
    theme: string;
    defaultStartTime: string;
    defaultEndTime: string;
};

type TimeSlot = {
    id?: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    isActive: boolean;
};

const daysOfWeek = [
    { key: 'MONDAY', label: 'Monday' },
    { key: 'TUESDAY', label: 'Tuesday' },
    { key: 'WEDNESDAY', label: 'Wednesday' },
    { key: 'THURSDAY', label: 'Thursday' },
    { key: 'FRIDAY', label: 'Friday' },
    { key: 'SATURDAY', label: 'Saturday' },
    { key: 'SUNDAY', label: 'Sunday' },
];

const SettingsPage = () => {
    const { user } = useUser();
    const [loading, setLoading] = useState(false);
    const [showPhone, setShowPhone] = useState(true);
    const [profileData, setProfileData] = useState<DeliveryProfile | null>(null);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [fetchingData, setFetchingData] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                setFetchingData(true);
                const response = await fetch('/api/delivery-home/profile');
                const data = await response.json();
                
                if (data.profile) {
                    setProfileData(data.profile);
                    setTimeSlots(data.timeSlots || getDefaultTimeSlots());
                } else {
                    // Set default values if no profile exists
                    setProfileData({
                        phone: user?.phoneNumbers[0]?.phoneNumber || '',
                        address: '',
                        vehicleType: 'bike',
                        isAvailable: false,
                        orderNotifications: true,
                        messageNotifications: true,
                        earningsNotifications: false,
                        promotionNotifications: false,
                        soundEnabled: true,
                        showPhoneToCustomers: true,
                        showLocationWhenOnline: true,
                        allowCustomerRatings: true,
                        language: 'en',
                        theme: 'light',
                        defaultStartTime: '09:00',
                        defaultEndTime: '22:00',
                    });
                    setTimeSlots(getDefaultTimeSlots());
                }
            } catch (error) {
                console.error('Error fetching delivery profile:', error);
            } finally {
                setFetchingData(false);
            }
        };
        fetchData();
    }, [user]);

    const getDefaultTimeSlots = (): TimeSlot[] => {
        return daysOfWeek.map(day => ({
            dayOfWeek: day.key,
            startTime: '09:00',
            endTime: '22:00',
            isActive: true,
        }));
    };

    const handleProfileChange = (field: keyof DeliveryProfile, value: any) => {
        if (!profileData) return;
        setProfileData(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handleTimeSlotChange = (dayOfWeek: string, field: 'startTime' | 'endTime' | 'isActive', value: string | boolean) => {
        setTimeSlots(prev => prev.map(slot => 
            slot.dayOfWeek === dayOfWeek 
                ? { ...slot, [field]: value }
                : slot
        ));
    };

    const applyDefaultToAllDays = () => {
        if (!profileData) return;
        setTimeSlots(prev => prev.map(slot => ({
            ...slot,
            startTime: profileData.defaultStartTime,
            endTime: profileData.defaultEndTime,
        })));
    };

    const handleSaveSettings = async () => {
        if (!profileData) return;
        
        setLoading(true);
        try {
            const response = await fetch('/api/delivery-home/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    profile: profileData,
                    timeSlots: timeSlots,
                }),
            });
            
            if (response.ok) {
                alert('Settings saved successfully!');
            } else {
                alert('Failed to save settings. Please try again.');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('An error occurred while saving settings.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return <div className="p-4">Please sign in</div>;
    }

    if (fetchingData) {
        return <div className="p-4">Loading settings...</div>;
    }

    if (!profileData) {
        return <div className="p-4">Error loading profile data</div>;
    }

    return (
        <div className="p-4 mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
                <p className="text-gray-600">Manage your delivery profile and preferences</p>
            </div>

            <div className="space-y-6">
                {/* Availability Toggle */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Truck className="w-5 h-5" />
                        Delivery Availability
                    </h2>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900">Available for Deliveries</p>
                            <p className="text-sm text-gray-600">
                                {profileData.isAvailable ? 'You are currently available to receive delivery orders' : 'You are currently offline and will not receive new orders'}
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={profileData.isAvailable}
                                onChange={(e) => handleProfileChange('isAvailable', e.target.checked)}
                            />
                            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                            <span className={`ml-3 font-medium ${profileData.isAvailable ? 'text-green-600' : 'text-gray-500'}`}>
                                {profileData.isAvailable ? 'ONLINE' : 'OFFLINE'}
                            </span>
                        </label>
                    </div>
                </div>

                {/* Profile Settings */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Profile Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                                type="text"
                                value={user?.firstName + ' ' + (user?.lastName || '')}
                                disabled
                                className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Name is managed by your account</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <div className="relative">
                                <input
                                    type={showPhone ? "text" : "password"}
                                    value={profileData.phone || ''}
                                    onChange={(e) => handleProfileChange('phone', e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                                <button
                                    onClick={() => setShowPhone(!showPhone)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                >
                                    {showPhone ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={user?.emailAddresses[0]?.emailAddress || ''}
                                disabled
                                className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Email is managed by your account</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <input
                                type="text"
                                value={profileData.address || ''}
                                onChange={(e) => handleProfileChange('address', e.target.value)}
                                placeholder="Your delivery base location"
                                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                            <select
                                value={profileData.vehicleType || 'bike'}
                                onChange={(e) => handleProfileChange('vehicleType', e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                                <option value="bike">Motorcycle</option>
                                <option value="bicycle">Bicycle</option>
                                <option value="car">Car</option>
                                <option value="van">Van</option>
                                <option value="walking">Walking</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Default Working Hours */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Default Working Hours
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                            <input
                                type="time"
                                value={profileData.defaultStartTime}
                                onChange={(e) => handleProfileChange('defaultStartTime', e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                            <input
                                type="time"
                                value={profileData.defaultEndTime}
                                onChange={(e) => handleProfileChange('defaultEndTime', e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                        <div>
                            <button
                                onClick={applyDefaultToAllDays}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
                            >
                                Apply to All Days
                            </button>
                        </div>
                    </div>
                </div>

                {/* Weekly Schedule */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Schedule</h2>
                    <div className="space-y-3">
                        {daysOfWeek.map(day => {
                            const timeSlot = timeSlots.find(slot => slot.dayOfWeek === day.key);
                            return (
                                <div key={day.key} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2 min-w-0 w-24">
                                        <input
                                            type="checkbox"
                                            checked={timeSlot?.isActive || false}
                                            onChange={(e) => handleTimeSlotChange(day.key, 'isActive', e.target.checked)}
                                            className="rounded text-orange-500 focus:ring-orange-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">{day.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-1">
                                        <input
                                            type="time"
                                            value={timeSlot?.startTime || '09:00'}
                                            onChange={(e) => handleTimeSlotChange(day.key, 'startTime', e.target.value)}
                                            disabled={!timeSlot?.isActive}
                                            className="border rounded px-2 py-1 text-sm disabled:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                        />
                                        <span className="text-gray-500">to</span>
                                        <input
                                            type="time"
                                            value={timeSlot?.endTime || '22:00'}
                                            onChange={(e) => handleTimeSlotChange(day.key, 'endTime', e.target.value)}
                                            disabled={!timeSlot?.isActive}
                                            className="border rounded px-2 py-1 text-sm disabled:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Notification Settings */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        Notification Preferences
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Order Updates</p>
                                <p className="text-sm text-gray-600">Get notified when order status changes</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={profileData.orderNotifications}
                                    onChange={(e) => handleProfileChange('orderNotifications', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                            </label>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">New Messages</p>
                                <p className="text-sm text-gray-600">Receive notifications for new messages</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={profileData.messageNotifications}
                                    onChange={(e) => handleProfileChange('messageNotifications', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Earnings Reports</p>
                                <p className="text-sm text-gray-600">Weekly earnings summary notifications</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={profileData.earningsNotifications}
                                    onChange={(e) => handleProfileChange('earningsNotifications', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Promotions</p>
                                <p className="text-sm text-gray-600">Special offers and promotions</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={profileData.promotionNotifications}
                                    onChange={(e) => handleProfileChange('promotionNotifications', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Sound Enabled</p>
                                <p className="text-sm text-gray-600">Play sound for notifications</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={profileData.soundEnabled}
                                    onChange={(e) => handleProfileChange('soundEnabled', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Privacy Settings */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Privacy & Visibility
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Show Phone to Customers</p>
                                <p className="text-sm text-gray-600">Allow customers to see your phone number</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={profileData.showPhoneToCustomers}
                                    onChange={(e) => handleProfileChange('showPhoneToCustomers', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Show Location When Online</p>
                                <p className="text-sm text-gray-600">Show your location to customers when online</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={profileData.showLocationWhenOnline}
                                    onChange={(e) => handleProfileChange('showLocationWhenOnline', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Allow Customer Ratings</p>
                                <p className="text-sm text-gray-600">Allow customers to rate your service</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={profileData.allowCustomerRatings}
                                    onChange={(e) => handleProfileChange('allowCustomerRatings', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* App Preferences */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Smartphone className="w-5 h-5" />
                        App Preferences
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Language</p>
                                <p className="text-sm text-gray-600">Choose your preferred language</p>
                            </div>
                            <select
                                value={profileData.language}
                                onChange={(e) => handleProfileChange('language', e.target.value)}
                                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                                <option value="en">English</option>
                                <option value="bn">বাংলা</option>
                            </select>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Theme</p>
                                <p className="text-sm text-gray-600">Choose light or dark theme</p>
                            </div>
                            <select
                                value={profileData.theme}
                                onChange={(e) => handleProfileChange('theme', e.target.value)}
                                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                                <option value="light">Light</option>
                                <option value="dark">Dark</option>
                                <option value="auto">Auto</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        onClick={handleSaveSettings}
                        disabled={loading}
                        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;