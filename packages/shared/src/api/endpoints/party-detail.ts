import { z } from 'zod';
import { partyDetailDataSchema, PartyDetailQuerySchema } from '../../party-detail/schemas';

export { partyDetailDataSchema, PartyDetailQuerySchema };
export type { PartyDetailData } from '../../party-detail/schemas';

/** Next.js route: GET /api/customers/[customerId]/party */
export const partyDetailApiSegment = 'party' as const;

export const PartyDetailResponseSchema = z.object({
  data: partyDetailDataSchema,
});

export type PartyDetailResponse = z.infer<typeof PartyDetailResponseSchema>;
