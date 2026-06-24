import { registerAs } from '@nestjs/config';

export default registerAs('throttler', () => ({
  ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
  limit: parseInt(process.env.THROTTLE_LIMIT || '10', 10),
  feedbackLimit: parseInt(process.env.FEEDBACK_THROTTLE_LIMIT || '5', 10),
}));
