import React from 'react';

import { ComboChart, HeaderPredicateFactory, AttributeFilter, CatalogHelper, Model, ColumnChart, LineChart, Visualization } from '@gooddata/react-components';
import catalogJson from './catalog.json';

import '@gooddata/react-components/styles/css/main.css';

import './App.css';

const projectId = 'i6q0z85ef4hj57n9tms73bwe3zpgognw';
const filterURL = `/gdc/md/${projectId}/obj/2491/elements?id=`;

// using the catalog / model helper
// https://sdk.gooddata.com/gooddata-ui/docs/gdc_catalog_export.html
// https://sdk.gooddata.com/gooddata-ui/docs/model_helpers.html

const C = new CatalogHelper(catalogJson);

const measureHelper = Model.measure(C.measure('Count of Action Items'));
const measureHelper2 = Model.measure(C.measure('Count of Action Items Closed On Time'));

//const measureHelper2 = Model.measure(C.measure('Labour Hours'));

const dateHelper = Model.attribute(C.dateDataSetDisplayForm('Date (Snapshot Date)','Day of Month (Snapshot Date)'));

const dateHelper2 = Model.attribute(C.dateDataSetDisplayForm('Date (Snapshot Date)','Quarter (Snapshot Date)'));

const categoryHelper = Model.attribute(C.attributeDisplayForm('Task Category'))
  .alias('category');

const statusHelper = Model.attribute(C.attributeDisplayForm('Task Status'))
  .alias('status');

const filterHelper = Model.absoluteDateFilter(C.dateDataSet('Date (Task Due Date)'),'2017-05-01','2017-07-31');

// need to add true here for textFilter option
const statusFilterHelper = Model.positiveAttributeFilter(C.attributeDisplayForm('Task Category'), ['MOC'], true);
const statusFilterHelper2 = Model.positiveAttributeFilter(C.attributeDisplayForm('Task Category'), ['Risk'], true);

console.log(C.measure('Count of Action Items'));
// using raw json objects

// metric created on the GD platform
const measures = [
    {
        measure: {
            localIdentifier: 'm1',
            definition: {
                measureDefinition: {
                    item: {
                        identifier: 'ab0qYwrFcN8P'
                    }
                }
            },
            format: '#,##0'
        }
    }
];

const measures2 = [
    {
        measure: {
            localIdentifier: 'm1',
            definition: {
                measureDefinition: {
                    item: {
                        identifier: 'fact.locationfact.labourhours'
                    },
                    aggregation: 'sum'
                }
            },
            format: '#,##0'
        }
    }
];

// attribute in dimension - LDM
const attribute = {
    visualizationAttribute: {
        displayForm: {
            identifier: 'snapshotdate.aag81lMifn6q'
        },
        localIdentifier: 'month'
    }
};

// date filter
const dateFilter = [
  {
    absoluteDateFilter: {
          dataSet: {
              identifier: 'snapshotdate.dataset.dt'
          },
          from: '2013-01-01',
          to: '2014-12-31'
      }
  }
];

// attribute filter
const filter2 = [
  {
    positiveAttributeFilter: {
        displayForm: {
            identifier: 'label.taskfact.taskstatus'
        },
        in: ['Open'],
        textFilter: true
    }
  }
];

class App extends React.Component {
    constructor(props) {
    super(props);

    this.state = {
      filter: []
    };

    this.onApply2 = this.onApply2.bind(this);
    this.handleDrill = this.handleDrill.bind(this);
    this.onExportReady = this.onExportReady.bind(this);
    this.doExport = this.doExport.bind(this);
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

  onApply2(filter) {
    console.log('onApply', filter);
    const filterObj = [];
    if (filter.in) {
      filterObj.push(Model.positiveAttributeFilter(filter.id, filter.in, true));
    } else {
      filterObj.push(Model.negativeAttributeFilter(filter.id, filter.notIn, true));
    }
    this.setState({filter: filterObj});
  }

  render() {
    const { filter } = this.state;

    return (
       <div className="App">
          <div>
             <h2>Welcome to React</h2>
          </div>
          <div>
            <AttributeFilter
              projectId={projectId}
              //identifier={C.attributeDisplayForm('Task Category')}
              filter={Model.negativeAttributeFilter(C.attributeDisplayForm('Task Category'), [], true)}
              onApply={this.onApply2}
            />
          </div>
          <div style={{ height: 300 }}>
            <ColumnChart
              projectId={projectId}
              measures={[measureHelper]}
              viewBy={categoryHelper}
              stackBy={statusHelper}
              filters={filter}
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
              primaryMeasures={[measureHelper]}
              secondaryMeasures={[measureHelper2]}
              viewBy={categoryHelper}
              filters={filter}
            />
          </div>
          <div style={{ height: 300 }}>
            <LineChart
              projectId={projectId}
              measures={[measureHelper]}
              trendBy={categoryHelper}
              //filters={[statusFilterHelper]}
              config={{
                colors: ['#14b2e2']
              }}
              drillableItems={[
                HeaderPredicateFactory.identifierMatch(C.measure('Count of Action Items'))  
              ]}
              onFiredDrillEvent={this.handleDrill}
            />
          </div>
          <p className="App-intro">
             To get started, edit <code>src/App.js</code> and save to reload.
          </p>
       </div>
    );
  }
}

export default App;
