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

  updateAuth(token) {
    this.setState({
      loggedIn: !!token
    })
  },

  componentWillMount() {
    // TODO weds: get initial login flow working correctly.
    // what is desired behavior?
    // - proceed as normal if token is present
    // - auto-login if authed but token not in sessionStorage
    // - redirect to login?
    // ^^^^^ ***** ^^^^^ ?????
    auth.fetchAccessToken(null, this.updateAuth)
  },

  componentWillUpdate() {
    this.updateAuth(auth.getToken())
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
    handleSubmit(event) {
      event.preventDefault()
      auth.authorize();
    },

    render() {
      return (
        <form onSubmit={this.handleSubmit}>
          <button type="submit">login</button>
        </form>
      )
    }
  })
)

const OAuth = React.createClass({
  componentDidMount() {
    auth.fetchAccessToken(null,
      () => {
        // on success
        this.props.history.push({
          pathname: 'dashboard'
        });
      },
      () => {
        // on error
        this.props.history.push({
          pathname: 'login-failed',
          state: { errorResponse: window.location.href }
        });
      }
    );
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
