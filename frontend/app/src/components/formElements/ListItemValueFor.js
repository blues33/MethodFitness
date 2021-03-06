import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import uuid from 'uuid';

const ListItemValueFor = ({ data }) => {
  let inputStyle = classNames('editor__container__input', {
    editor__success: !data.invalid, // eslint-disable-line camelcase
    editor__error: data.invalid, // eslint-disable-line camelcase
  });

  const required = data.rules.some(x => x.rule === 'required') ? '*' : '';
  return (
    <div className="editor_container">
      {data.value.map(i => {
        return (
          <div
            className="list__item__value"
            key={i.item ? i.item.display : uuid.v4()}
          >
            <label
              className="editor__container__label"
              htmlFor={data.items.name}
            >
              {i.item ? i.item.display : '' + required}
            </label>
            <input
              className={inputStyle}
              style={{ width: '30%' }}
              placeholder={data.placeholder}
              name={data.items.name}
              value={i.value}
              onChange={data.onChange}
            />
          </div>
        );
      })}
    </div>
  );
};

ListItemValueFor.propTypes = {
  data: PropTypes.object,
};

export default ListItemValueFor;
