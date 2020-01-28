import 'date-fns';
import { parse, format, endOfMonth } from 'date-fns';
import React from 'react';
import {
  ComboChart,
  HeaderPredicateFactory,
  AttributeFilter,
  CatalogHelper,
  Model,
  ColumnChart,
  LineChart,
  AttributeElements,
  DateFilter,
  DateFilterHelpers
} from '@gooddata/react-components';
import {factory as SdkFactory} from '@gooddata/gooddata-js';
import { uniqBy, findIndex, replace } from 'lodash';
import Grid from '@material-ui/core/Grid';
import DateFnsUtils from '@date-io/date-fns';
import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker
} from '@material-ui/pickers';
import PropTypes from 'prop-types';
import catalogJson from './catalog.json';

import '@gooddata/react-components/styles/css/main.css';
import "@gooddata/react-components/styles/css/dateFilter.css";

import './App.css';

let projectId = 'ppn8c4je105xsgdv37k59pcvt8lomyhf';
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
  .alias('category')
  .localIdentifier('localIdCategory');
const statusHelper = Model.attribute(C.attributeDisplayForm('Task Status'))
  .alias('status')
  .localIdentifier('localIdStatus');
const dateHelper = Model.attribute(C.dateDataSetDisplayForm('Date (Task Assigned Date)','Month/Year (Task Assigned Date)'));
const dateHelperDay = Model.attribute(C.dateDataSetDisplayForm('Date (Task Assigned Date)','Date (Task Assigned Date)'));
const itemsClosedOnTimeMeasure = Model.measure(C.measure('Count of Action Items Closed On Time'));


// period over period example

// base metric
const actionItemsMeasure = Model.measure(C.measure('Count of Action Items'))
  .localIdentifier('coai')
  .alias('# Action Items');

// same period previous year
const actionItemsMeasurePrevYear = Model.popMeasure('coai', C.dateDataSetAttribute('Date (Task Assigned Date)','Year (Task Assigned Date)'))
  .alias('# Action Items Previous Year');

// previous period
const actionItemsMeasurePrevPeriod = Model.previousPeriodMeasure('coai', [{ dataSet: C.dateDataSet('Date (Task Assigned Date)'), periodsAgo: 1}])
  .alias('# Action Items Previous Period');

// relative date example
// const relativeDate = Model.relativeDateFilter(C.dateDataSet('Date (Task Assigned Date)'), 'GDC.time.year', -2, -1);

sdk.md.getObjectUri(projectId, C.attributeDisplayForm('Task Status')).then((uri) => {
  console.log(uri);
  const objId = uri.split('/')[5];
  sdk.md.getValidElements(projectId,objId).then((obj) => {
    console.log(obj.validElements.items);
  })
});

export class AttributeFilterItem extends React.Component {
    static propTypes = {
        title: PropTypes.string.isRequired,
        uri: PropTypes.string.isRequired
    };

    onChange(uri) {
        // eslint-disable-next-line no-console
        return event => console.log('AttributeFilterItem onChange', uri, event.target.value === 'on');
    }

    render() {
        const { title, uri } = this.props;
        return (
            <label className="gd-list-item s-attribute-filter-list-item" style={{ display: 'inline-flex' }}>
                <input type="checkbox" className="gd-input-checkbox" onChange={this.onChange(uri)} />
                <span>{title}</span>
            </label>
        );
    }
}

export class AttributeElementsExample extends React.Component {
    render() {
        return (
            <div style={{ minHeight: 300 }}>
                <AttributeElements identifier={C.attributeDisplayForm('Task Status')} projectId={projectId} options={{ limit: 20 }}>
                    {({ validElements, loadMore, isLoading, error }) => {
                        const {
                            offset = null,
                            count = null,
                            total = null
                        } = validElements ? validElements.paging : {};
                        if (error) {
                            return <div>{error}</div>;
                        }
                        return (
                            <div>
                                <button
                                    className="button button-secondary s-show-more-filters-button"
                                    onClick={loadMore}
                                    disabled={isLoading || (offset + count === total)}
                                >More
                                </button>
                                <h2>validElements</h2>
                                <pre>
                                    isLoading: {isLoading.toString()}<br />
                                    offset: {offset}<br />
                                    count: {count}<br />
                                    total: {total}<br />
                                    nextOffset: {offset + count}
                                </pre>
                                <div>
                                    {validElements ? validElements.items.map(item => (
                                        <AttributeFilterItem
                                            key={item.element.uri}
                                            uri={item.element.uri}
                                            title={item.element.title}
                                        />
                                    )) : null}
                                </div>
                            </div>
                        );
                    }}
                </AttributeElements>
            </div>
        );
    }
}

