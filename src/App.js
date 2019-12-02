import 'date-fns';
import React from 'react';
import {
  ComboChart,
  HeaderPredicateFactory,
  AttributeFilter,
  CatalogHelper,
  Model,
  ColumnChart,
  LineChart
} from '@gooddata/react-components';
import {factory as SdkFactory} from '@gooddata/gooddata-js';
import { uniqBy, findIndex, replace } from 'lodash';
import Grid from '@material-ui/core/Grid';
import DateFnsUtils from '@date-io/date-fns';
import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker
} from '@material-ui/pickers';
import catalogJson from './catalog.json';

import '@gooddata/react-components/styles/css/main.css';

import './App.css';

let projectId = 'i6q0z85ef4hj57n9tms73bwe3zpgognw';
const sdk = SdkFactory();

// sdk.user.logout();

/*
sdk.md.getObjectUri(projectId, vID).then((uri) => {
  console.log(uri);
  sdk.md.getObjectDetails(uri).then((obj) => {
    console.log(obj);
  })
});

// get project ID programatically
sdk.user.getAccountInfo().then((accountInfo) => {
  console.log(accountInfo);
  const { profileUri } = accountInfo;
  sdk.project.getProjects(profileUri.split('/')[4]).then((projects) => {
    console.log(projects[0].links.self.split("/gdc/projects/")[1]);
    projectId = projects[0].links.self.split("/gdc/projects/")[1];
  })
});

// need to add true here for textFilter option
const statusFilterHelper = Model.positiveAttributeFilter(C.attributeDisplayForm('Task Category'), ['MOC'], true);
const statusFilterHelper2 = Model.positiveAttributeFilter(C.attributeDisplayForm('Task Category'), ['Risk'], true);
const dateHelper = Model.attribute(C.dateDataSetDisplayForm('Date (Task Assigned Date)','Month/Year (Task Assigned Date)'));
const filterHelper = Model.absoluteDateFilter(C.dateDataSet('Date (Snapshot Date)'),'2017-05-01','2017-07-31');
*/

// using the catalog / model helper
// https://sdk.gooddata.com/gooddata-ui/docs/gdc_catalog_export.html
// https://sdk.gooddata.com/gooddata-ui/docs/model_helpers.html

const C = new CatalogHelper(catalogJson);


const categoryHelper = Model.attribute(C.attributeDisplayForm('Task Category'))
  .alias('category');
const statusHelper = Model.attribute(C.attributeDisplayForm('Task Status'))
  .alias('status');
const dateHelper = Model.attribute(C.dateDataSetDisplayForm('Date (Task Assigned Date)','Month/Year (Task Assigned Date)'));
const itemsClosedOnTimeMeasure = Model.measure(C.measure('Count of Action Items Closed On Time'));


// period over period example

// base metric
const actionItemsMeasure = Model.measure(C.measure('Count of Action Items'))
  .localIdentifier('coaa')
  .alias('# Action Items');
// same period previous year
const actionItemsMeasurePrevYear = Model.popMeasure('coaa', C.dateDataSetAttribute('Date (Task Assigned Date)','Year (Task Assigned Date)'))
  .alias('# Action Items Previous Year');
// previous period
const actionItemsMeasurePrevPeriod = Model.previousPeriodMeasure('coaa', [{ dataSet: C.dateDataSet('Date (Task Assigned Date)'), periodsAgo: 1}])
  .alias('# Action Items Previous Period');

class App extends React.Component {
    constructor(props) {
    super(props);

    this.state = {
      filter: [],
      fromDate: '2018/01/01',
      toDate: '2018/12/31',
      metricList: [actionItemsMeasure],
      popMetricList: [actionItemsMeasure]
    };

    this.onApply = this.onApply.bind(this);
    this.handleDrill = this.handleDrill.bind(this);
    this.onExportReady = this.onExportReady.bind(this);
    this.doExport = this.doExport.bind(this);
    this.onMetricChange = this.onMetricChange.bind(this);
  }

  onExportReady(exportResult) {
    this.exportResult = exportResult;
  }

  async doExport() {
    try {
      const result = await this.exportResult({
        format: 'xlsx',
        includeFilterContext: true,
        mergeHeaders: true,
        title: 'CustomTitle'
      });
      console.log('Export successfully: ', result.uri);
    } catch (error) {
      console.log('Export error: ', error);
    }
  }

  handleDrill(arg) {
    console.log(arg);
  }

  onApply(filter) {
    const filterList = this.state.filter;
    if (filter.in) {
      filterList.unshift(Model.positiveAttributeFilter(filter.id, filter.in, true));
    } else if (filter.notIn) {
      filterList.unshift(Model.negativeAttributeFilter(filter.id, filter.notIn, true));
    } else {
      filterList.unshift(
        Model.absoluteDateFilter(C.dateDataSet('Date (Task Assigned Date)'),
          replace(this.state.fromDate, RegExp('/','g'), '-'),
          replace(this.state.toDate, RegExp('/','g'), '-')
          )
        );
    }
    console.log(filterList);
    const newFilter = uniqBy(filterList, function(f) {
      console.log(f);
      let key = '';
      if (f.positiveAttributeFilter) {
        key = f.positiveAttributeFilter.displayForm.identifier;
      } else if (f.negativeAttributeFilter) {
        key = f.negativeAttributeFilter.displayForm.identifier;
      } else {
        key = 'date'
      }
      return key
    });
    console.log(newFilter);
    this.setState({filter: newFilter});
  }

