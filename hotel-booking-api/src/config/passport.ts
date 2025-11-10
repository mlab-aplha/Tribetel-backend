import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Profile as GoogleProfile,
} from "passport-google-oauth20";
import {
  Strategy as FacebookStrategy,
  Profile as FacebookProfile,
} from "passport-facebook";
import { User } from "../models";

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: GoogleProfile,
      done
    ) => {
      try {
        let user = await User.findOne({
          where: { google_id: profile.id },
        });

        if (user) {
          return done(null, user);
        }

        user = await User.create({
          google_id: profile.id,
          email: profile.emails![0].value,
          first_name: profile.name!.givenName!,
          last_name: profile.name!.familyName!,
          profile_picture: profile.photos![0].value,
          email_verified: true,
          auth_provider: "google",
        });

        done(null, user);
      } catch (error) {
        done(error as Error, undefined);
      }
    }
  )
);

// Facebook OAuth Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID!,
      clientSecret: process.env.FACEBOOK_APP_SECRET!,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL!,
      profileFields: ["id", "emails", "name", "picture"],
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: FacebookProfile,
      done
    ) => {
      try {
        let user = await User.findOne({
          where: { facebook_id: profile.id },
        });

        if (user) {
          return done(null, user);
        }

        user = await User.create({
          facebook_id: profile.id,
          email: profile.emails![0].value,
          first_name: profile.name!.givenName!,
          last_name: profile.name!.familyName!,
          profile_picture: profile.photos![0].value,
          email_verified: true,
          auth_provider: "facebook",
        });

        done(null, user);
      } catch (error) {
        done(error as Error, undefined);
      }
    }
  )
);

export default passport;
