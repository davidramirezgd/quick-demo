import React from 'react';
import {
  AttributeFilter,
  CatalogHelper,
  Model,
  ColumnChart,
  LineChart,
  Visualization,
  Execute,
  isEmptyResult
} from '@gooddata/react-components';
import { uniqBy, replace } from 'lodash';
import catalogJson from './catalog.json';

import '@gooddata/react-components/styles/css/main.css';

import './App.css';

let projectId = 'ppn8c4je105xsgdv37k59pcvt8lomyhf';

const C = new CatalogHelper(catalogJson);


const categoryHelper = Model.attribute(C.attributeDisplayForm('Task Category'));

const actionItemsMeasure = Model.measure(C.measure('Count of Action Items'));


class App extends React.Component {
    constructor(props) {
    super(props);

    this.state = {
      filter: []
    };

    this.onApply = this.onApply.bind(this);
  }

  onApply(filter) {
    const filterList = [...this.state.filter];
    debugger;
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
    this.setState({filter: newFilter});
  }

  render() {
    const { filter } = this.state;

    const afm = {
      measures: [
        {
          localIdentifier: "5d80620cff9b485a8e533a34ed995a32",
          definition: {
            measure: {
              item: {
                uri: "/gdc/md/ppn8c4je105xsgdv37k59pcvt8lomyhf/obj/2532"
              }
            }
          },
          alias: "Count of Action Items"
        },
        {
          localIdentifier: "2c3617dfb96d4f16a0123c9392c1bc2e",
          definition: {
            measure: {
              item: {
                uri: "/gdc/md/ppn8c4je105xsgdv37k59pcvt8lomyhf/obj/2568"
              }
            }
          },
          alias: "Count of Action Items Closed On Time"
        }
      ],
      attributes: [
        {
          displayForm: {
            uri: "/gdc/md/ppn8c4je105xsgdv37k59pcvt8lomyhf/obj/2492"
          },
          localIdentifier: "159a8c436ad441c2a62bcc22a8618680"
        }
      ],
      filters: filter
    };

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
          <div>
            <Execute
              afm={afm}
              projectId={projectId}
            >
              {
                (execution) => {
                  const { isLoading, error, result } = execution;
                  if (isLoading) {
                      return (<div>Loading data...</div>);
                  } else if (error) {
                      return (<div>There was an error</div>);
                  }

                  return isEmptyResult(result) ? (<div>Empty result</div>) : (<div>{JSON.stringify(result.executionResult)}</div>);
                }
              }
            </Execute>
          </div>
          <div style={{ height: 300 }}>
            <ColumnChart
              projectId={projectId}
              measures={[actionItemsMeasure]}
              viewBy={categoryHelper}
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
            <LineChart
              projectId={projectId}
              measures={[actionItemsMeasure]}
              trendBy={categoryHelper}
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
