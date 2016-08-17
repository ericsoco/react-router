import React from 'react'
import { render } from 'react-dom'
import { browserHistory, Router, Route, Link, withRouter } from 'react-router'

import withExampleBasename from '../withExampleBasename'
import auth from './auth'

import fetch from 'isomorphic-fetch';

const App = React.createClass({
  render() {
    let loggedIn = auth.loggedIn();
    return (
      <div>
        <ul>
          <li>
            {loggedIn ? (
              <Link to="/logout">Log out</Link>
            ) : (
              <Link to="/login">Sign in</Link>
            )}
          </li>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/dashboard">Dashboard</Link> (authenticated)</li>
        </ul>
        {this.props.children || <p>You are {!loggedIn && 'not'} logged in.</p>}
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
      if (rsp.status >= 400) {
        // bad/expired access token
        this.props.history.push({
          pathname: '/login',
          state: { nextPathname: '/dashboard' }
        });
      } else {
        rsp.json().then(user => {
          this.setState({ user })
        });
      }
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
    componentWillMount() {
      this.componentWillUpdate();
    },

    componentWillUpdate() {
      const { location } = this.props;
      let nextPathname = location.state && location.state.nextPathname || '/';
      this.setState({
        nextPathname
      });
    },

    handleSubmit(event) {
      event.preventDefault()
      auth.authorize(this.state.nextPathname || null);
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
    let state = window.location.href.match(/state=([^&]*)/),
      pathname = '/dashboard';
    if (state && state.length > 1) {
      // technically, this is an incorrect use of OAuth2 state,
      // which is supposed to be used for additional security.
      // But it's also handy for maintaining state across redirects;
      // we use it here to redirect the user to the
      // page that initially requested the auth.
      pathname = decodeURIComponent(state[1]);
    }

    auth.fetchAccessToken(null,
      () => {
        // on success
        this.props.history.push({
          pathname
        });
      },
      () => {
        // on error
        this.props.history.push({
          pathname: '/login-failed',
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
