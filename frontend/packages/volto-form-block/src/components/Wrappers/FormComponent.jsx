import PropTypes from 'prop-types';
import _ from 'lodash';

const FormComponent = (props) => {
  const { children, error } = props;

  const handleSubmit = (e, ...args) => {
    if (typeof action !== 'string') _.invoke(e, 'preventDefault');
    _.invoke(props, 'onSubmit', e, props, ...args);
  };

  return (
    <form onSubmit={handleSubmit} className={error ? 'error' : ''}>
      {children}
    </form>
  );
};

export default FormComponent;

FormComponent.propTypes = {
  children: PropTypes.node,
  onSubmit: PropTypes.func,
  error: PropTypes.bool,
};
