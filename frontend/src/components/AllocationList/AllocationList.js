import React, { PureComponent, PropTypes } from 'react'
import { Grid, Row, Col } from 'react-flexbox-grid'
import FontIcon from 'material-ui/FontIcon'
import { Link } from 'react-router'
import { Card, CardHeader, CardText } from 'material-ui/Card'
import SelectField from '../SelectField/SelectField'
import TextField from 'material-ui/TextField';
import MenuItem from 'material-ui/MenuItem'
import { Table, Column, Cell } from 'fixed-data-table';
import 'fixed-data-table/dist/fixed-data-table.css'
import AllocationStatusIcon from '../AllocationStatusIcon/AllocationStatusIcon'
import AllocationLink from '../AllocationLink/AllocationLink'
import JobLink from '../JobLink/JobLink'
import ClientLink from '../ClientLink/ClientLink'
import FormatTime from '../FormatTime/FormatTime'

const nodeIdToNameCache = {}

const getAllocationNumberFromName = (allocationName) => {
  const match = /[\d+]/.exec(allocationName)
  return match[0]
}

/* eslint-disable react/prop-types */

const AllocationStatusIconCell = ({ rowIndex, data, ...props }) => (
  <Cell { ...props }>
    <AllocationStatusIcon allocation={ data[rowIndex] } />
  </Cell>
);

const AllocationLinkCell = ({ rowIndex, data, ...props }) => (
  <Cell { ...props }>
    <AllocationLink allocationId={ data[rowIndex].ID } />
  </Cell>
);

const JobLinkCell = ({ rowIndex, data, ...props }) => (
  <Cell { ...props }>
    <JobLink jobId={ data[rowIndex].JobID } />
  </Cell>
);

