export interface InterfacePlacement { 
    x: number;
    y: number;
}

export interface InterfacePlacements {
    name: InterfacePlacement;
    // Add other elements like score, logo, team etc. here later
    // score?: InterfacePlacement;
    // logo?: InterfacePlacement;
}

export interface InterfaceDetail {
    id: string; // Unique identifier (e.g., 'series-1')
    name: string; // Display name (e.g., 'Series 1')
    filename: string; // Path to the image file
    placements: InterfacePlacements;
}

// Define the configuration for available interfaces
export const INTERFACE_CONFIG: InterfaceDetail[] = [
    {
        id: 'series-1',
        name: 'Series 1',
        filename: '05_001_interface_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x.png',
        placements: {
            // Final coordinate adjustments (v5)
            name: { x: 460, y: 192 }, 
            // Define placeholders for others later
        }
    },
    // {
    //     id: 'series-2',
    //     name: 'Series 2',
    //     filename: 'SERIES_2_FILENAME.png', // Example for future
    //     placements: {
    //         name: { x: 400, y: 170 }, 
    //     }
    // },
    // Add Series 3 etc. here when ready
]; 