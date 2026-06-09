import EventEmitter from 'events';

// Create a globally accessible event emitter instance
export const eventBus = new EventEmitter();

// Define Event Types to avoid magic strings
export enum EventTypes {
  COMPLETION_TOPIC_ENABLED = 'COMPLETION.TOPIC.ENABLED',
  COMPLETION_UNIT_ENABLED = 'COMPLETION.UNIT.ENABLED',
  COMPLETION_SUBTOPIC_ENABLED = 'COMPLETION.SUBTOPIC.ENABLED',
  STUDENT_TOPIC_COMPLETION = 'STUDENT_TOPIC_COMPLETION',
}

// Payload interface contract
export interface NotificationEventPayload {
  organization_id: string;
  actor_id: string;
  entity: {
    type: string;
    id: string;
    name: string;
  };
  context: {
    academic_year_id: string;
    grade_id: string;
    section_id?: string | null;
    subject_id: string;
  };
}

export function emitNotificationEvent(eventType: EventTypes, payload: NotificationEventPayload) {
  // Execute async so it doesn't block the caller (though EventEmitter is synchronous by default)
  setImmediate(() => {
    eventBus.emit(eventType, payload);
  });
}
