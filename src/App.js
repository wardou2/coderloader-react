import React from 'react'
import './App.css';
import { Icon, Menu, Segment, Sidebar, Sticky } from 'semantic-ui-react'
import Content from './components/Content'
import Login from './components/Login'
import LoggedIn from './components/LoggedIn'
import Editor from './components/Editor'
const apiURL = 'http://localhost:3000/api/v1/'

const DEFAULT_STATE = {
  jobs: [],
  githubs: [],
  interests: [],
  skills: [],
  honors: [],
  links: [],
  users: [],

  message: '',
  currentUser: {},
  sidebarVisible: false,
  loggedIn: false,
  editorDisabled: true,
  editing: {},
  editingType: ''
}

let keys = Object.keys(DEFAULT_STATE)
let anchors = keys.slice(0, 7)
// used to automate fetch -- the first 7 entries in default state
// are the names of the resources we want to fetch.

class App extends React.Component {
    constructor() {
        super()
        this.state = DEFAULT_STATE
    }

    componentDidMount() {
      //check for logged in user
      if (!!localStorage.jwt && !!localStorage.username) {
        this.setState({loggedIn: true, username: localStorage.username})
      } else {
        this.setState({loggedIn: false})
      }
      //automated fetch
      anchors.forEach( a => {
        fetch( apiURL + a )
        .then( res => res.json() )
        .then( json => this.setState({[a]: json}))
      })
      //special fetch for users
      fetch( apiURL + 'users')
      .then( res => res.json() )
      .then( users => {
        this.setState({users})
        this.setState({currentUser: users[0]})
      })
    }

    openSidebar = () => {
      this.setState({sidebarVisible: !this.state.sidebarVisible})
    }

    login = (ev, username, password) => {
      ev.preventDefault()
      this.setState({message: ''})
      fetch(apiURL + 'login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user: {username, password}})
      }).then( res => res.json() )
        .then( json => {
          // console.log('returned:', json)
          if (json && json.jwt) {
            localStorage.setItem('jwt', json.jwt)
            localStorage.setItem('username', username)
            this.setState({username: username, loggedIn: true})
          } else {
            localStorage.removeItem('jwt')
            localStorage.setItem('username', username)
            this.setState({username: '', message: json.message, loggedIn: false})
          }
        })
  }

    logOut = () => {
      this.setState({
        loggedIn: false,
        sidebarVisible: false
      })
      localStorage.removeItem('jwt')
      localStorage.removeItem('username')
    }

    startEdit = (content, type) => {
      if (localStorage.getItem('jwt') !== '') {
        this.setState({
          editing: content,
          editingType: type,
          editorDisabled: false,
          sidebarVisible: true
        }) //, ()=>console.log('set up edit', this.state.editingType))
      } else {
        alert('Please log in to edit')
      }
    }

    handleSubmit = (content) => {
      let token = localStorage.getItem('jwt')
      fetch(apiURL+this.state.editingType+'/'+content.id, {
        method: "PATCH",
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...content
        })
      })
      .then(res => res.json())
      .catch(error => console.log(error))
      .then(json => {
        let editingTypeCopy=this.state.editingType
        switch(editingTypeCopy) {
          case "users":
            this.setState({
              users: [json],
              currentUser: json,
              sidebarVisible: false,
              editorDisabled: true,
              editingType: '',
            })
            break
          case "skills":
            let skillsCopy = this.state.skills.map(skill => {
              return (skill.id === content.id) ? content : skill
            })
            this.setState({
              skills: skillsCopy,
            })
            break
          case "jobs":
            let jobsCopy = this.state.jobs.map(job => {
              return (job.id === content.id) ? content : job
            })
            this.setState({
              jobs: jobsCopy,
              sidebarVisible: false,
              editingType: '',
            })
            break
          case "githubs":
            let githubsCopy = this.state.githubs.map(github => {
              return (github.id === content.id) ? content : github
            })
            this.setState({
              githubs: githubsCopy,
              sidebarVisible: false,
              editingType: '',
            })
            break
          default:
            this.setState({
              sidebarVisible: false,
              editingType: '',
          })
        }
      })
    }

    shiftOrder = (skill, right) => {
      let skills = this.state.skills.sort( (a,b) => a.order_id - b.order_id )
      let orderIds = skills.map( s => s.order_id )
      let curIndex = orderIds.indexOf( skill.order_id )
      let maxPos = orderIds.length-1

      console.log({skills, skill, curIndex, maxPos})
      console.log('input(id, order_id):', skills.map(s => s.id) + ' ' + orderIds)
      console.log('skill(id, order_id):', skill.id + ' ' + skill.orderId)

      if (curIndex === maxPos && right) {
        console.log( 'going right at end')
        let t = orderIds[maxPos]
        orderIds[maxPos] = orderIds[0]
        orderIds[0] = t
      } else if (curIndex === 0 && !right) {
        console.log( 'going left at beginning')
        let t = orderIds[0]
        orderIds[0] = orderIds[maxPos]
        orderIds[maxPos] = t
      } else {
        if (right < 1) {right = -1}
        else right = 1
        console.log( 'moving', right, 'from', curIndex)
        let t = orderIds[curIndex]
        orderIds[curIndex] = orderIds[curIndex + right]
        orderIds[curIndex + right] = t
      }
      console.log('output(id, order_id):', skills.map(s => s.id) + ' ' + orderIds)
      
      let token = localStorage.jwt

      skills.forEach( (skill, index) => {
        if (skill.order_id !== orderIds[index]) {
          console.log('making skill.order_id '+skill.order_id+ ' into ' + orderIds[index])
          skill.order_id = orderIds[index]
          fetch(apiURL + 'skills/' + skill.id, {
            method: "PATCH",
            headers: {
              'Authorization': 'Bearer ' + token,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({...skill})
          }).then( res => res.json() )
            .then( console.log )
        }
      })
      this.setState({skills})
    }
  

    render() {
        return(
          <Sidebar.Pushable as={Segment} className="gray-bg fix-sidebar">
            <Sticky>
              <Sidebar as={Menu} animation='overlay'
                 direction='right' icon='labeled'
                 inverted vertical
                 visible={this.state.sidebarVisible}
                 width='wide'
               >
                 <Menu.Item as='a' onClick={this.openSidebar}>
                   <Icon name='bars' size="mini"/>
                   Close
                 </Menu.Item>
                 <Menu.Item as='a'>
                    {(this.state.loggedIn && localStorage.getItem('jwt')) 
                      ? <LoggedIn username={this.state.username} logOut={this.logOut}/>
                      : <Login login={this.login} message={this.state.message}/>
                    }
                 </Menu.Item>

                 <Editor
                  editorDisabled={this.state.editorDisabled}
                  editing={this.state.editing}
                  handleSubmit={this.handleSubmit}
                  editingType={this.state.editingType}
                  startEdit={this.startEdit}
                 />

               </Sidebar>
             </Sticky>
             <Sidebar.Pusher dimmed={false}>
              <Segment basic >

                <Content
                  openSidebar={this.openSidebar}
                  startEdit={this.startEdit}
                  shiftOrder={this.shiftOrder}
                  jobs={this.state.jobs}
                  githubs={this.state.githubs}
                  interests={this.state.interests}
                  skills={this.state.skills}
                  honors={this.state.honors}
                  links={this.state.links}
                  users={this.state.users}
                  currentUser= {this.state.currentUser}
                  editing={this.state.editing}
                  loggedIn={this.state.loggedIn}
                />

              </Segment>
            </Sidebar.Pusher>
          </Sidebar.Pushable>
        )
    }
}

export default App
