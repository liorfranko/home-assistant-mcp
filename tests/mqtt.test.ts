import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';

// Mock data
const mockMqttResponse = {
    success: true,
    message: "Operation successful"
};

// Extract the handler function for testability
async function publishMqttMessage(topic: string, payload: string, retain?: boolean, qos?: number) {
    try {
        const haUrl = process.env.HA_URL || "http://homeassistant.local:8123";
        const haToken = process.env.HA_TOKEN;
        
        const response = await axios.post(`${haUrl}/api/services/mqtt/publish`, {
            topic,
            payload,
            retain,
            qos
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
                    message: "Message published successfully",
                    details: response.data
                }, null, 2)
            }]
        };
    } catch (error: any) {
        return {
            content: [{
                type: "text",
                text: `Error publishing MQTT message: ${error.message}`
            }]
        };
    }
}

describe('Home Assistant MCP Tools - MQTT', () => {
    let axiosPostSpy: any;
    
    beforeEach(() => {
        axiosPostSpy = jest.spyOn(axios, 'post');
    });
    
    afterEach(() => {
        axiosPostSpy.mockRestore();
    });

    describe('publishMqttMessage', () => {
        it('should publish a message successfully with all parameters', async () => {
            axiosPostSpy.mockResolvedValue({ data: mockMqttResponse });
            
            const result = await publishMqttMessage(
                'home/sensors/temperature',
                '22.5',
                true,
                2
            );
            const parsedResult = JSON.parse(result.content[0].text);
            
            expect(parsedResult.success).toBe(true);
            expect(parsedResult.message).toBe('Message published successfully');
            expect(axiosPostSpy).toHaveBeenCalledWith(
                expect.stringContaining('/api/services/mqtt/publish'),
                expect.objectContaining({
                    topic: 'home/sensors/temperature',
                    payload: '22.5',
                    retain: true,
                    qos: 2
                }),
                expect.any(Object)
            );
        });

        it('should publish a message with only required parameters', async () => {
            axiosPostSpy.mockResolvedValue({ data: mockMqttResponse });
            
            const result = await publishMqttMessage(
                'home/sensors/temperature',
                '22.5'
            );
            const parsedResult = JSON.parse(result.content[0].text);
            
            expect(parsedResult.success).toBe(true);
            expect(parsedResult.message).toBe('Message published successfully');
            expect(axiosPostSpy).toHaveBeenCalledWith(
                expect.stringContaining('/api/services/mqtt/publish'),
                expect.objectContaining({
                    topic: 'home/sensors/temperature',
                    payload: '22.5'
                }),
                expect.any(Object)
            );
        });

        it('should handle errors when publishing a message', async () => {
            axiosPostSpy.mockRejectedValue(new Error('Failed to publish message'));
            
            const result = await publishMqttMessage('home/sensors/temperature', '22.5');
            expect(result.content[0].text).toContain('Error publishing MQTT message');
        });
    });
}); 