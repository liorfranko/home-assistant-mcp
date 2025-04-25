# Active Context

*(Updated 2025-04-25)*

This document tracks the current focus and state of the project:

- **Current Focus:** Project is operational with a comprehensive set of Home Assistant and Node-RED integration tools, now enhanced with WebSocket capabilities.
- **Recent Changes:** 
  - Full suite of Home Assistant tools implemented (Automations, Entities, Media Players, Updates, Scenes, Themes)
  - Node-RED integration tools completed (Flow management)
  - MQTT messaging capabilities added
  - **New:** WebSocket client implementation for real-time Home Assistant communication
    - Core WebSocket functionality (connection, authentication, commands)
    - Event subscription and handling
    - Automatic reconnection and ping/pong keep-alive
- **Next Steps:** 
  - Implement remaining WebSocket methods (subscribe_trigger, fire_event, get_services, get_panels, validate_config)
  - Create comprehensive tests for WebSocket client
  - Verify all tool functionalities
  - Consider adding more sophisticated error handling
  - Potentially add more documentation for tool usage patterns
- **Decisions:** 
  - Using TypeScript for type safety and better development experience
  - Structured tools by domain (HA vs Node-RED) for better organization
  - Implemented comprehensive testing setup with Jest
  - **New:** Chose EventEmitter pattern for WebSocket event handling
  - **New:** Implemented automatic reconnection for WebSocket resilience
- **Patterns & Preferences:** 
  - Modular tool architecture with clear separation of concerns
  - Strong typing for all API interactions
  - Comprehensive error handling and validation
  - **New:** Real-time event handling via WebSocket subscriptions
  - **New:** Promise-based async/await pattern for WebSocket commands
- **Learnings:** 
  - Successfully integrated with both Home Assistant and Node-RED APIs
  - Implemented secure authentication handling
  - Created a flexible tool registration system
  - **New:** Effective WebSocket state management and event handling patterns
  - **New:** Robust reconnection and keep-alive strategies

*(This file should be updated frequently)* 