"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventTypes = exports.eventBus = void 0;
exports.emitNotificationEvent = emitNotificationEvent;
const events_1 = __importDefault(require("events"));
// Create a globally accessible event emitter instance
exports.eventBus = new events_1.default();
// Define Event Types to avoid magic strings
var EventTypes;
(function (EventTypes) {
    EventTypes["COMPLETION_TOPIC_ENABLED"] = "COMPLETION.TOPIC.ENABLED";
    EventTypes["COMPLETION_UNIT_ENABLED"] = "COMPLETION.UNIT.ENABLED";
    EventTypes["COMPLETION_SUBTOPIC_ENABLED"] = "COMPLETION.SUBTOPIC.ENABLED";
    EventTypes["STUDENT_TOPIC_COMPLETION"] = "STUDENT_TOPIC_COMPLETION";
})(EventTypes || (exports.EventTypes = EventTypes = {}));
function emitNotificationEvent(eventType, payload) {
    // Execute async so it doesn't block the caller (though EventEmitter is synchronous by default)
    setImmediate(() => {
        exports.eventBus.emit(eventType, payload);
    });
}
