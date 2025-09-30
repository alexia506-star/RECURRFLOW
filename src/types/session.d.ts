import 'express-session';
import { MondayTokenResponse } from './index';

declare module 'express-session' {
  interface SessionData {
    mondayTokens?: MondayTokenResponse;
  }
}