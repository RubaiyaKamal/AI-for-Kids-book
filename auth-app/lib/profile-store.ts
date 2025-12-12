// Simple in-memory profile store for demo purposes
// In a real app, this would be a database table

interface UserProfile {
    userId: string;
    software_experience: string;
    hardware_experience: string;
    interests: string[];
}

// Global variable to hold profiles (will reset on server restart)
// For persistence across restarts in dev, we could use a file, but this is fine for now
const profiles = new Map<string, UserProfile>();

export const profileStore = {
    get: async (userId: string) => {
        return profiles.get(userId);
    },
    set: async (userId: string, data: Omit<UserProfile, 'userId'>) => {
        const profile: UserProfile = { userId, ...data };
        profiles.set(userId, profile);
        return profile;
    }
};
