const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const User = require("../models/User");
const Role = require("../models/Role");

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).populate("roleId");
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Helper: find or create user from OAuth profile
async function findOrCreateUser(profile, provider) {
  const query =
    provider === "google"
      ? { googleId: profile.id }
      : { facebookId: profile.id };

  let user = await User.findOne(query);
  if (user) return user;

  // Check if email exists already (link accounts)
  const email =
    profile.emails && profile.emails[0] ? profile.emails[0].value : null;
  if (email) {
    user = await User.findOne({ email });
    if (user) {
      user[provider === "google" ? "googleId" : "facebookId"] = profile.id;
      await user.save();
      return user;
    }
  }

  // Get default "Member" role
  const memberRole = await Role.findOne({ name: "Member", isEditable: false });

  user = await User.create({
    [provider === "google" ? "googleId" : "facebookId"]: profile.id,
    email: email || `${provider}_${profile.id}@placeholder.local`,
    fullName: profile.displayName || "New Member",
    studentNumber: "",
    yearLevel: 1,
    roleId: memberRole ? memberRole._id : null,
    avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : "",
  });

  return user;
}

// Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== "your_google_client_id") {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const user = await findOrCreateUser(profile, "google");
          done(null, user);
        } catch (err) {
          done(err, null);
        }
      }
    )
  );
}

// Facebook Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_ID !== "your_facebook_app_id") {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: "/api/auth/facebook/callback",
        profileFields: ["id", "displayName", "emails", "photos"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const user = await findOrCreateUser(profile, "facebook");
          done(null, user);
        } catch (err) {
          done(err, null);
        }
      }
    )
  );
}

module.exports = passport;
