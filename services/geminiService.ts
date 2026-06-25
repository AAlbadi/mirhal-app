import { RecommendedSpot } from '../types';

export const getSmartSuggestions = async (query: string): Promise<RecommendedSpot[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Basic Keyword Matching Mock
    const q = query.toLowerCase();

    if (q.includes('mountain') || q.includes('hike')) {
        return [
            {
                title: 'Jebel Jais Viewing Deck',
                reason: 'High altitude spot with breathtaking mountain views and cool temperatures.',
                vibe: 'MAJESTIC',
                estimatedPrice: 'Free',
            },
            {
                title: 'Hatta Dam',
                reason: 'Combined mountain and water experience with kayaking options.',
                vibe: 'ADVENTURE',
                estimatedPrice: 'Free',
            },
            {
                title: 'Wadi Shawka',
                reason: 'Accessible hiking trails and natural pools after rain.',
                vibe: 'NATURE',
                estimatedPrice: 'Free',
            }
        ];
    }

    if (q.includes('beach') || q.includes('water') || q.includes('sea')) {
        return [
            {
                title: 'Al Sufouh Beach',
                reason: 'Quiet beach spot often called "Secret Beach", perfect for relaxation.',
                vibe: 'CALM',
                estimatedPrice: 'Free',
            },
            {
                title: 'Khor Fakkan',
                reason: 'Scenic bay with mountains meeting the ocean.',
                vibe: 'SCENIC',
                estimatedPrice: 'Free',
            },
            {
                title: 'Mirfa Beach',
                reason: 'Camping festival site with clear waters.',
                vibe: 'FESTIVE',
                estimatedPrice: 'Free',
            }
        ];
    }

    // Default / Desert
    return [
        {
            title: 'Al Qudra Lakes',
            reason: 'Perfect for a serene escape near the water with beautiful sunset views.',
            vibe: 'SERENE',
            estimatedPrice: 'Free',
        },
        {
            title: 'Liwa Oasis (Moreeb Dune)',
            reason: 'Deep desert experience with massive dunes and absolute silence.',
            vibe: 'SILENCE',
            estimatedPrice: 'Free',
        },
        {
            title: 'Fossil Rock',
            reason: 'Short drive from the city with unique geological formations.',
            vibe: 'UNIQUE',
            estimatedPrice: 'Free',
        }
    ];
};

export const analyzeTrailImage = async (imageUrl: string): Promise<{
    difficulty: 'Easy' | 'Moderate' | 'Hard' | 'Extreme';
    description: string;
    features: string[];
    titleSuggestion: string;
}> => {
    // Simulate AI Vision Analysis delay
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Mock response based on randomness to feel "alive"
    const descriptions = [
        "This trail appears to navigate through rugged rocky terrain with scattered acacia trees. The path is undefined but follows a natural wadi bed.",
        "A scenic ascent up a loose scree slope, transforming into a ridge walk with panoramic views of the surrounding peaks.",
        "Gentle undulating dunes with firm sand patches suitable for walking. Minimal elevation gain but exposed to the sun."
    ];

    const randomDesc = descriptions[Math.floor(Math.random() * descriptions.length)];

    // In a real app, this would be the Gemini Vision API call
    return {
        difficulty: 'Moderate',
        description: randomDesc,
        features: ['Rocky', 'Wadi', 'Scenic View'],
        titleSuggestion: 'Wadi Adventure Route'
    };
};
