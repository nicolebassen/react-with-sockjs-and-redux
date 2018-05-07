import React, { Component } from 'react';
import { NavLink, Route, Switch, withRouter, Redirect} from 'react-router-dom';
import { connect } from 'react-redux';

import './preheat.css';
import backBtn from '../../assets/images/back-icon.svg';
import NavBar from '../../components/nav-bar/nav-bar';

import SelectTemp from './steps/step-1/step-1';
import Preheating from './steps/step-2/step-2';
import Finish from './steps/step-3/step-3';
import Modal from '../../components/modal/modal';
import Backdrop from '../../components/backdrop/backdrop';

import tempBothExtruder from '../../services/api/temp-both-extruder';

class Preheat extends Component {

  state = {
    removeBackBtn: false,
    ext1Temp: 240,
    ext2Temp: 240,
    bedTemp: 70,
    modalOpen: false,
    minExtTemp: 0,
    maxExtTemp: 280,
    minBedTemp: 0,
    maxBedTemp: 140
  }

  onPreheatSuccess = () => {
    /** 
     * When preheat successfully starts, updating the HeatingUp as true.
     * And once the HeatingStatus is updated to 'true', it will automatically
     * redirect the route to the 'step-2' as per the logic written in the <Route />
     * for step-1.
    */
    this.props.onUpdatingHeatingStatus(true);
  }

  onPreheatCancel = () => {
    this.setState({
      ...this.state,
      modalOpen: true
    });
  }

  onPreheatCancelled = () => {
    this.setState({
      ...this.state,
      modalOpen: false
    });
    this.props.onUpdatingHeatingStatus(false);
    this.props.history.push(`${this.props.match.url}`);
  }

  /* Handling input change for the temperatures for preheating */
  onExtruder1TempChange = (value) => {
    this.setState({
      ...this.state,
      ext1Temp: Math.min(Math.max(parseInt(value), this.state.minExtTemp),this.state.maxExtTemp)
    });
  }
  onExtruder2TempChange = (value) => {
    this.setState({
      ...this.state,
      ext2Temp: Math.min(Math.max(parseInt(value), this.state.minExtTemp), this.state.maxExtTemp)
    });
  }
  onBedTempChange = (value) => {
    this.setState({
      ...this.state,
      bedTemp: Math.min(Math.max(parseInt(value), this.state.minBedTemp), this.state.maxBedTemp)
    });
  }

  /* Starting Preheat */
  onStartPreheat = () => {
    console.log('onStartPreheat is called');
    const ext1Temp = this.state.ext1Temp;
    const ext2Temp = this.state.ext2Temp;
    const bedTemp = this.state.bedTemp;

    tempBothExtruder({tool0: ext1Temp, tool1: ext2Temp }, bedTemp, this.onPreheatSuccess);
  }

  onCompletePreheat = () => {
    console.log('Preheat completed....');
    /* When preheat completes, updating the HeatingUp as false */
    this.props.onUpdatingHeatingStatus(false);
    /* Removing the Back Button from the Navigation */
    this.setState({
      removeBackBtn: true
    });
    /* Closing the preheat cancel modal if it is open */
    if (this.state.modalOpen) {
      this.setState({
        ...this.state,
        modalOpen: false
      });
    }
    /* Navigating to the Step-3 */
    this.props.history.push(`${this.props.match.url}/step-3`);
  }

  onFinish = () => {
    /* When Preheating completes, redirecting to the Home page again */
    this.props.history.push('/');
  }

  onCancelPreheat = () => {
    tempBothExtruder({ tool0: 0, tool1: 0 }, 0, this.onPreheatCancelled);
  }

  onBackDropClicked = () => {
    this.setState({
      ...this.state,
      modalOpen: false
    });
  }

  render() {
    const match = this.props.match;
    const navHeadingStyle = {paddingLeft: "32px"};
    const alert = (
      <Backdrop clicked={this.onBackDropClicked} modalOpen={this.state.modalOpen}>
        <Modal
          modalOpen={this.state.modalOpen}
          content={'Cancel Preheating'}
          question={'Are you sure to cancel preheating?'}
          actions={{
            leftBtn: {
              name: 'No',
              classValue: '',
            },
            rightBtn: {
              name: ('Yes'),
              classValue: 'btn--danger'
            }
          }}
          rightBtnClick={this.onCancelPreheat}
          leftBtnClick={this.onBackDropClicked}
        />
      </Backdrop>
    );
    return (
      <div className="preheat-container">
        {alert}
        <NavBar>
          <NavLink exact to="/">
            {!this.state.removeBackBtn ? <img src={backBtn} alt="Back" width="56" height="56" /> : null}
          </NavLink>
          <h1 className="nav-heading" style={this.state.removeBackBtn ? navHeadingStyle : null}>Preheat</h1>
        </NavBar>
        <Switch>
          <Route path={`${match.path}/step-2`} exact render={(props) => 
            <Preheating
              temps={this.props.socketData.temps}
              targets={{tool0: this.state.ext1Temp, tool1: this.state.ext2Temp, bed: this.state.bedTemp}}
              basePath={match.path}
              onCompletePreheat={this.onCompletePreheat}
              onPreheatCancel={this.onPreheatCancel}
              {...props}
            />}
          />
          <Route path={`${match.path}/step-3`} exact render={(props) => {
            return (
              <Finish basePath={match.path} heatingUp={this.props.socketData.heatingUp} onFinish={this.onFinish} {...props} />
            );
          }}
          />
          <Route path={match.path} exact render={(props) => {
            return (
              this.props.socketData.heatingUp ? 
              <Redirect to={`${match.path}/step-2`} /> :
              <SelectTemp
                basePath={match.path}
                startPreheat={this.onStartPreheat}
                onExtruder1TempChange={this.onExtruder1TempChange}
                onExtruder2TempChange={this.onExtruder2TempChange}
                onBedTempChange={this.onBedTempChange}
                {...props}
              />
            )}
          }
          />
        </Switch>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    socketData: state.socketData.socketData
  }
};

const mapDispatchToProps = (dispatch) => {
  return {
    onUpdatingHeatingStatus: (status) => {
      dispatch({
        type: 'UPDATE_HEATING_STATUS',
        value: status
      })
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Preheat);