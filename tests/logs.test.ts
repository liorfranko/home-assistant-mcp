import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';

// Mock data
const mockLogResponse = {
    success: true,
    message: "Log level updated successfully"
};

const mockSystemLogs = {
    logs: [
        {
            timestamp: "2024-03-20 10:00:00",
            level: "info",
            message: "Home Assistant started",
            source: "homeassistant"
        },
        {
            timestamp: "2024-03-20 10:00:01",
            level: "warning",
            message: "Connection lost",
            source: "mqtt"
        }
    ]
};

// Extract the handler functions for testability
async function setLogLevel(integration: string, level: 'debug' | 'info' | 'warning' | 'error') {
    try {
        const haUrl = process.env.HA_URL || "http://homeassistant.local:8123";
        const haToken = process.env.HA_TOKEN;
        
        const response = await axios.post(`${haUrl}/api/services/logger/set_level`, {
            [integration]: level
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
                    message: "Log level set successfully",
                    details: response.data
                }, null, 2)
            }]
        };
    } catch (error: any) {
        return {
            content: [{
                type: "text",
                text: `Error setting log level: ${error.message}`
            }]
        };
    }
}

describe('Home Assistant MCP Tools - Logs', () => {
    let axiosPostSpy: any;
    let axiosGetSpy: any;
    
    beforeEach(() => {
        axiosPostSpy = jest.spyOn(axios, 'post');
        axiosGetSpy = jest.spyOn(axios, 'get');
    });
    
    afterEach(() => {
        axiosPostSpy.mockRestore();
        axiosGetSpy.mockRestore();
    });

    describe('setLogLevel', () => {
        it('should set log level to debug successfully', async () => {
            axiosPostSpy.mockResolvedValue({ data: mockLogResponse });
            
            const result = await setLogLevel('homeassistant', 'debug');
            const parsedResult = JSON.parse(result.content[0].text);
            
            expect(parsedResult.success).toBe(true);
            expect(parsedResult.message).toBe('Log level set successfully');
            expect(axiosPostSpy).toHaveBeenCalledWith(
                expect.stringContaining('/api/services/logger/set_level'),
                expect.objectContaining({
                    homeassistant: 'debug'
                }),
                expect.any(Object)
            );
        });

        it('should set log level to info successfully', async () => {
            axiosPostSpy.mockResolvedValue({ data: mockLogResponse });
            
            const result = await setLogLevel('homeassistant', 'info');
            const parsedResult = JSON.parse(result.content[0].text);
            
            expect(parsedResult.success).toBe(true);
            expect(parsedResult.message).toBe('Log level set successfully');
            expect(axiosPostSpy).toHaveBeenCalledWith(
                expect.stringContaining('/api/services/logger/set_level'),
                expect.objectContaining({
                    homeassistant: 'info'
                }),
                expect.any(Object)
            );
        });

        it('should set log level to warning successfully', async () => {
            axiosPostSpy.mockResolvedValue({ data: mockLogResponse });
            
            const result = await setLogLevel('homeassistant', 'warning');
            const parsedResult = JSON.parse(result.content[0].text);
            
            expect(parsedResult.success).toBe(true);
            expect(parsedResult.message).toBe('Log level set successfully');
            expect(axiosPostSpy).toHaveBeenCalledWith(
                expect.stringContaining('/api/services/logger/set_level'),
                expect.objectContaining({
                    homeassistant: 'warning'
                }),
                expect.any(Object)
            );
        });

        it('should set log level to error successfully', async () => {
            axiosPostSpy.mockResolvedValue({ data: mockLogResponse });
            
            const result = await setLogLevel('homeassistant', 'error');
            const parsedResult = JSON.parse(result.content[0].text);
            
            expect(parsedResult.success).toBe(true);
            expect(parsedResult.message).toBe('Log level set successfully');
            expect(axiosPostSpy).toHaveBeenCalledWith(
                expect.stringContaining('/api/services/logger/set_level'),
                expect.objectContaining({
                    homeassistant: 'error'
                }),
                expect.any(Object)
            );
        });

        it('should handle errors when setting log level', async () => {
            axiosPostSpy.mockRejectedValue(new Error('Failed to set log level'));
            
            const result = await setLogLevel('homeassistant', 'debug');
            expect(result.content[0].text).toContain('Error setting log level');
        });
    });
}); 