import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';

// Test data
const mockBackups = [
  {
    slug: 'abcd1234',
    name: 'Weekly Backup',
    date: '2023-05-01T00:00:00Z',
    size: 1024000,
    location: 'local',
    protected: false,
    compressed: true,
    content: {
      homeassistant: true,
      addons: ['addon1', 'addon2'],
      folders: ['folder1', 'folder2']
    },
    type: 'full'
  },
  {
    slug: 'efgh5678',
    name: 'Monthly Backup',
    date: '2023-06-01T00:00:00Z',
    size: 2048000,
    location: 'remote',
    protected: true,
    compressed: true,
    content: {
      homeassistant: true,
      addons: ['addon1', 'addon3'],
      folders: ['folder1', 'folder3']
    },
    type: 'partial'
  }
];

// Expected result after mapping
const expectedResult = {
  count: 2,
  backups: [
    {
      slug: 'abcd1234',
      name: 'Weekly Backup',
      date: '2023-05-01T00:00:00Z',
      size: 1024000,
      type: 'full',
      protected: false,
      location: 'local',
      content: {
        homeassistant: true,
        addonsCount: 2,
        foldersCount: 2
      }
    },
    {
      slug: 'efgh5678',
      name: 'Monthly Backup',
      date: '2023-06-01T00:00:00Z',
      size: 2048000,
      type: 'partial',
      protected: true,
      location: 'remote',
      content: {
        homeassistant: true,
        addonsCount: 2,
        foldersCount: 2
      }
    }
  ]
};

// Extract the handler function for testability
async function listBackups() {
  try {
    const haUrl = process.env.HA_URL || "http://homeassistant.local:8123";
    const haToken = process.env.HA_TOKEN;
    
    const response = await axios.get(`${haUrl}/api/hassio/snapshots`, {
      headers: {
        Authorization: `Bearer ${haToken}`,
        "Content-Type": "application/json",
      },
    });
    
    interface Backup {
      slug: string;
      name: string;
      date: string;
      size: number;
      location: "local" | "remote";
      protected: boolean;
      compressed: boolean;
      content: {
        homeassistant: boolean;
        addons: string[];
        folders: string[];
      };
      type: "full" | "partial";
    }
    
    const backups = response.data;
    
    if (!backups || !Array.isArray(backups)) {
      return {
        content: [{ 
          type: "text", 
          text: "No backups found or unexpected response format from Home Assistant."
        }]
      };
    }
    
    const formattedBackups = backups.map((backup: Backup) => ({
      slug: backup.slug,
      name: backup.name,
      date: backup.date,
      size: backup.size,
      type: backup.type,
      protected: backup.protected,
      location: backup.location,
      content: {
        homeassistant: backup.content.homeassistant,
        addonsCount: backup.content.addons.length,
        foldersCount: backup.content.folders.length
      }
    }));
    
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify({
          count: formattedBackups.length,
          backups: formattedBackups
        }, null, 2)
      }]
    };
  } catch (error: any) {
    console.error("Error listing backups:", error);
    return {
      content: [{ 
        type: "text", 
        text: `Error listing backups: ${error.message}`
      }]
    };
  }
}

describe('Home Assistant MCP Tools', () => {
  describe('listBackups', () => {
    // Use any type to avoid TypeScript issues
    let axiosGetSpy: any;
    
    beforeEach(() => {
      // Create a spy on axios.get
      axiosGetSpy = jest.spyOn(axios, 'get');
    });
    
    afterEach(() => {
      // Restore the original implementation
      axiosGetSpy.mockRestore();
    });

    it('should return a list of backups', async () => {
      // Mock the axios.get implementation
      axiosGetSpy.mockResolvedValue({ 
        data: mockBackups 
      });
      
      // Execute handler
      const toolResult = await listBackups();
      
      // Parse the returned JSON string
      const resultText = toolResult?.content[0].text;
      const parsedResult = JSON.parse(resultText as string);
      
      // Check if the result matches the expected output
      expect(parsedResult).toEqual(expectedResult);
      expect(axiosGetSpy).toHaveBeenCalledTimes(1);
      expect(axiosGetSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/hassio/snapshots'),
        expect.any(Object)
      );
    });

    it('should handle empty backup list', async () => {
      // Mock an empty array response
      axiosGetSpy.mockResolvedValue({ 
        data: [] 
      });
      
      // Execute handler
      const toolResult = await listBackups();
      
      // Parse the returned JSON string
      const resultText = toolResult?.content[0].text;
      const parsedResult = JSON.parse(resultText as string);
      
      // Check if the result has zero count
      expect(parsedResult.count).toBe(0);
      expect(parsedResult.backups).toEqual([]);
      expect(axiosGetSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle non-array response', async () => {
      // Mock a non-array response
      axiosGetSpy.mockResolvedValue({ 
        data: { error: 'Invalid format' } 
      });
      
      // Execute handler
      const toolResult = await listBackups();
      
      // Check if the error message is returned
      expect(toolResult?.content[0].text).toBe('No backups found or unexpected response format from Home Assistant.');
      expect(axiosGetSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
      // Mock an error response
      axiosGetSpy.mockRejectedValue(new Error('Server error'));
      
      // Execute handler
      const toolResult = await listBackups();
      
      // Check if the error message is returned
      expect(toolResult?.content[0].text).toContain('Error listing backups: Server error');
      expect(axiosGetSpy).toHaveBeenCalledTimes(1);
    });
  });
}); 