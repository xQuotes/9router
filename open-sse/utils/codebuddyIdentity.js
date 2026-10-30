import { randomUUID } from "node:crypto";

/**
 * Tencent CodeBuddy / WorkBuddy backend "channel verification".
 *
 * Every chat request must carry the official-client session + trace header
 * family, otherwise the gateway rejects it with HTTP 400 / code 11128:
 *
 *   { code: 11128, msg: "request illegal",
 *     displayMsg: { en: "Request blocked. Please send it again",
 *                   zh: "请求被拦截，请重新发送", ... },
 *     displayTips: { en: "This call failed channel verification, possibly
 *       because it was not sent from an official client...", ... },
 *     actions: ["EDIT_INPUT", "SUBMIT_FEEDBACK"] }
 *
 * Upstream's own wording for 11128 is "conversation id missing" — the
 * X-Conversation-ID header family is absent. The official CLI / VSCode /
 * WorkBuddy desktop clients all send it on every request (ref: workbuddy2api-hub
 * wb_identity.py capture). The gateway does not validate the id value, so a
 * fresh UUID per request is sufficient to pass verification.
 *
 * @returns {Record<string,string>} header family to merge onto every outgoing request
 */
export function codebuddyConversationHeaders() {
  const conversationId = randomUUID(); // hyphenated UUID for X-Conversation-ID
  const hex = conversationId.replace(/-/g, ""); // 32-char hex for the id family
  const span = randomUUID().replace(/-/g, "").slice(0, 16); // 16-char span id
  return {
    "X-Conversation-ID": conversationId,
    "X-Conversation-Request-ID": hex,
    "X-Root-Request-ID": hex,
    "X-Conversation-Message-ID": hex,
    "X-Request-ID": hex,
    "X-Trace-ID": hex,
    traceparent: `00-${hex}-${span}-01`,
    b3: `${hex}-${span}-1`,
    "X-B3-TraceId": hex,
    "X-B3-SpanId": span,
    "X-B3-Sampled": "1",
  };
}

export default codebuddyConversationHeaders;
