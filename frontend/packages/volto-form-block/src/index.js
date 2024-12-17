import { defineMessages } from 'react-intl';
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

import { schemaFormBlockSchema } from 'volto-form-block/schemaFormBlock/schema';
import schemaFormBlockEdit from 'volto-form-block/schemaFormBlock/EditSchemaForm';
import schemaFormBlockView from 'volto-form-block/schemaFormBlock/ViewSchemaForm';

import HoneypotCaptchaWidget from 'volto-form-block/schemaFormBlock/Widgets/HoneypotCaptchaWidget';
import NorobotsCaptchaWidget from 'volto-form-block/schemaFormBlock/Widgets/NorobotsCaptchaWidget';

export {
  submitForm,
  getFormData,
  exportCsvFormData,
  sendOTP,
} from 'volto-form-block/actions';
export { isValidEmail };

defineMessages({
  textarea: {
    id: 'textarea',
    defaultMessage: 'Textarea',
  },
  radio_group: {
    id: 'radio_group',
    defaultMessage: 'Radio Group',
  },
  checkbox_group: {
    id: 'checkbox_group',
    defaultMessage: 'Checkbox Group',
  },
  hidden: {
    id: 'hidden',
    defaultMessage: 'Hidden',
  },
  static_text: {
    id: 'static_text',
    defaultMessage: 'Static Text',
  },
  number: {
    id: 'number',
    defaultMessage: 'Number',
  },
  time: {
    id: 'time',
    defaultMessage: 'Time',
  },
});

const applyConfig = (config) => {
  config.widgets.widget.honeypot = HoneypotCaptchaWidget;
  config.widgets.widget['norobots-captcha'] = NorobotsCaptchaWidget;

  config.blocks.blocksConfig = {
    ...config.blocks.blocksConfig,
    schemaForm: {
      id: 'schemaForm',
      title: 'Form',
      icon: formSVG,
      group: 'text',
      view: schemaFormBlockView,
      edit: schemaFormBlockEdit,
      formSchema: FormSchema,
      widgets: null,
      component: null,
      buttonComponent: null,
      blockSchema: schemaFormBlockSchema,
      fieldSchema: FieldSchema,
      captchaProvidersVocabulary:
        'collective.volto.formsupport.captcha.providers',
      mailTemplatesVocabulary: 'collective.volto.formsupport.mail.templates',
      disableEnter: true,
      filterFactory: [
        'label_text_field',
        'label_choice_field',
        'label_boolean_field',
        'label_date_field',
        'label_datetime_field',
        'File Upload',
        'label_email',
        'radio_group',
        'checkbox_group',
        'hidden',
        'static_text',
        'number',
        'textarea',
        'time',
      ],
      additionalFactory: [
        { value: 'textarea', label: 'Textarea' },
        { value: 'radio_group', label: 'Radio Group' },
        { value: 'checkbox_group', label: 'Checkbox Group' },
        { value: 'hidden', label: 'Hidden' },
        { value: 'static_text', label: 'Static Text' },
        { value: 'number', label: 'Number' },
        { value: 'time', label: 'Time' },
      ],
      filterFactorySend: ['static_text'],
      defaultSender: 'noreply@plone.org',
      defaultSenderName: 'Plone',
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
