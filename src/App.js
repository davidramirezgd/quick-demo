import React from 'react';

import { HeaderPredicateFactory, AttributeFilter, CatalogHelper, Model, ColumnChart, LineChart, Visualization } from '@gooddata/react-components';
import catalogJson from './catalog.json';

import '@gooddata/react-components/styles/css/main.css';

import './App.css';

const projectId = 'i6q0z85ef4hj57n9tms73bwe3zpgognw';
const filterURL = `/gdc/md/${projectId}/obj/2491/elements?id=`;

// using the catalog / model helper
// https://sdk.gooddata.com/gooddata-ui/docs/gdc_catalog_export.html
// https://sdk.gooddata.com/gooddata-ui/docs/model_helpers.html

const C = new CatalogHelper(catalogJson);

const measureHelper = Model.measure(C.measure('Count of Action Items'))
  .format('#,##0')
  .alias('change me');

const dateHelper = Model.attribute(C.dateDataSetDisplayForm('Date (Task Due Date)','Month/Year (Task Due Date)'))
  .alias('due date');

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

// attribute in dimension - LDM
const attribute = {
    visualizationAttribute: {
        displayForm: {
            identifier: 'taskduedate.act81lMifn6q'
        },
        localIdentifier: 'month'
    }
};

// date filter
const filter = [
  {
    absoluteDateFilter: {
          dataSet: {
              identifier: 'taskduedate.dataset.dt'
          },
          from: '2017-05-01',
          to: '2017-07-31'
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

    this.onApply = this.onApply.bind(this);
    this.handleDrill = this.handleDrill.bind(this);
  }

  handleDrill(arg) {
    console.log(arg);
  }

  // The AttributeFilter component is old and sends filter values
  // as URIs so we need to construct the URI for the filter
  // then pass the element ID
  // Would be nice if it would just return the text value
  // so we could use textFilter option
  onApply(filter) {
    console.log('AttributeFilterExample onApply', filter);
    let filterObj = [];
    if (filter.in) {
      const values = filter.in.map((value) => `${filterURL}${value}`);
      filterObj.push(Model.positiveAttributeFilter(filter.id, values));
    } else {
      const values = filter.notIn.map((value) => `${filterURL}${value}`);
      filterObj.push(Model.negativeAttributeFilter(filter.id, values));
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
              identifier={C.attributeDisplayForm('Task Category')}
              onApply={this.onApply}
            />
          </div>
          <div style={{ height: 300 }}>
            <LineChart
              projectId={projectId}
              measures={measures}
              trendBy={attribute}
              config={{
                colors: ['#14b2e2']
              }}
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
          <div style={{ height: 300 }}>
            <ColumnChart
              projectId={projectId}
              measures={[measureHelper]}
              viewBy={categoryHelper}
              stackBy={statusHelper}
              filters={filter}
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
