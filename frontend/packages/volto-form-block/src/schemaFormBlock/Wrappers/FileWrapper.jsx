import { useRef } from 'react';
import PropTypes from 'prop-types';
import config from '@plone/volto/registry';
import { readAsDataURL } from 'promise-file-reader';
import { defineMessages, injectIntl } from 'react-intl';

import FormFieldWrapper from './FormFieldWrapper';

const messages = defineMessages({
  required: {
    id: 'form_required',
    defaultMessage: 'Required',
  },
});

const FileWrapper = (props) => {
  const {
    id,
    value,
    onChange,
    isDisabled,
    title,
    description,
    accept,
    size,
    required,
    intl,
  } = props;

  const ref = useRef();
  const Widget = config.blocks.blocksConfig.schemaForm.innerWidgets.file;

  return (
    <FormFieldWrapper {...props} className="text">
      <Widget
        id={`field-${id}`}
        name={id}
        labelFile={value?.filename || ''}
        label={title}
        description={description}
        isRequired={required}
        labelRequired={intl.formatMessage(messages.required)}
        disabled={isDisabled}
        accept={accept}
        size={size}
        onSelect={(files) => {
          if (files.length < 1) return;
          const file = files[0];
          readAsDataURL(file).then((data) => {
            const fields = data.match(/^data:(.*);(.*),(.*)$/);
            onChange(id, {
              data: fields[3],
              encoding: fields[2],
              'content-type': fields[1],
              filename: file.name,
            });
          });
        }}
        deleteFilesCallback={() => {
          onChange(id, null);
        }}
        ref={ref}
      />
    </FormFieldWrapper>
  );
};

export default injectIntl(FileWrapper);

FileWrapper.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  required: PropTypes.bool,
  error: PropTypes.arrayOf(PropTypes.string),
  value: PropTypes.object,
  focus: PropTypes.bool,
  onChange: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  accept: PropTypes.string,
  size: PropTypes.number,
};