  onMetricChange(value) {
    console.log(value);
    const metricList = this.state.metricList;
    const mID = C.measure(value)

    const i = findIndex(metricList, function(m) {
      return m.measure.definition.measureDefinition.item.identifier === mID;
    });

    let newMetricList = [];

    if (i === -1) {
      newMetricList = [Model.measure(mID), ...metricList];
    } else {
      newMetricList = metricList.filter((item, j) => i !== j);
    }
    this.setState({metricList: newMetricList});
  }

  render() {
    const { filter, fromDate, toDate, metricList, popMetricList } = this.state;

    return (
       <div className="App">
          <div>
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
              <Grid container justify="space-around">
                <KeyboardDatePicker
                  format="yyyy/MM/dd"
                  margin="normal"
                  id="from-date-picker"
                  label="From Date"
                  value={fromDate}
                  onChange={(x,y) => {this.setState({fromDate: y})}}
                  KeyboardButtonProps={{
                    'aria-label': 'change date',
                  }}
                />
                <KeyboardDatePicker
                  format="yyyy/MM/dd"
                  margin="normal"
                  id="to-date-picker"
                  label="To Date"
                  value={toDate}
                  onChange={(x,y) => {this.setState({toDate: y})}}
                  KeyboardButtonProps={{
                    'aria-label': 'change date',
                  }}
                />
              </Grid>
            </MuiPickersUtilsProvider>
          </div>
          <button className="button button-secondary" onClick={this.onApply}>Apply Date Filter</button>
          <div>
            <AttributeFilter
              projectId={projectId}
              filter={Model.negativeAttributeFilter(C.attributeDisplayForm('Task Category'), [], true)}
              onApply={this.onApply}
            />
            <AttributeFilter
              projectId={projectId}
              filter={Model.negativeAttributeFilter(C.attributeDisplayForm('Task Status'), [], true)}
              onApply={this.onApply}
            />
          </div>
          <div className="multiswitch">
            <input
              type="checkbox"
              id="metric1"
              name="metric"
              value="Count of Action Items"
              onChange={(e) => this.onMetricChange(e.target.value)}
              defaultChecked
            />
            <label htmlFor="metric1">Count of Action Items</label>
            <input
              type="checkbox"
              id="metric2"
              name="metric"
              value="Count of Action Items Closed On Time"
              onChange={(e) => this.onMetricChange(e.target.value)}
            />
            <label htmlFor="metric2">Count of Action Items Closed On Time</label>
          </div>
          <br />
          <br />
          <div>Period over Period Selection</div>
          <div className="radioswitch">
            <input
              type="radio"
              id="pop0"
              name="pop"
              value="None"
              onChange={(e) => this.setState({popMetricList: [actionItemsMeasure]})}
              defaultChecked
            />
            <label htmlFor="metric1">None</label>
            <input
              type="radio"
              id="pop1"
              name="pop"
              value="Same Period Previous Year"
              onChange={(e) => this.setState({popMetricList: [actionItemsMeasurePrevYear,actionItemsMeasure]})}
            />
            <label htmlFor="metric1">Same Period Previous Year</label>
            <input
              type="radio"
              id="pop2"
              name="pop"
              value="Previous Period"
              onChange={(e) => this.setState({popMetricList: [actionItemsMeasurePrevPeriod,actionItemsMeasure]})}
            />
            <label htmlFor="metric2">Previous Period</label>
          </div>
          <div style={{ height: 300 }}>
            <ColumnChart
              projectId={projectId}
              measures={popMetricList}
              viewBy={dateHelper}
              filters={filter}
              config={{
                legend: {
                  enabled: true
                },
                dataLabels: {
                  visible: true
                }
              }}
            />
          </div>
          <div style={{ height: 300 }}>
            <ColumnChart
              projectId={projectId}
              measures={metricList}
              filters={filter}
              config={{
                legend: {
                  enabled: true
                }
              }}
            />
          </div>
          <div style={{ height: 300 }}>
            <ColumnChart
              projectId={projectId}
              measures={[actionItemsMeasure]}
              viewBy={categoryHelper}
              stackBy={statusHelper}
              filters={filter}
              config={{
                colors: ['#4287f5','#45ed77','#eda145','#ed4577'],
                legend: {
                  enabled: true
                },
                xaxis: {
                  visible: false
                },
                yaxis: {
                  visible: false
                },
                grid: {
                  enabled: false
                }
              }}
              drillableItems={[
                HeaderPredicateFactory.identifierMatch(C.measure('Count of Action Items'))  
              ]}
              onFiredDrillEvent={this.handleDrill}
              onExportReady={this.onExportReady}
            />
          </div>
          <button className="button button-secondary" onClick={this.doExport}>Export</button>
          <div style={{ height: 300 }}>
            <ComboChart
              projectId={projectId}
              primaryMeasures={[actionItemsMeasure]}
              secondaryMeasures={[itemsClosedOnTimeMeasure]}
              viewBy={categoryHelper}
              filters={filter}
            />
          </div>
          <div style={{ height: 300 }}>
            <LineChart
              projectId={projectId}
              measures={[actionItemsMeasure]}
              trendBy={dateHelper}
              filters={filter}
              config={{
                colors: ['#14b2e2']
              }}
              drillableItems={[
                HeaderPredicateFactory.identifierMatch(C.measure('Count of Action Items'))  
              ]}
              onFiredDrillEvent={this.handleDrill}
            />
          </div>
       </div>
    );
  }
}

export default App;
