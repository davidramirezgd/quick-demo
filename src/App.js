import React from 'react';
import {
  AttributeFilter,
  CatalogHelper,
  Model,
  ColumnChart,
  LineChart,
  Visualization
} from '@gooddata/react-components';
import { uniqBy, replace } from 'lodash';
import catalogJson from './catalog.json';

import '@gooddata/react-components/styles/css/main.css';

import './App.css';

let projectId = 'ppn8c4je105xsgdv37k59pcvt8lomyhf';

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


class App extends React.Component {
    constructor(props) {
    super(props);

    this.state = {
      filter: []
    };

    this.onApply = this.onApply.bind(this);
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

  render() {
    const { filter } = this.state;

    return (
       <div className="App">
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
          <div style={{ height: 300 }}>
            <Visualization
              projectId={projectId}
              identifier="axnTQCpIcmOj"
              filters={filter}
            />
          </div>
          <div style={{ height: 300 }}>
            <ColumnChart
              projectId={projectId}
              measures={[actionItemsMeasure]}
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
            <LineChart
              projectId={projectId}
              measures={[actionItemsMeasure]}
              trendBy={dateHelper}
              filters={filter}
              config={{
                colors: ['#14b2e2']
              }}
            />
          </div>
       </div>
    );
  }
}

export default App;
