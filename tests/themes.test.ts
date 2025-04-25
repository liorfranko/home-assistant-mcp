import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';

// Mock data
const mockThemeResponse = {
    success: true,
    message: "Operation successful"
};

// Extract the handler functions for testability
async function setTheme(theme_name: string, mode?: 'light' | 'dark') {
    try {
        const haUrl = process.env.HA_URL || "http://homeassistant.local:8123";
        const haToken = process.env.HA_TOKEN;
        
        const response = await axios.post(`${haUrl}/api/services/frontend/set_theme`, {
            name: theme_name,
            mode
        }, {
            headers: {
                Authorization: `Bearer ${haToken}`,
                "Content-Type": "application/json",
            },
        });
        
        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    success: true,
                    message: "Theme set successfully",
                    details: response.data
                }, null, 2)
            }]
        };
    } catch (error: any) {
        return {
            content: [{
                type: "text",
                text: `Error setting theme: ${error.message}`
            }]
        };
    }
}

async function reloadThemes() {
    try {
        const haUrl = process.env.HA_URL || "http://homeassistant.local:8123";
        const haToken = process.env.HA_TOKEN;
        
        const response = await axios.post(`${haUrl}/api/services/frontend/reload_themes`, {}, {
            headers: {
                Authorization: `Bearer ${haToken}`,
                "Content-Type": "application/json",
            },
        });
        
        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    success: true,
                    message: "Themes reloaded successfully",
                    details: response.data
                }, null, 2)
            }]
        };
    } catch (error: any) {
        return {
            content: [{
                type: "text",
                text: `Error reloading themes: ${error.message}`
            }]
        };
    }
}

describe('Home Assistant MCP Tools - Themes', () => {
    let axiosPostSpy: any;
    
    beforeEach(() => {
        axiosPostSpy = jest.spyOn(axios, 'post');
    });
    
    afterEach(() => {
        axiosPostSpy.mockRestore();
    });

    describe('setTheme', () => {
        it('should set a theme successfully', async () => {
            axiosPostSpy.mockResolvedValue({ data: mockThemeResponse });
            
            const result = await setTheme('modern', 'dark');
            const parsedResult = JSON.parse(result.content[0].text);
            
            expect(parsedResult.success).toBe(true);
            expect(parsedResult.message).toBe('Theme set successfully');
            expect(axiosPostSpy).toHaveBeenCalledWith(
                expect.stringContaining('/api/services/frontend/set_theme'),
                expect.objectContaining({
                    name: 'modern',
                    mode: 'dark'
                }),
                expect.any(Object)
            );
        });

        it('should set a theme without mode', async () => {
            axiosPostSpy.mockResolvedValue({ data: mockThemeResponse });
            
            const result = await setTheme('modern');
            const parsedResult = JSON.parse(result.content[0].text);
            
            expect(parsedResult.success).toBe(true);
            expect(parsedResult.message).toBe('Theme set successfully');
            expect(axiosPostSpy).toHaveBeenCalledWith(
                expect.stringContaining('/api/services/frontend/set_theme'),
                expect.objectContaining({
                    name: 'modern',
                    mode: undefined
                }),
                expect.any(Object)
            );
        });

        it('should handle errors when setting a theme', async () => {
            axiosPostSpy.mockRejectedValue(new Error('Failed to set theme'));
            
            const result = await setTheme('modern');
            expect(result.content[0].text).toContain('Error setting theme');
        });
    });

    describe('reloadThemes', () => {
        it('should reload themes successfully', async () => {
            axiosPostSpy.mockResolvedValue({ data: mockThemeResponse });
            
            const result = await reloadThemes();
            const parsedResult = JSON.parse(result.content[0].text);
            
            expect(parsedResult.success).toBe(true);
            expect(parsedResult.message).toBe('Themes reloaded successfully');
            expect(axiosPostSpy).toHaveBeenCalledWith(
                expect.stringContaining('/api/services/frontend/reload_themes'),
                {},
                expect.any(Object)
            );
        });

        it('should handle errors when reloading themes', async () => {
            axiosPostSpy.mockRejectedValue(new Error('Failed to reload themes'));
            
            const result = await reloadThemes();
            expect(result.content[0].text).toContain('Error reloading themes');
        });
    });
}); 