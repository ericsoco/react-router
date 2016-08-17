module.exports = {
  config: {
    githubAPIClientId: 'c2f002feaae356a50b34',
    redirectURL: 'http://localhost:8080/auth-flow/oauth',
    gatekeeperAccessTokenURL: 'https://open-redistricting-auth.herokuapp.com/authenticate/',
    tokenName: 'github-auth'
  },

  authorize() {
    window.location = 'https://github.com/login/oauth/authorize?client_id=' + this.config.githubAPIClientId + '&redirect_uri=' + this.config.redirectURL;
  },

  // TODO: refactor to use Promises
  fetchAccessToken(code, onSuccess, onError) {
    let accessToken = this.getToken();
    if (accessToken) {
      onSuccess(accessToken);
      return;
    }

    if (!code) {
      code = window.location.href.match(/\?code=(.*)/);
      if (!code || code.length < 1) {
        onError && onError();
      }
      code = code[1];
    }

    fetch(this.config.gatekeeperAccessTokenURL + code)
    .then(rsp => {
      return rsp.json().then(j => {
        this.setToken(j.token);
        onSuccess && onSuccess(this.getToken());
      });
    });

  },

  getToken() {
    return window.sessionStorage[this.config.tokenName];
  },

  setToken(val) {
    window.sessionStorage[this.config.tokenName] = val;
  },

  clearToken() {
    delete window.sessionStorage[this.config.tokenName];
  },

  loggedIn() {
    return !!this.getToken();
  },

  /*
  login(email, pass, cb) {
    cb = arguments[arguments.length - 1]
    if (window.sessionStorage[tokenName]) {
      if (cb) cb(true)
      this.onChange(true)
      return
    }
    pretendRequest(email, pass, (res) => {
      if (res.authenticated) {
        window.sessionStorage[tokenName] = res.token
        if (cb) cb(true)
        this.onChange(true)
      } else {
        if (cb) cb(false)
        this.onChange(false)
      }
    })
  },
  */
  // getToken() {
  //   return window.sessionStorage[tokenName]
  // },

  logout(cb) {
    this.clearToken();
    if (cb) cb()
    this.onChange(false)
  },

  // loggedIn() {
  //   return !!window.sessionStorage[tokenName]
  // },

  onChange() {}
}

function pretendRequest(email, pass, cb) {
  setTimeout(() => {
    if (email === 'joe@example.com' && pass === 'password1') {
      cb({
        authenticated: true,
        token: Math.random().toString(36).substring(7)
      })
    } else {
      cb({ authenticated: false })
    }
  }, 0)
}
