import React from 'react'
import {Card, Image, Button} from 'semantic-ui-react'


const fancyName = (name) => {
  return name.split('-').map( word => word[0].toUpperCase() + word.slice(1)).join(" ")
  }

const Github = (props) => {
  let gh = props.github
  let _name = fancyName(gh.repo_name)
  return (
  <Card >
    <Card.Content>
      <div href={`https://github.com/${gh.repo_owner}/${gh.repo_name}`}
          target="_blank" className="card-height">
        <Image floated='right' size='mini' src={gh.img_url} />
        <Card.Header>       {_name}             </Card.Header>
        <Card.Meta>         {gh.summary}        </Card.Meta>
        <Card.Description>  {gh.contribution}   </Card.Description>
      </div>
      <Button floated='right' size="mini" onClick={_ => props.startEdit(gh, 'githubs')} icon="pencil square"/>
    </Card.Content>
  </Card>
  )
}

export default Github

// <Card href={`https://github.com/${gh.repo_owner}/${gh.repo_name}`}>
//
//<img className="right floated mini ui image" src={gh.img_url} alt={_name}/>
//
//<div className="header">
//  {_name}
//</div>
//
//<div className="meta">
//  {gh.summary}
//</div>
//
//<div className="description">
//  {gh.contribution}
//</div>
//
//</Card>
