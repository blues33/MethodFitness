import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {Col} from 'antd';
import ListItemValueDisplayFor from './ListItemValueDisplayFor';

const DisplayFor = ({ data, selectOptions, span }) => {
  moment.locale('en');
  const _span = function() {
    switch (data['x-input'] || data.type) {
      case 'color-picker': {
        return (
          <span data-id={data.name} className="display__container__value__color"
            style={{ backgroundColor: data.value }}>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          </span>
        );
      }
      case 'date-time': {
        return <span data-id={data.name}>{moment(data.value).format('L')}</span>;
      }
      case 'select': {
        if (!data.value) {
          return;
        }
        const find = selectOptions.find(y => y.value === data.value);
        const textValue = find && find.display;
        return <span data-id={data.name}>{textValue}</span>;
      }
      case 'multi-select': {
        if (!data.value || selectOptions.length <= 0) {
          return;
        }
        // thought about being defensive here but decided if it's not in the values then fuck it throw.
        const textValues = data.value.map(x => selectOptions.find(y => y.value === x).display);
        return (
          <ul data-id={data.name}>
            {textValues.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        );
      }
      case 'listItemValue': {
        return (<ListItemValueDisplayFor data={data} />);
      }
      default: {
        return <span data-id={data.name}>{data.value.display || data.value.id || data.value}</span>;
      }
    }
  };

  return (
    <Col xl={span || 12} lg={span || 10} sm={span || 12} xs={24} style={{ marginBottom: '15px' }}>
      <Col xl={10} lg={10} sm={12} xs={24}>
        <label className="display__container__label ant-form-item-label"><span>{data.label}</span></label>
      </Col>
      <Col xl={14} lg={14} xs={24}>
        <div className="display__container__value" >{_span()}</div>
      </Col>
    </Col>
  );
};

DisplayFor.propTypes = {
  data: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  span: PropTypes.number,
  selectOptions: PropTypes.array
};

export default DisplayFor;
