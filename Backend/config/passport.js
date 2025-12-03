import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import { generateTokens } from "../utils/auth/generateTokens.js";
import { ensureUserOnboarding } from "../utils/services/userOnboardingService.js";
import { logger, errorLogger } from "../utils/logger.js";


passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });
        if (!user) {
          user = new User({
            firstname: profile.name.givenName,
            lastname: profile.name.familyName,
            email: profile.emails[0].value,
            isVerified: true,
            password: "",
          });
          await user.save();
        } else if (!user.isVerified) {
          return done(null, false, {
            message: "Please verify your email first.",
          });
        }

        await ensureUserOnboarding(user, {
          firstNameForMessage: user.firstname,
        });

        const tokens = generateTokens(user, false);
        logger.info(`User ${user.email} authenticated via Google`);
        return done(null, { user, tokens });
      } catch (error) {
        errorLogger.error("Google authentication error", error);
        return done(error, null);
      }
    }
  )
);

export default passport;
