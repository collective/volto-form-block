import loadable from '@loadable/component';
import formSVG from '@plone/volto/icons/form.svg';

import {
  View,
  Edit,
  FormView,
  Sidebar,
  EditBlock,
  Field,
} from 'volto-form-block/components';

import { downloadFile, getFieldName } from 'volto-form-block/components/utils';
import {
  submitForm,
  getFormData,
  exportCsvFormData,
  clearFormData,
  sendOTP,
  subblocksIDList,
} from 'volto-form-block/reducers';
import FormSchema from 'volto-form-block/formSchema';
import FieldSchema from 'volto-form-block/fieldSchema';
import {
  SelectionSchemaExtender,
  FromSchemaExtender,
  HiddenSchemaExtender,
} from './components/FieldTypeSchemaExtenders';
import {
  isValidEmail,
  validateDefaultFrom,
  validateDefaultTo,
} from 'volto-form-block/helpers/validators';
import VisibilityConditionsWidget from 'volto-form-block/components/Widget/VisibilityConditionsWidget';

export {
  submitForm,
  getFormData,
  exportCsvFormData,
  sendOTP,
} from 'volto-form-block/actions';
export { isValidEmail };

const applyConfig = (config) => {
  config.widgets.widget.visibility_conditions_widget =
    VisibilityConditionsWidget;

  config.blocks.blocksConfig = {
    ...config.blocks.blocksConfig,
    form: {
      id: 'form',
      title: 'Form',
      icon: formSVG,
      group: 'text',
      view: View,
      edit: Edit,
      formSchema: FormSchema,
      fieldSchema: FieldSchema,
      additionalFields: [],
      fieldTypeSchemaExtenders: {
        select: SelectionSchemaExtender,
        single_choice: SelectionSchemaExtender,
        multiple_choice: SelectionSchemaExtender,
        from: FromSchemaExtender,
        hidden: HiddenSchemaExtender,
      },
      schemaValidators: {
        /*fieldname: validationFN(data)*/
        default_from: (data, intl) => {
          return validateDefaultFrom(data.default_from, intl);
        },
        default_to: (data, intl) => {
          return validateDefaultTo(data.default_to, intl);
        },
      },
      attachment_fields: ['attachment'],
      enableConditionalFields: true,
      enableDatatableView: true,
      restricted: false,
      mostUsed: true,
      security: {
        addPermission: [],
        view: [],
      },
      sidebarTab: 1,
    },
  };

  config.addonReducers = {
    ...config.addonReducers,
    submitForm,
    formData: getFormData,
    exportCsvFormData,
    clearFormData,
    sendOTP,
    subblocksIDList,
  };

  config.settings.loadables['HCaptcha'] = loadable(
    () => import('@hcaptcha/react-hcaptcha'),
  );
  config.settings.loadables['GoogleReCaptcha'] = loadable.lib(
    () => import('react-google-recaptcha-v3'),
  );
  config.settings.loadables['ReactTable'] = loadable.lib(
    () => import('@tanstack/react-table'),
  );
  return config;
};

export default applyConfig;
export {
  View,
  Edit,
  Sidebar,
  FormView,
  EditBlock,
  Field,
  downloadFile,
  getFieldName,
};
