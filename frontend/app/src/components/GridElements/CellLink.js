import { browserHistory } from 'react-router';
import React from 'react';
import PropTypes from 'prop-types';

const CellLink = (route, idName = 'id') => {
  const link = ( value, row ) => {
    const fullRoute = route + '/' + (row ? row[idName] : 0);
    return (
      <div onClick={() => browserHistory.push(fullRoute)} className="list__cell__link">
        <span>{value}</span>
      </div>
    );
  };
  link.propTypes = {
    value: PropTypes.string,
    row: PropTypes.object
  };

  return link;
};

CellLink.propTypes = {
  route: PropTypes.string
};

export default CellLink;
