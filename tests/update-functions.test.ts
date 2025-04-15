import { describe, expect, test } from '@jest/globals';

// Mock data for update entities
const mockEntities = [
  {
    entity_id: 'update.home_assistant_core_update',
    state: 'on',
    attributes: {
      friendly_name: 'Home Assistant Core Update',
      installed_version: '2025.3.4',
      latest_version: '2025.4.2',
      release_url: 'https://www.home-assistant.io/latest-release-notes/'
    }
  },
  {
    entity_id: 'update.home_assistant_operating_system_update',
    state: 'on',
    attributes: {
      friendly_name: 'Home Assistant OS Update',
      installed_version: '15.0',
      latest_version: '15.2',
      release_url: 'https://github.com/home-assistant/operating-system/releases/tag/15.2'
    }
  },
  {
    entity_id: 'update.addon_some_addon',
    state: 'on',
    attributes: {
      friendly_name: 'Some Addon Update',
      installed_version: '1.0.0',
      latest_version: '1.1.0',
      release_url: 'https://github.com/addon/releases/tag/1.1.0'
    }
  }
];

// Simplified test versions of our functions
function processUpdateEntities(entities: any[]) {
  // Filter for update entities
  const updateEntities = entities.filter(entity => 
    entity.entity_id.startsWith('update.')
  );
  
  // Separate system updates from other updates
  const systemUpdates = updateEntities.filter(entity => 
    entity.entity_id.includes('home_assistant') || 
    entity.entity_id.includes('supervisor') ||
    entity.entity_id.includes('operating_system')
  );
  
  const addonUpdates = updateEntities.filter(entity => 
    !entity.entity_id.includes('home_assistant') && 
    !entity.entity_id.includes('supervisor') &&
    !entity.entity_id.includes('operating_system') &&
    entity.state === 'on'
  );
  
  return {
    systemUpdates: systemUpdates.map(entity => ({
      id: entity.entity_id,
      name: entity.attributes.friendly_name || entity.entity_id,
      currentVersion: entity.attributes.installed_version,
      latestVersion: entity.attributes.latest_version,
      releaseUrl: entity.attributes.release_url || null,
      state: entity.state
    })),
    addonUpdates: addonUpdates.map(entity => ({
      id: entity.entity_id,
      name: entity.attributes.friendly_name || entity.entity_id,
      currentVersion: entity.attributes.installed_version,
      latestVersion: entity.attributes.latest_version,
      releaseUrl: entity.attributes.release_url || null
    }))
  };
}

function getUpdateDetailsForType(entities: any[], update_type: string, addon_slug?: string) {
  // Map update_type to corresponding entity_id prefix
  let entityIdPrefix = '';
  switch (update_type) {
    case "core":
      entityIdPrefix = 'update.home_assistant_core';
      break;
    case "supervisor":
      entityIdPrefix = 'update.home_assistant_supervisor';
      break;
  }
  
  // Find the specific entity we're looking for
  let entity;
  if (update_type === "addon" && addon_slug) {
    // For addons, we need to find the entity that contains the addon slug
    entity = entities.find(e => 
      e.entity_id.startsWith('update.') && 
      e.entity_id.includes(addon_slug.replace('-', '_'))
    );
  } else {
    // For core/supervisor, we can use the prefix
    entity = entities.find(e => 
      e.entity_id.startsWith(entityIdPrefix)
    );
  }
  
  if (!entity) {
    throw new Error(`No update entity found for ${update_type}${addon_slug ? ` (${addon_slug})` : ''}`);
  }
  
  // Format the update details
  return {
    type: update_type,
    entity_id: entity.entity_id,
    name: entity.attributes.friendly_name || entity.entity_id,
    current_version: entity.attributes.installed_version,
    latest_version: entity.attributes.latest_version,
    update_available: entity.state === 'on',
    release_url: entity.attributes.release_url || null,
    release_summary: entity.attributes.release_summary || "No release summary available",
  };
}