const JobTaskGroupLinkCell = ({ rowIndex, data, ...props }) => (
  <Cell { ...props }>
    <JobLink jobId={ data[rowIndex].JobID } taskGroupId={ data[rowIndex].TaskGroupId }>
      { data[rowIndex].TaskGroup } (#{ getAllocationNumberFromName(data[rowIndex].Name) })
    </JobLink>
  </Cell>
);

const ClientLinkCell = ({ rowIndex, data, clients, ...props }) => (
  <Cell { ...props }>
    <ClientLink clientId={ data[rowIndex].NodeID } clients={ clients } short />
  </Cell>
);

const AgeCell = ({ rowIndex, data, ...props }) => (
  <Cell { ...props }>
    <FormatTime identifier={ data[rowIndex].ID } time={ data[rowIndex].CreateTime } />
  </Cell>
);

const StatusCell = ({ rowIndex, data, ...props }) => (
  <Cell { ...props }>
    { data[rowIndex].ClientStatus }
  </Cell>
);

const ActionsCell = ({ rowIndex, data, ...props }) => (
  <Cell { ...props }>
    <AllocationLink allocationId={ data[rowIndex].ID } linkAppend='/files' linkQuery={{ path: '/alloc/logs/' }}>
      <FontIcon className='material-icons'>format_align_left</FontIcon>
    </AllocationLink>
  </Cell>
);

/* eslint-disable react/prop-types */

const jobColumn = (allocations, display) =>
  (display
    ?
      <Column
        header={ <Cell>Job</Cell> }
        cell={ <JobLinkCell data={ allocations } /> }
        flexGrow={ 2 }
        width={ 200 }
      />
    : null
  )

const clientColumn = (allocations, display, clients) =>
  (display
    ?
      <Column
        header={ <Cell>Client</Cell> }
        cell={ <ClientLinkCell data={ allocations } clients={ clients } /> }
        width={ 200 }
      />
    : null
  )

class AllocationList extends PureComponent {

  findNodeNameById (nodeId) {
    if (this.props.nodes.length === 0) {
      return nodeId
    }

    if (nodeId in nodeIdToNameCache) {
      return nodeIdToNameCache[nodeId]
    }

    const r = Object.keys(this.props.nodes).filter(node => this.props.nodes[node].ID === nodeId)

    if (r.length !== 0) {
      nodeIdToNameCache[nodeId] = this.props.nodes[r].Name
    } else {
      nodeIdToNameCache[nodeId] = nodeId
    }

    return nodeIdToNameCache[nodeId]
  }

  filteredAllocations () {
    const query = this.props.location.query || {}
    let allocations = this.props.allocations

    if ('allocation_id' in query) {
      allocations = allocations.filter(allocation => allocation.ID.indexOf(query.allocation_id) != -1)
    }

    if ('allocation_id' in this.state) {
      allocations = allocations.filter(allocation => allocation.ID.indexOf(this.state.allocation_id) != -1)
    }

    if ('status' in query) {
      allocations = allocations.filter(allocation => allocation.ClientStatus === query.status)
    }

    if ('client' in query) {
      allocations = allocations.filter(allocation => allocation.NodeID === query.client)
    }

    if ('job' in query) {
      allocations = allocations.filter(allocation => allocation.JobID === query.job)
    }

    return allocations
  }

  clientStatusFilter () {
    const location = this.props.location
    const query = this.props.location.query || {}

    let title = 'Client Status'
    if ('status' in query) {
      title = <span>{title}: <code>{ query.status }</code></span>
    }

    return (
      <Col key='client-status-filter-pane' xs={ 12 } sm={ 6 } md={ 6 } lg={ 3 }>
        <SelectField floatingLabelText={ title } maxHeight={ 200 }>
          <MenuItem>
            <Link to={{ pathname: location.pathname, query: { ...query, status: undefined } }}>- Any -</Link>
          </MenuItem>
          <MenuItem>
            <Link to={{ pathname: location.pathname, query: { ...query, status: 'running' } }}>Running</Link>
          </MenuItem>
          <MenuItem>
            <Link to={{ pathname: location.pathname, query: { ...query, status: 'complete' } }}>Complete</Link>
          </MenuItem>
          <MenuItem>
            <Link to={{ pathname: location.pathname, query: { ...query, status: 'pending' } }}>Pending</Link>
          </MenuItem>
          <MenuItem>
            <Link to={{ pathname: location.pathname, query: { ...query, status: 'lost' } }}>Lost</Link>
          </MenuItem>
          <MenuItem>
            <Link to={{ pathname: location.pathname, query: { ...query, status: 'failed' } }}>Failed</Link>
          </MenuItem>
        </SelectField>
      </Col>
    )
  }

  allocationIdFilter () {
    return (
      <Col key='allocation-id-filter-pane' xs={ 12 } sm={ 6 } md={ 6 } lg={ 3 }>
        <TextField
          hintText='Allocation ID'
          onChange={ (proxy, value) => { this.setState({ ...this.state, allocation_id: value }) } }
        />
      </Col>
    )
  }

  jobIdFilter () {
    const location = this.props.location
    const query = this.props.location.query || {}

    let title = 'Job'
    if ('job' in query) {
      title = <span>{title}: <code>{ query.job }</code></span>
    }

    const jobs = this.props.allocations
          .map((allocation) => {
            return allocation.JobID
          })
          .filter((v, i, a) => {
            return a.indexOf(v) === i
          })
          .map((job) => {
            return (
              <MenuItem key={ job }>
                <Link to={{ pathname: location.pathname, query: { ...query, job } }}>{ job }</Link>
              </MenuItem>
            )
          })

    jobs.unshift(
      <MenuItem key='any-job'>
        <Link to={{ pathname: location.pathname, query: { ...query, job: undefined } }}>- Any -</Link>
      </MenuItem>
    )

    return (
      <Col key='job-filter-pane' xs={ 12 } sm={ 6 } md={ 6 } lg={ 3 }>
        <SelectField floatingLabelText={ title } maxHeight={ 200 }>{ jobs }</SelectField>
      </Col>
    )
  }

  clientFilter () {
    const location = this.props.location
    const query = this.props.location.query || {}

    let title = 'Client'

    if ('client' in query) {
      title = <span>{title}: <code>{ this.findNodeNameById(query.client) }</code></span>
    }

    const clients = this.props.allocations
          .map((allocation) => {
            return allocation.NodeID
          })
          .filter((v, i, a) => {
            return a.indexOf(v) === i
          })
          .map((client) => {
            return (
              <MenuItem key={ client }>
                <Link to={{ pathname: location.pathname, query: { ...query, client } }}>
                  { this.findNodeNameById(client) }
                </Link>
              </MenuItem>
            )
          })

    clients.unshift(
      <MenuItem key='any-client'>
        <Link to={{ pathname: location.pathname, query: { ...query, client: undefined } }}>- Any -</Link>
      </MenuItem>
    )

    return (
      <Col key='client-filter-pane' xs={ 12 } sm={ 6 } md={ 6 } lg={ 3 }>
        <SelectField floatingLabelText={ title } maxHeight={ 200 }>
          { clients }
        </SelectField>
      </Col>
    )
  }

  updateDimensions() {
    this.setState({
      ...this.state,
      width: window.innerWidth,
      height: window.innerHeight
    });
  }

  componentWillMount() {
    this.updateDimensions();
  }

  componentDidMount() {
    window.addEventListener("resize", () => this.updateDimensions());
  }

  componentWillUnmount() {
    window.removeEventListener("resize", () => this.updateDimensions());
  }

  render () {
    const showJobColumn = this.props.showJobColumn
    const showClientColumn = this.props.showClientColumn
    const allocations = this.filteredAllocations();

    const width = this.state.width - 30
    const height = this.state.height - 250

    return (
      <div>
        <Card>
          <CardHeader title='Filter list' actAsExpander showExpandableButton />
          <CardText expandable>
            <Grid fluid style={{ padding: 0 }}>
              <Row>
                { this.allocationIdFilter() }
                { showClientColumn ? this.clientFilter() : null }
                { this.clientStatusFilter() }
                { showJobColumn ? this.jobIdFilter() : null }
              </Row>
            </Grid>
          </CardText>
        </Card>

        <Card style={{ marginTop: '1rem' }}>
          <CardText>
            <Table
              rowHeight={ 35 }
              headerHeight={ 35 }
              rowsCount={ allocations.length }
              height={ height }
              width={ width }
              { ...this.props }
            >
              <Column
                header={ <Cell /> }
                cell={ <AllocationStatusIconCell data={ allocations } /> }
                width={ 40 }
              />
              <Column
                header={ <Cell>ID</Cell> }
                cell={ <AllocationLinkCell data={ allocations } /> }
                width={ 100 }
              />
              { jobColumn(allocations, this.props.showJobColumn) }
              <Column
                header={ <Cell>Task Group</Cell> }
                cell={ <JobTaskGroupLinkCell data={ allocations } /> }
                flexGrow={ 2 }
                width={ 200 }
              />
              <Column
                header={ <Cell>Status</Cell> }
                cell={ <StatusCell data={ allocations } /> }
                width={ 200 }
              />
              { clientColumn(allocations, this.props.showClientColumn, this.props.nodes) }
              <Column
                header={ <Cell>Age</Cell> }
                cell={ <AgeCell data={ allocations } /> }
                width={ 100 }
              />
              <Column
                header={ <Cell>Actions</Cell> }
                cell={ <ActionsCell data={ allocations } /> }
                width={ 100 }
              />
            </Table>
          </CardText>
        </Card>
      </div>)
  }
}

AllocationList.defaultProps = {
  allocations: [],
  nodes: [],
  location: {},

  showJobColumn: true,
  showClientColumn: true
}

AllocationList.propTypes = {
  allocations: PropTypes.array.isRequired,
  nodes: PropTypes.array.isRequired,
  location: PropTypes.object.isRequired,

  showJobColumn: PropTypes.bool.isRequired,
  showClientColumn: PropTypes.bool.isRequired
}

export default AllocationList