let dateFrom = new Date();
dateFrom.setMonth(dateFrom.getMonth() - 1);

const dateFilterOptions = {
    allTime: {
        localIdentifier: "d1f74327-022c-44bb-a98e-b38a6178b7f9",
        type: "allTime",
        name: "All time",
        visible: true,
    },
    absoluteForm: {
        localIdentifier: "90bad814-a193-429f-b88c-118cd00f2168",
        type: "absoluteForm",
        from: dateFrom.toISOString().substr(0, 10), // 'YYYY-MM-DD'
        to: new Date().toISOString().substr(0, 10), // 'YYYY-MM-DD'
        name: "Static period",
        visible: true,
    },
    relativeForm: {
        localIdentifier: "1389c988-6159-4f08-bdbd-b4cc02d2689d",
        type: "relativeForm",
        granularity: "GDC.time.month",
        name: "Floating range",
        visible: true,
        availableGranularities: ["GDC.time.date", "GDC.time.month", "GDC.time.quarter", "GDC.time.year"],
        from: 0,
        to: -1,
    },
    absolutePreset: [
        {
            from: "2019-12-01",
            to: "2019-12-31",
            name: "December 2019",
            localIdentifier: "4cd37951-9559-4eff-8750-7b7829b5a3ce",
            visible: true,
            type: "absolutePreset",
        },
        {
            from: "2018-01-01",
            to: "2018-12-31",
            name: "Year 2018",
            localIdentifier: "d12f83c4-f4e4-485a-8fa5-ec2fc0c889fb",
            visible: true,
            type: "absolutePreset",
        },
    ],
    relativePreset: {
        "GDC.time.date": [
            {
                from: -6,
                to: 0,
                granularity: "GDC.time.date",
                localIdentifier: "fae8aca1-6bcf-456e-8547-e10656859f4d",
                type: "relativePreset",
                visible: true,
                name: "Last 7 days",
            },
            {
                from: -29,
                to: 0,
                granularity: "GDC.time.date",
                localIdentifier: "29bd0e2d-51b0-42f7-9355-70aa610ac06c",
                type: "relativePreset",
                visible: true,
                name: "Last 30 days",
            },
            {
                from: -89,
                to: 0,
                granularity: "GDC.time.date",
                localIdentifier: "9370c647-8cbe-4850-82c2-0783513e4fe3",
                type: "relativePreset",
                visible: true,
                name: "Last 90 days",
            },
        ],
        "GDC.time.month": [
            {
                from: 0,
                to: 0,
                granularity: "GDC.time.month",
                localIdentifier: "ec54d656-bbea-4559-b6b2-9de80951eb20",
                type: "relativePreset",
                visible: true,
                name: "This month",
            },
            {
                from: -1,
                to: -1,
                granularity: "GDC.time.month",
                localIdentifier: "0787513c-ec02-439f-9781-7da80db91a27",
                type: "relativePreset",
                visible: true,
                name: "Last month",
            },
            {
                from: -11,
                to: 0,
                granularity: "GDC.time.month",
                localIdentifier: "b2790ff0-48ba-402f-a3b3-6722e325042b",
                type: "relativePreset",
                visible: true,
                name: "Last 12 months",
            },
        ],
        "GDC.time.quarter": [
            {
                from: 0,
                to: 0,
                granularity: "GDC.time.quarter",
                localIdentifier: "cdf546a5-4394-4583-9a7d-ab35e880f54b",
                type: "relativePreset",
                visible: true,
                name: "This quarter",
            },
            {
                from: -1,
                to: -1,
                granularity: "GDC.time.quarter",
                localIdentifier: "bb5364ba-0c0e-44d9-8cfc-f8ee995dcb53",
                type: "relativePreset",
                visible: true,
                name: "Last quarter",
            },
            {
                from: -3,
                to: 0,
                granularity: "GDC.time.quarter",
                localIdentifier: "9b838d14-c88d-4652-bf79-08b895688cd8",
                type: "relativePreset",
                visible: true,
                name: "Last 4 quarters",
            },
        ],
        "GDC.time.year": [
            {
                from: 0,
                to: 0,
                granularity: "GDC.time.year",
                localIdentifier: "d5e444df-67f6-4034-8b80-0bb0f6c6a210",
                type: "relativePreset",
                visible: true,
                name: "This year",
            },
            {
                from: -1,
                to: -1,
                granularity: "GDC.time.year",
                localIdentifier: "eecbe244-8560-466d-876c-4d3cc96ea61a",
                type: "relativePreset",
                visible: true,
                name: "Last year",
            }
        ]
    }
};

