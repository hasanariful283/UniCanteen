"use client";
import React, { useState } from 'react';

const DeliveryPersonManagement = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const createMissingRecords = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/delivery-person/manage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'create-missing'
                }),
            });
            
            const data = await response.json();
            setResult(data);
        } catch (error) {
            console.error('Error:', error);
            setResult({ error: 'Failed to create missing records' });
        } finally {
            setLoading(false);
        }
    };

    const ensureSingleRecord = async (userId: string, uiuId?: string) => {
        setLoading(true);
        try {
            const response = await fetch('/api/delivery-person/manage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'ensure-single',
                    targetUserId: userId,
                    uiuId
                }),
            });
            
            const data = await response.json();
            setResult(data);
        } catch (error) {
            console.error('Error:', error);
            setResult({ error: 'Failed to ensure record for user' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">DeliveryPerson Record Management</h1>
            
            <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-2">Create Missing Records</h2>
                    <p className="text-gray-600 mb-4">
                        This will create DeliveryPerson records for all users with DELIVERY_PERSON role who don't have one yet.
                    </p>
                    <button
                        onClick={createMissingRecords}
                        disabled={loading}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : 'Create Missing Records'}
                    </button>
                </div>

                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-2">Current User Record</h2>
                    <p className="text-gray-600 mb-4">
                        Check if current user has a DeliveryPerson record and create if needed.
                    </p>
                    <button
                        onClick={() => fetch('/api/delivery-person/manage').then(res => res.json()).then(setResult)}
                        disabled={loading}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                    >
                        Check Current User
                    </button>
                </div>
            </div>

            {result && (
                <div className="mt-6 bg-gray-100 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Result:</h3>
                    <pre className="text-sm overflow-auto">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default DeliveryPersonManagement;