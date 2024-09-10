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

import {
  schemaFormBlockSchema,
  enhanceEmailActionSchema,
  enhanceStoreActionSchema,
} from 'volto-form-block/schemaFormBlock/schema';
import schemaFormBlockEdit from 'volto-form-block/schemaFormBlock/EditSchemaForm';
import schemaFormBlockView from 'volto-form-block/schemaFormBlock/ViewSchemaForm';
import HoneypotCaptchaWidget from 'volto-form-block/schemaFormBlock/HoneypotCaptchaWidget';

export {
  submitForm,
  getFormData,
  exportCsvFormData,
  sendOTP,
} from 'volto-form-block/actions';
export { isValidEmail };

const applyConfig = (config) => {
  config.widgets.widget.honeypot = HoneypotCaptchaWidget;

  config.blocks.blocksConfig = {
    ...config.blocks.blocksConfig,
    schemaForm: {
      id: 'schemaForm',
      title: 'schemaForm',
      icon: formSVG,
      group: 'text',
      view: schemaFormBlockView,
      edit: schemaFormBlockEdit,
      formSchema: FormSchema,
      blockSchema: schemaFormBlockSchema,
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
      restricted: false,
      mostUsed: true,
      security: {
        addPermission: [],
        view: [],
      },
      sidebarTab: 1,
      formActions: {
        email: {
          schemaEnhancer: enhanceEmailActionSchema,
        },
        store: {
          schemaEnhancer: enhanceStoreActionSchema,
        },
      },
    },
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
  };

  config.settings.loadables['HCaptcha'] = loadable(
    () => import('@hcaptcha/react-hcaptcha'),
  );
  config.settings.loadables['GoogleReCaptcha'] = loadable.lib(
    () => import('react-google-recaptcha-v3'),
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
