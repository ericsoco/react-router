module.exports = {
  token: null,

  gatekeeperLogin() {
    window.location = 'https://github.com/login/oauth/authorize?client_id=c2f002feaae356a50b34&redirect_uri=http://localhost:8080/auth-flow/oauth';
  },

  getToken() {
    return this.token;
  },

  setToken(val) {
    this.token = val;
  },

  loggedIn() {
    return !!this.getToken();
  },

  login(email, pass, cb) {
    cb = arguments[arguments.length - 1]
    if (localStorage.token) {
      if (cb) cb(true)
      this.onChange(true)
      return
    }
    pretendRequest(email, pass, (res) => {
      if (res.authenticated) {
        localStorage.token = res.token
        if (cb) cb(true)
        this.onChange(true)
      } else {
        if (cb) cb(false)
        this.onChange(false)
      }
    })
  },

  // getToken() {
  //   return localStorage.token
  // },

  logout(cb) {
    delete localStorage.token
    if (cb) cb()
    this.onChange(false)
  },

  // loggedIn() {
  //   return !!localStorage.token
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
