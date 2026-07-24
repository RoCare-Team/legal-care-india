import mongoose from 'mongoose';

const { Schema } = mongoose;

/** A single chat message within a consultation session. */
const MessageSchema = new Schema(
  {
    from: { type: String, enum: ['user', 'advocate'], required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    at: { type: Date, default: Date.now },
  },
  { _id: true }
);

/**
 * Call — the WebRTC video-call leg of a consultation.
 *
 * The two browsers stream to each other directly (peer-to-peer); this
 * sub-document is only the *signalling* channel they use to find one another.
 * Each side writes its SDP (`offer`/`answer`) and ICE candidates here and
 * polls for the other's. Once connected, no audio or video passes through us.
 *
 * Only the client may ring; the lawyer accepts or rejects — the same direction
 * as the booking itself. `id` is regenerated per attempt so both sides can tell
 * a fresh ring apart from the leftovers of the previous one.
 *
 * Lifecycle:  idle → ringing → active → ended
 */
const CallSchema = new Schema(
  {
    id: { type: String, default: '' },
    status: {
      type: String,
      enum: ['idle', 'ringing', 'active', 'ended'],
      default: 'idle',
    },
    // 'rejected' | 'hangup' | 'unanswered' | 'session-ended' | 'failed'
    endedReason: { type: String, default: '' },
    // Who hung up, for the wording the other side sees.
    endedBy: { type: String, enum: ['user', 'advocate', ''], default: '' },

    // Signalling payloads (stringified RTCSessionDescription / RTCIceCandidate).
    offer: { type: String, default: '' },
    answer: { type: String, default: '' },
    userCandidates: { type: [String], default: [] },
    advocateCandidates: { type: [String], default: [] },

    ringingAt: { type: Date, default: null },
    connectedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
  },
  { _id: false }
);

/**
 * Consultation — a paid, time-boxed chat session a user books with a lawyer.
 *
 * Lifecycle:
 *   pending   → user booked, waiting for the lawyer to accept
 *   active    → lawyer accepted; wallet charged; chat open until `endsAt`
 *   ended     → time up or ended early
 *   rejected  → lawyer declined (no charge)
 *   cancelled → user backed out while still pending (no charge)
 */
const ConsultationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userName: { type: String, default: '' },
    advocateId: { type: Schema.Types.ObjectId, ref: 'Advocate', required: true, index: true },
    advocateName: { type: String, default: '' },

    // Which kind of session: a text live-chat, or a video call (priced from the
    // lawyer's separate video plans). The video call itself still rides on the
    // `call` sub-document below — `type` only changes pricing and which UI opens.
    type: { type: String, enum: ['chat', 'video'], default: 'chat' },

    minutes: { type: Number, required: true },
    price: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ['pending', 'active', 'ended', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },

    messages: { type: [MessageSchema], default: [] },

    // Video-call signalling for this session (see CallSchema above).
    call: { type: CallSchema, default: () => ({}) },

    startedAt: { type: Date, default: null }, // when the lawyer accepted
    endsAt: { type: Date, default: null },    // startedAt + minutes (planned end)
    endedAt: { type: Date, default: null },   // when it actually ended

    // Free "resume" of leftover time. When a session ends early, the unused
    // minutes can be reconnected once, free, within 24h. `resumedFromId` points
    // a free resume back at the paid session it drew from; `resumed` marks that
    // paid session's leftover as spent so it can't be claimed twice.
    resumedFromId: { type: Schema.Types.ObjectId, ref: 'Consultation', default: null },
    resumed: { type: Boolean, default: false },

    // Either side can clear the row from their own list. The record itself
    // stays, so hiding it on one side never affects the other.
    hiddenForAdvocate: { type: Boolean, default: false },
    hiddenForUser: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Consultation ||
  mongoose.model('Consultation', ConsultationSchema);
