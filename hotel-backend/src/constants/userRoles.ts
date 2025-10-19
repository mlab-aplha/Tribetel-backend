export const userRoles = {
    USER: 'user',
    ADMIN: 'admin',
    HOTEL_MANAGER: 'hoel_manager',
} as const;

export type UserRole = typeof userRoles[keyof typeof userRoles];