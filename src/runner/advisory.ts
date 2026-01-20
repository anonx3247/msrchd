/**
 * Advisory system for notifying agents about publication status changes and review events.
 *
 * This singleton allows the publication system to push notifications to agents in real-time,
 * which are then delivered as text content appended to tool results in the runner's tick() method.
 */

export type AdvisoryMessage =
  | {
      type: "review_requested";
      publicationReference: string;
      publicationTitle: string;
    }
  | {
      type: "review_received";
      publicationReference: string;
      publicationTitle: string;
      reviewerIndex: number;
      grade: string;
    }
  | {
      type: "publication_status_updated";
      publicationReference: string;
      publicationTitle: string;
      status: "PUBLISHED" | "REJECTED";
    };

class AdvisorySingleton {
  private queues: Map<number, AdvisoryMessage[]> = new Map();
  private initialized = false;

  /**
   * Initialize the advisory system with agent indices.
   * Must be called before any push/pop operations.
   */
  init(agentIndices: number[]): void {
    this.queues.clear();
    for (const idx of agentIndices) {
      this.queues.set(idx, []);
    }
    this.initialized = true;
  }

  /**
   * Push a message to an agent's queue.
   * If the advisory is not initialized or agent doesn't exist, silently ignores.
   */
  push(agentIndex: number, msg: AdvisoryMessage): void {
    if (!this.initialized) {
      return;
    }
    const queue = this.queues.get(agentIndex);
    if (queue) {
      queue.push(msg);
    }
  }

  /**
   * Pop all messages from an agent's queue.
   * Returns an empty array if the agent doesn't exist or advisory is not initialized.
   */
  pop(agentIndex: number): AdvisoryMessage[] {
    if (!this.initialized) {
      return [];
    }
    const queue = this.queues.get(agentIndex);
    if (!queue) {
      return [];
    }
    const messages = [...queue];
    queue.length = 0;
    return messages;
  }

  /**
   * Convert an advisory message to a human-readable string.
   */
  toString(msg: AdvisoryMessage): string {
    switch (msg.type) {
      case "review_requested":
        return `[ADVISORY] You have been requested to review publication "${msg.publicationTitle}" (ref: ${msg.publicationReference}).`;
      case "review_received":
        return `[ADVISORY] Your publication "${msg.publicationTitle}" (ref: ${msg.publicationReference}) received a review from Agent ${msg.reviewerIndex} with grade: ${msg.grade}.`;
      case "publication_status_updated":
        return `[ADVISORY] Your publication "${msg.publicationTitle}" (ref: ${msg.publicationReference}) has been ${msg.status}.`;
    }
  }
}

export const Advisory = new AdvisorySingleton();
