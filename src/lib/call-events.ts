import { EventEmitter } from "events";
import type { Call } from "@prisma/client";

export interface CallEvent {
  type: "live_call" | "call_completed";
  workspaceId: string;
  call: Partial<Call> & {
    toNumber?: string;
    fromNumber?: string;
    status?: string;
    duration?: number;
    recordingUrl?: string;
  };
}

// Create a typed event emitter for call events
class CallEventEmitter extends EventEmitter {
  emitCallEvent(event: CallEvent) {
    console.log(
      "[CallEventEmitter] Emitting event:",
      event.type,
      "workspace:",
      event.workspaceId,
    );
    console.log(
      "[CallEventEmitter] Listener count:",
      this.listenerCount("call-event"),
    );
    this.emit("call-event", event);
  }

  onCallEvent(handler: (event: CallEvent) => void) {
    this.on("call-event", handler);
    return () => this.off("call-event", handler);
  }
}

export const callEventEmitter = new CallEventEmitter();
