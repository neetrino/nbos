import { Injectable } from '@nestjs/common';
import {
  retrieveKnowledgeDisabled,
  type AiKnowledgeRetrieveRequest,
  type AiKnowledgeRetrieveResult,
} from '@nbos/shared';

/**
 * Future Knowledge/RAG entry. Authorization is required; retrieval is off.
 * There is no method that accepts a query without a policy decision.
 */
@Injectable()
export class AiKnowledgeService {
  retrieve(request: AiKnowledgeRetrieveRequest): AiKnowledgeRetrieveResult {
    // authorization is a required field of AiKnowledgeRetrieveRequest
    return retrieveKnowledgeDisabled(request);
  }
}
