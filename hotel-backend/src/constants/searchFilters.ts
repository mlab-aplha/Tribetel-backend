export const searchFilters = {
    PRICE_RANGES: {
        BUDGET: { min: 0, max: 100 },
        MODERATE: { min: 100, max: 200 },
        LUXURY: { min: 200, max: 500 },
        PREMIUM: { min: 500, max: 1000 },
    },

    ROOM_TYPES: {
        SINGLE: 'single',
        DOUBLE: 'double',
        SUITE: 'suite',
        DELUXE: 'deluxe',
        FAMILY: 'family',
    },

    AMENTITIES: {
        FREE_WIFI: 'free_wifi',
        SWIMMING_POOL: 'swimming pool',
        SPA: 'spar',
        FITNESS_CENTER: 'fitness_center',
        RESTAURANT: 'restaurant',
        AIR_CONDITIONING: 'air_conditioning',
        PARKING: 'parking',
        PET_FRIENDLY: 'pet_friendly',
        BREAKFAST: 'breakfast_included',
    },

    SORT_OPTIONS: {
        PRICE_LOW_TO_HIGH: 'price_low_high',
        PRICE_HIGH_TO_LOW: 'price_high_low',
        RATING_HIGH_TO_LOW: 'rating_high_low',
        NAME_A_TO_Z: 'name_a_z',
        NAME_Z_TO_A: 'name_z_a',
    },

    RATINGS: {
        ANY: 0,
        EXCELLENT: 4.5,
        VERY_GOOD: 4.0,
        GOOD: 3.5,
        AVERAGE: 3.0,
    },

} as const;

export type SearchFilters = typeof searchFilters;