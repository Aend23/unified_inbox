// Pusher-based Yjs provider for collaborative editing
import * as Y from "yjs";
import Pusher from "pusher-js";
import * as awarenessProtocol from "y-protocols/awareness";

export class PusherYjsProvider {
  public doc: Y.Doc;
  public awareness: awarenessProtocol.Awareness;
  private pusher: Pusher;
  private channel: any;
  private channelName: string;
  private connected: boolean = false;
  private clientId: string;

  constructor(
    pusherKey: string,
    pusherCluster: string,
    channelName: string,
    doc: Y.Doc,
    options: {
      awareness?: awarenessProtocol.Awareness;
      user?: { id: string; name: string; color: string };
    } = {}
  ) {
    this.doc = doc;
    this.channelName = `private-${channelName}`;
    this.clientId = Math.random().toString(36).substring(7);

    // Initialize awareness
    this.awareness = options.awareness || new awarenessProtocol.Awareness(doc);

    // Set user info if provided
    if (options.user) {
      this.awareness.setLocalStateField("user", options.user);
    }

    // Initialize Pusher
    this.pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
      channelAuthorization: {
        endpoint: "/api/pusher/auth",
        transport: "ajax",
      },
    });

    // Connect to channel
    this.channel = this.pusher.subscribe(this.channelName);

    this.channel.bind("pusher:subscription_succeeded", () => {
      this.connected = true;
      this.syncDoc();
    });

    // Listen for document updates from other clients
    this.channel.bind("yjs-update", (data: { update: number[]; clientId: string }) => {
      if (data.clientId !== this.clientId) {
        const update = new Uint8Array(data.update);
        Y.applyUpdate(this.doc, update, "pusher");
      }
    });

    // Listen for awareness updates
    this.channel.bind("awareness-update", (data: { update: number[]; clientId: string }) => {
      if (data.clientId !== this.clientId) {
        const update = new Uint8Array(data.update);
        awarenessProtocol.applyAwarenessUpdate(this.awareness, update, "pusher");
      }
    });

    // Send document updates to other clients
    this.doc.on("update", (update: Uint8Array, origin: any) => {
      if (origin !== "pusher" && this.connected) {
        this.channel.trigger("client-yjs-update", {
          update: Array.from(update),
          clientId: this.clientId,
        });
      }
    });

    // Send awareness updates to other clients
    this.awareness.on("update", ({ added, updated, removed }: any) => {
      const changedClients = added.concat(updated).concat(removed);
      const update = awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients);
      if (this.connected) {
        this.channel.trigger("client-awareness-update", {
          update: Array.from(update),
          clientId: this.clientId,
        });
      }
    });
  }

  private syncDoc() {
    // Request full document sync on initial connection
    const stateVector = Y.encodeStateVector(this.doc);
    this.channel.trigger("client-request-sync", {
      stateVector: Array.from(stateVector),
      clientId: this.clientId,
    });
  }

  public destroy() {
    this.awareness.destroy();
    this.pusher.unsubscribe(this.channelName);
    this.pusher.disconnect();
  }

  public on(event: string, callback: (...args: any[]) => void) {
    if (event === "status") {
      // Emit connection status
      this.channel.bind("pusher:subscription_succeeded", () => callback({ status: "connected" }));
      this.channel.bind("pusher:subscription_error", () => callback({ status: "error" }));
    }
  }
}
