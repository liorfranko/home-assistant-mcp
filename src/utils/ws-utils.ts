import {
  Auth,
  createConnection,
  getStates,
  getConfig,
  getServices,
  callService,
  createLongLivedTokenAuth,
} from 'home-assistant-js-websocket';

// Polyfill WebSocket for Node.js
import ws from 'ws';
const wnd = globalThis as any;
wnd.WebSocket = ws;

export class HomeAssistantWebSocketClient {
  private connection: any = null;
  private auth: Auth | null = null;
  private url: string;
  private token: string;

  constructor(options: { url: string; token: string }) {
    this.url = options.url;
    this.token = options.token;
  }

  async connect(): Promise<void> {
    if (this.connection) return;
    this.auth = await createLongLivedTokenAuth(this.url.replace(/^ws/, 'http').replace(/\/api\/websocket$/, ''), this.token);
    this.connection = await createConnection({ auth: this.auth });
  }

  async getConfig() {
    await this.connect();
    return await getConfig(this.connection);
  }

  async getStates() {
    await this.connect();
    return await getStates(this.connection);
  }

  async callService(domain: string, service: string, serviceData?: Record<string, any>, target?: { entity_id?: string | string[]; device_id?: string | string[]; area_id?: string | string[] }) {
    await this.connect();
    return await callService(this.connection, domain, service, serviceData, target);
  }

  async subscribeEvents(callback: (event: any) => void, eventType?: string): Promise<() => Promise<void>> {
    await this.connect();
    const unsub = await this.connection.subscribeEvents((evt: any) => callback(evt), eventType);
    return async () => { await unsub(); };
  }

  async subscribeTrigger(callback: (event: any) => void, trigger: any): Promise<() => Promise<void>> {
    await this.connect();
    // subscribe_trigger is not a direct method, so use subscribeMessage
    const unsub = await this.connection.subscribeMessage(
      (evt: any) => callback(evt),
      { type: 'subscribe_trigger', trigger }
    );
    return async () => { await unsub(); };
  }

  async fireEvent(eventType: string, eventData?: Record<string, any>) {
    await this.connect();
    return await this.connection.sendMessagePromise({
      type: 'fire_event',
      event_type: eventType,
      event_data: eventData,
    });
  }

  async getServices() {
    await this.connect();
    return await getServices(this.connection);
  }

  async validateConfig() {
    await this.connect();
    return await this.connection.sendMessagePromise({
      type: 'core/check_config'
    });
  }

} 