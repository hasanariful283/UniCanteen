// Fetch user role from API endpoint
import { RoleType } from '@/types/roles';

export async function getRole(): Promise<RoleType> {
    try {
        const response = await fetch('/api/user/role', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        if (!response.ok) {
            console.error('Failed to fetch role:', response.status);
            return "DEFAULT";
        }

        const data = await response.json();
        console.log("Fetched role via getRole:", data.role);
        return data.role || "DEFAULT";
    } catch (error) {
        console.error('Error fetching role:', error);
        return "DEFAULT";
    }
}