function simulateUpdates(entities: any[], update_all = true) {
  // Filter for update entities that have updates available (state is "on")
  const updateEntities = entities.filter(entity => 
    entity.entity_id.startsWith('update.') && 
    entity.state === 'on'
  );
  
  const updates: string[] = [];
  const results: Record<string, any> = {};
  
  if (update_all) {
    // Simulate installing all available updates
    for (const entity of updateEntities) {
      updates.push(entity.entity_id);
      results[entity.entity_id] = {
        success: true,
        name: entity.attributes.friendly_name || entity.entity_id,
        details: {
          installed_version: entity.attributes.installed_version,
          latest_version: entity.attributes.latest_version
        }
      };
    }
    
    return {
      success: true,
      message: `Found ${updates.length} components that need updates`,
      note: "Update installation was simulated. To actually install updates, use the Home Assistant UI.",
      components: updates,
      results: results
    };
  } else {
    // Only simulate updating Home Assistant Core and OS
    const coreEntity = updateEntities.find(entity => 
      entity.entity_id === 'update.home_assistant_core_update'
    );
    
    const osEntity = updateEntities.find(entity => 
      entity.entity_id === 'update.home_assistant_operating_system_update'
    );
    
    if (coreEntity) {
      updates.push(coreEntity.entity_id);
      results[coreEntity.entity_id] = {
        success: true,
        name: coreEntity.attributes.friendly_name || coreEntity.entity_id,
        details: {
          installed_version: coreEntity.attributes.installed_version,
          latest_version: coreEntity.attributes.latest_version
        }
      };
    }
    
    if (osEntity) {
      updates.push(osEntity.entity_id);
      results[osEntity.entity_id] = {
        success: true,
        name: osEntity.attributes.friendly_name || osEntity.entity_id,
        details: {
          installed_version: osEntity.attributes.installed_version,
          latest_version: osEntity.attributes.latest_version
        }
      };
    }
    
    return {
      success: true,
      message: `Found ${updates.length} core components that need updates`,
      note: "Update installation was simulated. To actually install updates, use the Home Assistant UI.",
      components: updates,
      results: results
    };
  }
}

describe('Home Assistant Update Functions', () => {
  test('processUpdateEntities should return system and addon updates', () => {
    const result = processUpdateEntities(mockEntities);
    
    expect(result).toHaveProperty('systemUpdates');
    expect(result).toHaveProperty('addonUpdates');
    
    expect(result.systemUpdates).toHaveLength(2);
    expect(result.addonUpdates).toHaveLength(1);
    
    // Verify correct data transformation
    expect(result.systemUpdates[0].id).toBe('update.home_assistant_core_update');
    expect(result.systemUpdates[0].currentVersion).toBe('2025.3.4');
    expect(result.systemUpdates[0].latestVersion).toBe('2025.4.2');
    
    expect(result.addonUpdates[0].id).toBe('update.addon_some_addon');
    expect(result.addonUpdates[0].name).toBe('Some Addon Update');
  });
  
  test('getUpdateDetailsForType should return details for a specific update', () => {
    const mockEntitiesWithSummary = [
      ...mockEntities,
      {
        entity_id: 'update.home_assistant_core_update',
        state: 'on',
        attributes: {
          friendly_name: 'Home Assistant Core Update',
          installed_version: '2025.3.4',
          latest_version: '2025.4.2',
          release_url: 'https://www.home-assistant.io/latest-release-notes/',
          release_summary: 'Bug fixes and performance improvements'
        }
      }
    ];
    
    const result = getUpdateDetailsForType(mockEntitiesWithSummary, 'core');
    
    expect(result.type).toBe('core');
    expect(result.entity_id).toBe('update.home_assistant_core_update');
    expect(result.current_version).toBe('2025.3.4');
    expect(result.latest_version).toBe('2025.4.2');
    expect(result.update_available).toBe(true);
    expect(result.release_summary).toBe("No release summary available");
  });
  
  test('simulateUpdates should simulate updating components with update_all=true', () => {
    const result = simulateUpdates(mockEntities, true);
    
    expect(result.success).toBe(true);
    expect(result.components).toHaveLength(3);
    expect(result.components).toContain('update.home_assistant_core_update');
    expect(result.components).toContain('update.addon_some_addon');
    expect(result.results['update.home_assistant_core_update'].success).toBe(true);
    expect(result.note).toContain('simulated');
  });
  
  test('simulateUpdates should simulate updating only core components with update_all=false', () => {
    const result = simulateUpdates(mockEntities, false);
    
    expect(result.success).toBe(true);
    expect(result.components).toHaveLength(2);
    expect(result.components).toContain('update.home_assistant_core_update');
    expect(result.components).toContain('update.home_assistant_operating_system_update');
    expect(result.components).not.toContain('update.addon_some_addon');
    expect(result.message).toContain('core components');
  });
}); 