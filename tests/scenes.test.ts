import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';

// Mock data
const mockSceneResponse = {
    success: true,
    message: "Operation successful"
};

// Extract the handler functions for testability
async function activateScene(scene_id: string, transition?: number) {
    try {
        const haUrl = process.env.HA_URL || "http://homeassistant.local:8123";
        const haToken = process.env.HA_TOKEN;
        
        const response = await axios.post(`${haUrl}/api/services/scene/turn_on`, {
            entity_id: scene_id,
            transition
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
                    message: "Scene activated successfully",
                    details: response.data
                }, null, 2)
            }]
        };
    } catch (error: any) {
        return {
            content: [{
                type: "text",
                text: `Error activating scene: ${error.message}`
            }]
        };
    }
}

async function createScene(scene_id: string, name: string, entities: string[], snapshot?: boolean) {
    try {
        const haUrl = process.env.HA_URL || "http://homeassistant.local:8123";
        const haToken = process.env.HA_TOKEN;
        
        const response = await axios.post(`${haUrl}/api/services/scene/create`, {
            scene_id,
            name,
            entities,
            snapshot: snapshot ?? true
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
                    message: "Scene created successfully",
                    details: response.data
                }, null, 2)
            }]
        };
    } catch (error: any) {
        return {
            content: [{
                type: "text",
                text: `Error creating scene: ${error.message}`
            }]
        };
    }
}

async function deleteScene(scene_id: string) {
    try {
        const haUrl = process.env.HA_URL || "http://homeassistant.local:8123";
        const haToken = process.env.HA_TOKEN;
        
        const response = await axios.post(`${haUrl}/api/services/scene/delete`, {
            entity_id: scene_id
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
                    message: "Scene deleted successfully",
                    details: response.data
                }, null, 2)
            }]
        };
    } catch (error: any) {
        return {
            content: [{
                type: "text",
                text: `Error deleting scene: ${error.message}`
            }]
        };
    }
}

async function applyScene(entities: Record<string, any>, transition?: number) {
    try {
        const haUrl = process.env.HA_URL || "http://homeassistant.local:8123";
        const haToken = process.env.HA_TOKEN;
        
        const response = await axios.post(`${haUrl}/api/services/scene/apply`, {
            entities,
            transition
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
                    message: "Scene applied successfully",
                    details: response.data
                }, null, 2)
            }]
        };
    } catch (error: any) {
        return {
            content: [{
                type: "text",
                text: `Error applying scene: ${error.message}`
            }]
        };
    }
}

describe('Home Assistant MCP Tools - Scenes', () => {
    let axiosPostSpy: any;
    
    beforeEach(() => {
        axiosPostSpy = jest.spyOn(axios, 'post');
    });
    
    afterEach(() => {
        axiosPostSpy.mockRestore();
    });

    describe('activateScene', () => {
        it('should activate a scene successfully', async () => {
            axiosPostSpy.mockResolvedValue({ data: mockSceneResponse });
            
            const result = await activateScene('scene.evening_lights', 2);
            const parsedResult = JSON.parse(result.content[0].text);
            
            expect(parsedResult.success).toBe(true);
            expect(parsedResult.message).toBe('Scene activated successfully');
            expect(axiosPostSpy).toHaveBeenCalledWith(
                expect.stringContaining('/api/services/scene/turn_on'),
                expect.objectContaining({
                    entity_id: 'scene.evening_lights',
                    transition: 2
                }),
                expect.any(Object)
            );
        });

        it('should handle errors when activating a scene', async () => {
            axiosPostSpy.mockRejectedValue(new Error('Failed to activate scene'));
            
            const result = await activateScene('scene.evening_lights');
            expect(result.content[0].text).toContain('Error activating scene');
        });
    });

    describe('createScene', () => {
        it('should create a scene successfully', async () => {
            axiosPostSpy.mockResolvedValue({ data: mockSceneResponse });
            
            const result = await createScene(
                'evening_lights',
                'Evening Lights',
                ['light.living_room', 'light.kitchen']
            );
            const parsedResult = JSON.parse(result.content[0].text);
            
            expect(parsedResult.success).toBe(true);
            expect(parsedResult.message).toBe('Scene created successfully');
            expect(axiosPostSpy).toHaveBeenCalledWith(
                expect.stringContaining('/api/services/scene/create'),
                expect.objectContaining({
                    scene_id: 'evening_lights',
                    name: 'Evening Lights',
                    entities: ['light.living_room', 'light.kitchen'],
                    snapshot: true
                }),
                expect.any(Object)
            );
        });

        it('should handle errors when creating a scene', async () => {
            axiosPostSpy.mockRejectedValue(new Error('Failed to create scene'));
            
            const result = await createScene('evening_lights', 'Evening Lights', []);
            expect(result.content[0].text).toContain('Error creating scene');
        });
    });

    describe('deleteScene', () => {
        it('should delete a scene successfully', async () => {
            axiosPostSpy.mockResolvedValue({ data: mockSceneResponse });
            
            const result = await deleteScene('scene.evening_lights');
            const parsedResult = JSON.parse(result.content[0].text);
            
            expect(parsedResult.success).toBe(true);
            expect(parsedResult.message).toBe('Scene deleted successfully');
            expect(axiosPostSpy).toHaveBeenCalledWith(
                expect.stringContaining('/api/services/scene/delete'),
                expect.objectContaining({
                    entity_id: 'scene.evening_lights'
                }),
                expect.any(Object)
            );
        });

        it('should handle errors when deleting a scene', async () => {
            axiosPostSpy.mockRejectedValue(new Error('Failed to delete scene'));
            
            const result = await deleteScene('scene.evening_lights');
            expect(result.content[0].text).toContain('Error deleting scene');
        });
    });

    describe('applyScene', () => {
        it('should apply a scene successfully', async () => {
            axiosPostSpy.mockResolvedValue({ data: mockSceneResponse });
            
            const entities = {
                'light.living_room': { state: 'on', brightness: 255 },
                'light.kitchen': { state: 'off' }
            };
            
            const result = await applyScene(entities, 2);
            const parsedResult = JSON.parse(result.content[0].text);
            
            expect(parsedResult.success).toBe(true);
            expect(parsedResult.message).toBe('Scene applied successfully');
            expect(axiosPostSpy).toHaveBeenCalledWith(
                expect.stringContaining('/api/services/scene/apply'),
                expect.objectContaining({
                    entities,
                    transition: 2
                }),
                expect.any(Object)
            );
        });

        it('should handle errors when applying a scene', async () => {
            axiosPostSpy.mockRejectedValue(new Error('Failed to apply scene'));
            
            const result = await applyScene({});
            expect(result.content[0].text).toContain('Error applying scene');
        });
    });
}); 