class App extends React.Component {
    constructor(props) {
    super(props);

    this.state = {
      filter: [],
      fromDate: '2019/01/01',
      toDate: '2019/03/31',
      metricList: [actionItemsMeasure],
      popMetricList: [actionItemsMeasure],
      drilled: false,
      drillFilter: []
    };

    this.onApply = this.onApply.bind(this);
    this.onApply2 = this.onApply2.bind(this);
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
    // Drill to day chart for specific month
    console.log(arg);

    
    const month = arg.drillContext.intersection[1].title;
    const fromDate = parse(month,'MMM yyyy', new Date());
    const toDate = endOfMonth(fromDate);

    const dateFilter = [
      Model.absoluteDateFilter(C.dateDataSet('Date (Task Assigned Date)'),
          format(fromDate, 'yyyy-MM-dd'),
          format(toDate, 'yyyy-MM-dd')
        )
    ];
    this.setState({drilled: true, drillFilter: dateFilter});
    
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

  onApply2(value) {
    console.log(value);
  }

  render() {
    const { filter, fromDate, toDate, metricList, popMetricList, drilled, drillFilter } = this.state;

    const CustomError = ({
        code,
        message,
        description,
        icon
    }) => (
        <div>
            {message}
        </div>
    );

    return (
       <div className="App">
          <div style={{ width: 200 }}>
            <DateFilter
                excludeCurrentPeriod={false}
                selectedFilterOption={dateFilterOptions.allTime}
                filterOptions={dateFilterOptions}
                // availableGranularities={["GDC.time.month","GDC.time.year","GDC.time.quarter","GDC.time.date"]}
                availableGranularities={["GDC.time.date"]}
                customFilterName="GD Date Filter"
                dateFilterMode="active"
                onApply={this.onApply2}
            />
          </div>
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
                //colorMapping: ['#4287f5','#45ed77','#eda145','#ed4577'],
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
              //sortBy={[
              //  Model.measureSortItem('coai', 'asc')
              //    .attributeLocators({
              //      attributeIdentifier: 'localIdStatus', element: '/gdc/md/i6q0z85ef4hj57n9tms73bwe3zpgognw/obj/2487/elements?id=10099'
              //    })
              //]}
              //sortBy={[Model.measureSortItem('coai', 'asc')]}
              config={{
                colors: ['#4287f5','#45ed77','#eda145','#ed4577'],
                legend: {
                  enabled: true
                },
                xaxis: {
                  visible: true
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
              //sortBy={[Model.attributeSortItem('localIdCategory', 'asc')]}
              sortBy={[Model.measureSortItem('coai', 'asc')]}
              drillableItems={[
                HeaderPredicateFactory.identifierMatch(C.measure('Count of Action Items'))
              ]}
              onFiredDrillEvent={this.handleDrill}
            />
          </div>
          <div style={{ height: 300 }}>
            <LineChart
              projectId={projectId}
              measures={['actionItemsMeasure']}
              trendBy={dateHelper}
              filters={filter}
              config={{
                colors: ['#14b2e2']
              }}
              drillableItems={[
                HeaderPredicateFactory.identifierMatch(C.measure('Count of Action Items'))  
              ]}
              onFiredDrillEvent={this.handleDrill}
              ErrorComponent={CustomError}
              onError={(e) => {
                console.log('onError', JSON.stringify(e));
              }}
            />
          </div>
          {
            drilled &&
            <div style={{ height: 300 }}>
              <LineChart
                projectId={projectId}
                measures={[actionItemsMeasure]}
                trendBy={dateHelperDay}
                filters={drillFilter}
                config={{
                  colors: ['#14b2e2']
                }}
              />
            </div>
          }
       </div>
    );
  }
}

export default App;
