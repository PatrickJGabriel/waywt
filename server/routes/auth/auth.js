const url = require('url');
const router = require('express').Router();
const passport = require('passport');
const jwt = require('../../config/jwt');
const { User, Profile, Follower } = require('../../models');
const env = process.env.NODE_ENV || 'development';

require('../../config/passport');

let loginUrl = '/login';
let redirectUrl = '/auth/cb';

if (env === 'development') {
  loginUrl = 'http://localhost:3000/login',
  redirectUrl = 'http://localhost:3000/auth/cb'
}

const createTempToken = (req, res, next) => {
  req.tempToken = jwt.createTempToken();
  next();
};

const validateTempToken = (req, res, next) => {
  if (jwt.decodeToken(req.query.state).valid) {
    next();
  } else {
    res.redirect(loginUrl);
  }
};

const facebookAuthenticate = (req, res, next) => {
  passport.authenticate('auth-user-facebook', {
    state: req.tempToken,
    session: false,
  })(req, res, next);
};

const googleAuthenticate = (req, res, next) => {
  passport.authenticate('auth-user-google', {
    state: req.tempToken,
    session: false,
  })(req, res, next);
};

const redirect = (res, user) => {
  return res.redirect(url.format({
    pathname: redirectUrl,
    query: {
       accessToken: jwt.createToken(user),
       redirect: true,
    },
  }));
}

router.get('/facebook', createTempToken, facebookAuthenticate);

router.get('/facebook/callback', validateTempToken, passport.authenticate('auth-user-facebook', { session: false }), (req, res) => {
  (async () => {
    const fbUser = req.user._json;
    let user;

    user = await User.findOne({ where: { FacebookId: fbUser.id } });
    user = user || await User.findOne({ where: { email: fbUser.email } });

    if (user) {
      if (!user.FacebookId) {
        await User.update({
          FacebookId: fbUser.id,
        },
        {
          where: {
            email: fbUser.email,
          },
        });
      }

      return redirect(res, user);
    }
    const newUser = await User.create({
      username: fbUser.name.replace(/ /g, '_'),
      email: fbUser.email,
      FacebookId: fbUser.id,
    });

    return redirect(res, newUser);
  })();
});

router.get('/google', createTempToken, googleAuthenticate);

router.get('/google/callback', validateTempToken, passport.authenticate('auth-user-google', { session: false }), (req, res) => {
  (async () => {
    const googleUser = req.user._json;
    let user;

    user = await User.findOne({ where: { GoogleId: googleUser.id } });
    user = user || await User.findOne({ where: { email: googleUser.emails[0].value } });

    if (user) {
      if (!user.GoogleId) {
        await User.update({
          GoogleId: googleUser.id,
        },
        {
          where: {
            email: googleUser.emails[0].value,
          },
        });
      }

      return redirect(res, user);
    }
    const newUser = await User.create({
      username: googleUser.displayName.replace(/ /g, '_'),
      email: googleUser.emails[0].value,
      GoogleId: googleUser.id,
    });

    return redirect(res, newUser);
  })();
});

router.post('/signup', (req, res) => {
  (async () => {
    const { username, email, password } = req.body;
    let user;

    user = await User.findOne({ where: { username: username } });

    if (user) {
      return res.json({ error: { username: 'Username already taken.'} });
    } else {
      user = await User.findOne({ where: { email: email } });
    }
    
    if (user) {
      return res.json({ error: { email: 'User with this email already exists.'} });
    } 
   
    try {
      const newUser = await User.create({
        username: username,
        email: email,
        password: password,
      });
      return res.json({accessToken: jwt.createToken(newUser)});
    } catch (e) {
      return res.json({ error: e.errors });
    }
  })();
});

router.post('/login', (req, res) => {
  (async () => {
    const { usernameOrEmail, password } = req.body;
    let user;

    if (/@/.test(usernameOrEmail)) {
      user = await User.findOne({ where: { email: usernameOrEmail }});
    } else {
      user = await User.findOne({ where: { username: usernameOrEmail }});
    }
   
    if (!user) return res.json({error: { usernameOrEmail: 'Could not find user.'}});

    if (!user.password && user.FacebookId) {
      res.redirect('/auth/facebook');
    } else if (!user.password && user.GoogleId) {
      res.redirect('/auth/google');
    } else if (user.validPassword(password)) {
      return res.json({accessToken: jwt.createToken(user)});
    } else {
      return res.json({ error: { password: 'Invalid Password.'}});
    }
  })();
});

router.get('/user', passport.authenticate('auth-user', {session: false}), (req, res) => {
  User.findOne({
    where: {
      username: req.user.id,
    }
  }).then(result => {
    res.json({authenticated: true});
  });
});

module.exports = router;
