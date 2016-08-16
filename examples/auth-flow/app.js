import React from 'react'
import { render } from 'react-dom'
import { browserHistory, Router, Route, Link, withRouter } from 'react-router'

import withExampleBasename from '../withExampleBasename'
import auth from './auth'

import fetch from 'isomorphic-fetch';

const App = React.createClass({
  getInitialState() {
    return {
      loggedIn: auth.loggedIn()
    }
  },

  updateAuth(loggedIn) {
    this.setState({
      loggedIn
    })
  },

  componentWillMount() {
    auth.onChange = this.updateAuth
    // auth.login()
  },

  render() {
    return (
      <div>
        <ul>
          <li>
            {this.state.loggedIn ? (
              <Link to="/logout">Log out</Link>
            ) : (
              <Link to="/login">Sign in</Link>
            )}
          </li>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/dashboard">Dashboard</Link> (authenticated)</li>
        </ul>
        {this.props.children || <p>You are {!this.state.loggedIn && 'not'} logged in.</p>}
      </div>
    )
  }
})

const Dashboard = React.createClass({
  componentWillMount () {
    // make authed call to GH
    var headers = new Headers();
    headers.append("Authorization", "token " + auth.getToken());
    fetch('https://api.github.com/user', {
      headers: headers
    })
    .then(rsp => {
      rsp.json().then(user => {
        console.log(user);
        this.setState({ user })
      });
    });
  },
  render() {
    const token = auth.getToken()

    return (
      <div>
        <h1>Dashboard</h1>
        <p>You made it!</p>
        <p>token: {token}</p>
        <p>user: {this.state ? JSON.stringify(this.state.user) : ''}</p>
      </div>
    )
  }
})

const Login = withRouter(
  React.createClass({

    getInitialState() {
      return {
        error: false
      }
    },

    handleSubmit(event) {
      event.preventDefault()

      auth.gatekeeperLogin();
    },

    render() {
      return (
        <form onSubmit={this.handleSubmit}>
          <label><input ref="email" placeholder="email" defaultValue="joe@example.com" /></label>
          <label><input ref="pass" placeholder="password" /></label> (hint: password1)<br />
          <button type="submit">login</button>
          {this.state.error && (
            <p>Bad login information</p>
          )}
        </form>
      )
    }
  })
)

const OAuth = React.createClass({
  componentDidMount() {
    var code = window.location.href.match(/\?code=(.*)/);
    if (!code || code.length < 1) {
      this.props.history.push({
        pathname: 'login-failed',
        state: { errorResponse: window.location.href }
      });
    }
    code = code[1];
    fetch('https://open-redistricting-auth.herokuapp.com/authenticate/' + code)
    .then(rsp => {
      return rsp.json().then(j => {
        auth.setToken(j.token);
        this.props.history.push({
          pathname: 'dashboard'
        });
      });
    });
  },

  render() {
    return <h1>Logging in...</h1>
  }
})

const LoginFailed = React.createClass({
  render() {
    return <div><h1>Login failed :(</h1><p>{ this.props.history.state }</p></div>
  }
})

const About = React.createClass({
  render() {
    return <h1>About</h1>
  }
})

const Logout = React.createClass({
  componentDidMount() {
    auth.logout()
  },

  render() {
    return <p>You are now logged out</p>
  }
})

function requireAuth(nextState, replace) {
  if (!auth.loggedIn()) {
    replace({
      pathname: '/login',
      state: { nextPathname: nextState.location.pathname }
    })
  }
}

render((
  <Router history={withExampleBasename(browserHistory, __dirname)}>
    <Route path="/" component={App}>
      <Route path="login" component={Login} />
      <Route path="logout" component={Logout} />
      <Route path="login-failed" component={LoginFailed} />
      <Route path="oauth" component={OAuth} />
      <Route path="about" component={About} />
      <Route path="dashboard" component={Dashboard} onEnter={requireAuth} />
    </Route>
  </Router>
), document.getElementById('example'))
