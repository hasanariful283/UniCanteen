"use client";
import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
    Globe, 
    Check,
    ArrowLeft,
    Volume2
} from 'lucide-react';

type Language = {
    code: string;
    name: string;
    nativeName: string;
    flag: string;
    isRTL?: boolean;
};

const languages: Language[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', isRTL: true },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', isRTL: true },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
];

const LanguageCustomer = () => {
    const { user } = useUser();
    const [selectedLanguage, setSelectedLanguage] = useState('en'); // Default to English
    const [loading, setLoading] = useState(false);

    const handleLanguageChange = async (languageCode: string) => {
        setLoading(true);
        setSelectedLanguage(languageCode);
        
        // Mock API call to save language preference
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setLoading(false);
        
        // You would typically update the app's language context here
        alert(`Language changed to ${languages.find(l => l.code === languageCode)?.name}. The app will reload to apply changes.`);
    };

    const playPronunciation = (languageCode: string) => {
        // Mock pronunciation - in real app, you'd play actual audio
        const language = languages.find(l => l.code === languageCode);
        alert(`Playing pronunciation: "${language?.nativeName}"`);
    };

    if (!user) {
        return <div className="p-4">Please sign in</div>;
    }

    return (
        <div className="p-4  mx-auto">
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <button
                        onClick={() => window.history.back()}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <Globe className="w-6 h-6 text-orange-500" />
                    <h1 className="text-2xl font-bold text-gray-900">Language Settings</h1>
                </div>
                <p className="text-gray-600 ml-14">Choose your preferred language for the delivery app</p>
            </div>

            {/* Current Language Display */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="text-2xl">
                        {languages.find(l => l.code === selectedLanguage)?.flag}
                    </div>
                    <div>
                        <p className="font-medium text-orange-900">Current Language</p>
                        <p className="text-orange-700">
                            {languages.find(l => l.code === selectedLanguage)?.nativeName} 
                            ({languages.find(l => l.code === selectedLanguage)?.name})
                        </p>
                    </div>
                </div>
            </div>

            {/* Language List */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b">
                    <h2 className="font-semibold text-gray-900">Available Languages</h2>
                </div>
                <div className="divide-y">
                    {languages.map((language) => (
                        <div
                            key={language.code}
                            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                                selectedLanguage === language.code ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                            }`}
                            onClick={() => handleLanguageChange(language.code)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="text-2xl">{language.flag}</div>
                                    <div className={language.isRTL ? 'text-right' : ''}>
                                        <p className="font-medium text-gray-900">
                                            {language.name}
                                        </p>
                                        <p 
                                            className="text-gray-600"
                                            style={{ direction: language.isRTL ? 'rtl' : 'ltr' }}
                                        >
                                            {language.nativeName}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            playPronunciation(language.code);
                                        }}
                                        className="p-2 hover:bg-gray-200 rounded-lg"
                                        title="Play pronunciation"
                                    >
                                        <Volume2 className="w-4 h-4 text-gray-500" />
                                    </button>
                                    {selectedLanguage === language.code && (
                                        <div className="flex items-center gap-1 text-blue-600">
                                            <Check className="w-5 h-5" />
                                            <span className="text-sm font-medium">Selected</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Language Info */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Language Support</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Full interface translation available for English and Bengali</li>
                    <li>• Partial translation available for Hindi and Urdu</li>
                    <li>• Right-to-left (RTL) layout support for Arabic and Urdu</li>
                    <li>• More languages coming soon based on user demand</li>
                </ul>
            </div>

            {/* App Restart Notice */}
            {loading && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        <p className="text-blue-800 text-sm">
                            Applying language changes... The app may reload to apply the new language.
                        </p>
                    </div>
                </div>
            )}

            {/* Help Section */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border p-4">
                <h3 className="font-medium text-gray-900 mb-2">Need Help?</h3>
                <div className="text-sm text-gray-600 space-y-2">
                    <p>If you encounter issues with language display:</p>
                    <ul className="list-disc list-inside ml-2">
                        <li>Ensure your device supports the selected language fonts</li>
                        <li>Try restarting the app after changing language</li>
                        <li>Contact support if text appears incorrectly</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default LanguageCustomer;