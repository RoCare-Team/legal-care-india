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
 * Consultation — a live session a user books with a lawyer, billed by the
 * minute.
 *
 * Nothing is charged up front. The lawyer's per-minute `rate` is snapshotted
 * when the session is created (so a rate change mid-call can't move the
 * price), the clock starts when they accept, and the wallet transfer happens
 * once — at the end, for the minutes actually used.
 *
 * `maxMinutes` is the ceiling the user's wallet could afford at booking time.
 * It is what `endsAt` is built from, so a session cuts off rather than running
 * up a bill nobody can pay.
 *
 * Lifecycle:
 *   pending   → user booked, waiting for the lawyer to accept (no charge)
 *   active    → lawyer accepted; clock running until `endsAt`
 *   ended     → hung up or ran out of affordable time; wallet settled here
 *   rejected  → lawyer declined (no charge)
 *   cancelled → user backed out while still pending (no charge)
 */
const ConsultationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userName: { type: String, default: '' },
    advocateId: { type: Schema.Types.ObjectId, ref: 'Advocate', required: true, index: true },
    advocateName: { type: String, default: '' },

    // Which kind of session: a text live-chat, a video call, or an audio-only
    // call — each priced from the lawyer's own separate plan list. Video and
    // audio both ride on the `call` sub-document below; `type` only changes
    // pricing and which UI opens (audio just never asks for the camera).
    type: { type: String, enum: ['chat', 'video', 'audio'], default: 'chat' },

    // ₹ per minute, copied from the lawyer's profile when the session is
    // created. The session bills at this rate for its whole life even if the
    // lawyer edits their profile halfway through.
    rate: { type: Number, default: 0, min: 0 },
    // The most minutes the user's wallet could cover at that rate when they
    // booked — the hard cap `endsAt` is derived from.
    maxMinutes: { type: Number, default: 0, min: 0 },

    // What was actually billed. Both stay 0 until the session ends and
    // `settleCharges` runs; `settled` makes that transfer exactly-once, since
    // a session can be finalised by either party hanging up or by expiring on
    // a poll, and those can race.
    minutes: { type: Number, default: 0 },
    price: { type: Number, default: 0, min: 0 },
    settled: { type: Boolean, default: false },

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
